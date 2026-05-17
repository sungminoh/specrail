// Build a fast in-memory index of {id → short preview} across all phases of a project.
// Used by MarkdownView for hover popovers and by QuickSwitcher for cmd+k.
import type { Phase } from '@specrail/core';

export interface IdPreview {
  id: string;
  phase: number;
  /** 1-based line number where the id was first defined. */
  line: number;
  /** First ~200 chars of the heading + following prose. */
  preview: string;
  /** Detected kind (R/F/S/NFR/…). */
  kind: string | null;
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/gm;
const ID_AT_START =
  /^\*{0,2}([RFS]\d+(?:\.\d+){0,2}|T\d+(?:\.\d+)?|NFR-[A-Z][A-Z0-9]*-\d+|TC-\d+|EDGE-\d+|AC-R\d+-\d+|INV-\d+|ADR-\d+|RISK-\d+|OPS-\d+|OQ-\d+-\d+|ARCH-\d+|EXT-\d+|KPI-\d+|PAIN-[A-Z0-9_-]*\d?|PERSONA-(?:EDGE-)?\d+|PERSONA-[A-Z]+(?:-\d+)?|SCEN-\d+|JNY-\d+\.\d+|ZN-[A-Z][A-Z0-9-]*-\d+|P-CC-\d+|E-CC-\d+|W-CC-[A-Z][A-Z0-9_-]*|FLN-\d+|FLE-\d+)\b/;

const ATTRS_MARKER_RE = /<!--\s*specrail:attrs\s+id=([^\s>]+)\s*-->/;

export function buildIdIndex(phases: Phase[]): Map<string, IdPreview> {
  const out = new Map<string, IdPreview>();
  for (const phase of phases) {
    const lines = phase.body.split('\n');
    HEADING_RE.lastIndex = 0;

    // Pass 1: heading-defined ids
    const headingPositions: Array<{ id: string; lineIdx: number; headingText: string }> = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const m = line.match(/^(#{1,6})\s+(.+)$/);
      if (!m) continue;
      const headingText = m[2] ?? '';
      const idMatch = headingText.match(ID_AT_START);
      if (idMatch?.[1]) {
        headingPositions.push({ id: idMatch[1], lineIdx: i, headingText });
      }
    }
    for (const h of headingPositions) {
      if (out.has(h.id)) continue;
      out.set(h.id, {
        id: h.id,
        phase: phase.number,
        line: h.lineIdx + 1,
        preview: collectPreview(lines, h.lineIdx, h.headingText.trim()),
        kind: classifyKindLocal(h.id),
      });
    }

    // Pass 2: attrs-block-defined ids (preview comes from nearest preceding heading or surrounding prose)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const m = line.match(ATTRS_MARKER_RE);
      if (!m) continue;
      const id = m[1];
      if (!id || out.has(id)) continue;
      out.set(id, {
        id,
        phase: phase.number,
        line: i + 1,
        preview: collectAttrsPreview(lines, i, id),
        kind: classifyKindLocal(id),
      });
    }
  }
  return out;
}

function collectPreview(lines: string[], headingLineIdx: number, seed: string): string {
  let preview = seed;
  for (let i = headingLineIdx + 1; i < Math.min(headingLineIdx + 8, lines.length); i++) {
    const line = (lines[i] ?? '').trim();
    if (!line) continue;
    if (line.startsWith('#')) break;
    if (line.startsWith('<!--')) continue;
    if (line.startsWith('```')) continue;
    preview += '\n' + line;
    if (preview.length > 200) break;
  }
  return preview.length > 200 ? preview.slice(0, 197) + '…' : preview;
}

function collectAttrsPreview(lines: string[], attrsLineIdx: number, id: string): string {
  // Try: nearest non-empty preceding non-attrs line (often a table row or heading).
  for (let i = attrsLineIdx - 1; i >= Math.max(0, attrsLineIdx - 6); i--) {
    const line = (lines[i] ?? '').trim();
    if (!line) continue;
    if (line.startsWith('<!--')) continue;
    // Use that line + first line of attrs yaml block as the preview.
    let preview = line;
    for (let j = attrsLineIdx + 1; j < Math.min(attrsLineIdx + 6, lines.length); j++) {
      const next = (lines[j] ?? '').trim();
      if (!next || next.startsWith('<!--') || next.startsWith('```')) continue;
      preview += '\n' + next;
      if (preview.length > 200) break;
    }
    return preview.length > 200 ? preview.slice(0, 197) + '…' : preview;
  }
  return `${id} (defined via attrs block at line ${attrsLineIdx + 1})`;
}

function classifyKindLocal(id: string): string | null {
  if (/^AC-/.test(id)) return 'AC';
  if (/^NFR-/.test(id)) return 'NFR';
  if (/^TC-/.test(id)) return 'TC';
  if (/^EDGE-/.test(id)) return 'EDGE';
  if (/^INV-/.test(id)) return 'INV';
  if (/^ADR-/.test(id)) return 'ADR';
  if (/^RISK-/.test(id)) return 'RISK';
  if (/^KPI-/.test(id)) return 'KPI';
  if (/^PERSONA-/.test(id)) return 'PERSONA';
  if (/^SCEN-/.test(id)) return 'SCEN';
  if (/^JNY-/.test(id)) return 'JNY';
  if (/^P-CC-/.test(id)) return 'P-CC';
  if (/^W-CC-/.test(id)) return 'W-CC';
  if (/^FLN-/.test(id)) return 'FLN';
  if (/^FLE-/.test(id)) return 'FLE';
  if (/^T\d/.test(id)) return 'T';
  if (/^R\d/.test(id)) return 'R';
  if (/^F\d/.test(id)) return 'F';
  if (/^S\d/.test(id)) return 'S';
  return null;
}
