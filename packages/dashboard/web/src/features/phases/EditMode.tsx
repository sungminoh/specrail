import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { api, ApiError } from '../../lib/api.js';
import type { PhaseNumber } from '@specrail/core';

interface Props {
  projectId: string;
  num: PhaseNumber;
  initialContent: string;
  initialMtimeMs: number;
  onSaved: (mtimeMs: number) => void;
  onCancel: () => void;
}

export function EditMode({ projectId, num, initialContent, initialMtimeMs, onSaved, onCancel }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState<{ expected: number; actual: number } | null>(null);
  const qc = useQueryClient();

  const saveMut = useMutation({
    mutationFn: () => {
      const content = viewRef.current?.state.doc.toString() ?? '';
      return api.writePhase(projectId, num, content, initialMtimeMs);
    },
    onSuccess: ({ mtimeMs }) => {
      setDirty(false);
      setConflict(null);
      qc.invalidateQueries({ queryKey: ['phase', projectId, num] });
      qc.invalidateQueries({ queryKey: ['phases', projectId] });
      onSaved(mtimeMs);
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.status === 409) {
        const body = e.message.replace(/^API \d+: /, '');
        try {
          const j = JSON.parse(body);
          setConflict({ expected: j.expected, actual: j.actual });
        } catch {
          setConflict({ expected: initialMtimeMs, actual: -1 });
        }
      } else {
        setConflict(null);
        alert((e as Error).message);
      }
    },
  });

  useEffect(() => {
    if (!hostRef.current) return;
    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
          {
            key: 'Mod-s',
            run: () => {
              saveMut.mutate();
              return true;
            },
          },
        ]),
        EditorView.theme(
          {
            '&': { height: '100%', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' },
            '.cm-content': { padding: '12px 0' },
            '.cm-scroller': { fontFamily: 'JetBrains Mono, monospace' },
          },
          { dark: true },
        ),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) setDirty(true);
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => view.destroy();
  }, [initialContent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (ev: BeforeUnloadEvent) => {
      if (dirty) ev.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return (
    <div className="edit-mode">
      <div className="edit-toolbar mono">
        <span className="mono">{dirty ? '● modified' : '○ saved'}</span>
        <div style={{ flex: 1 }} />
        <button
          className="btn-ghost"
          onClick={() => {
            if (dirty && !confirm('Discard unsaved changes?')) return;
            onCancel();
          }}
        >
          cancel
        </button>
        <button className="btn-primary" disabled={!dirty || saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? 'saving…' : 'cmd+s save'}
        </button>
      </div>
      <div ref={hostRef} className="edit-host" />
      {conflict && (
        <ConflictDialog
          expected={conflict.expected}
          actual={conflict.actual}
          onForce={() => {
            const content = viewRef.current?.state.doc.toString() ?? '';
            api
              .writePhase(projectId, num, content, conflict.actual)
              .then(({ mtimeMs }) => {
                setConflict(null);
                setDirty(false);
                onSaved(mtimeMs);
              })
              .catch((e) => alert((e as Error).message));
          }}
          onDiscard={() => {
            setConflict(null);
            onCancel();
          }}
          onCancel={() => setConflict(null)}
        />
      )}
    </div>
  );
}

function ConflictDialog({
  expected,
  actual,
  onForce,
  onDiscard,
  onCancel,
}: {
  expected: number;
  actual: number;
  onForce: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal>
      <div className="modal">
        <h2 className="display">⚠ External change detected</h2>
        <p>
          This file was modified after you opened it. Your changes were based on mtime{' '}
          <code className="mono">{Math.floor(expected)}</code>, but the file on disk is at{' '}
          <code className="mono">{Math.floor(actual)}</code>.
        </p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>
            Cancel (keep editing)
          </button>
          <button className="btn-ghost" onClick={onDiscard}>
            Discard my changes
          </button>
          <button className="btn-primary" onClick={onForce}>
            Force overwrite
          </button>
        </div>
      </div>
    </div>
  );
}
