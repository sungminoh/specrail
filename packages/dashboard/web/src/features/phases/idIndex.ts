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

export function buildIdIndex(phases: Phase[]): Map<string, IdPreview> {
  const out = new Map<string, IdPreview>();
  for (const phase of phases) {
    const lines = phase.body.split('\n');
    // First pass: heading definitions.
    HEADING_RE.lastIndex = 0;
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
    // Build preview = heading text + up to 200 chars of following prose (skipping blank lines).
    for (const h of headingPositions) {
      if (out.has(h.id)) continue;
      let preview = h.headingText.trim();
      // collect a few following non-blank, non-heading lines
      for (let i = h.lineIdx + 1; i < Math.min(h.lineIdx + 8, lines.length); i++) {
        const line = (lines[i] ?? '').trim();
        if (!line) continue;
        if (line.startsWith('#')) break;
        if (line.startsWith('<!--')) continue;
        if (line.startsWith('```')) continue;
        preview += '\n' + line;
        if (preview.length > 200) break;
      }
      if (preview.length > 200) preview = preview.slice(0, 197) + '…';
      out.set(h.id, {
        id: h.id,
        phase: phase.number,
        line: h.lineIdx + 1,
        preview,
        kind: classifyKindLocal(h.id),
      });
    }
  }
  return out;
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
