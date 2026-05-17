import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { IdPreview } from './idIndex.js';

interface State {
  id: string;
  preview: IdPreview;
  anchor: DOMRect;
}

interface Props {
  /** Index built from `buildIdIndex(phases)`. */
  index: Map<string, IdPreview>;
  /** CSS selector for ID chips. */
  selector?: string;
}

/** Mount-once popover that listens for hover on `.id-chip` elements and renders a preview. */
export function IdPopover({ index, selector = '.id-chip' }: Props) {
  const [state, setState] = useState<State | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cancelClose = () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
    const scheduleClose = () => {
      cancelClose();
      closeTimer.current = setTimeout(() => setState(null), 100);
    };

    const onEnter = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.matches !== 'function' || !target.matches(selector)) return;
      const id = target.textContent?.trim() ?? '';
      const preview = index.get(id);
      if (!preview) return;
      cancelClose();
      setState({ id, preview, anchor: target.getBoundingClientRect() });
    };
    const onLeave = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.matches !== 'function' || !target.matches(selector)) return;
      scheduleClose();
    };
    document.addEventListener('mouseover', onEnter, true);
    document.addEventListener('mouseout', onLeave, true);
    return () => {
      cancelClose();
      document.removeEventListener('mouseover', onEnter, true);
      document.removeEventListener('mouseout', onLeave, true);
    };
  }, [index, selector]);

  if (!state) return null;
  return <PopoverPositioned state={state} onClose={() => setState(null)} />;
}

function PopoverPositioned({ state, onClose }: { state: State; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean }>({ left: 0, top: 0, below: true });
  useLayoutEffect(() => {
    const POPOVER_W = 360;
    const a = state.anchor;
    const viewportH = window.innerHeight;
    const room = viewportH - a.bottom;
    const below = room > 160;
    const top = below ? a.bottom + 6 : Math.max(8, a.top - 6);
    const left = Math.min(window.innerWidth - POPOVER_W - 8, Math.max(8, a.left));
    setPos({ left, top, below });
  }, [state]);
  return (
    <div
      ref={ref}
      className={`id-popover${pos.below ? '' : ' above'}`}
      style={{ left: pos.left, top: pos.top }}
      onMouseEnter={() => onClose}
      role="tooltip"
    >
      <div className="id-popover-header mono">
        <span className="id-popover-id">{state.preview.id}</span>
        {state.preview.kind && <span className="id-popover-kind">{state.preview.kind}</span>}
        <span className="id-popover-loc">phase {String(state.preview.phase).padStart(2, '0')} · line {state.preview.line}</span>
      </div>
      <div className="id-popover-preview">{state.preview.preview}</div>
    </div>
  );
}
