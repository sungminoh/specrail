import { describe, it, expect } from 'vitest';
import { parsePhaseMarkdown, serializePhaseMarkdown } from '../src/frontmatter/index.js';

describe('parsePhaseMarkdown', () => {
  it('parses frontmatter + body', () => {
    const md = `---\nphase: 1\nstatus: Approved\n---\n# PRD\n\nbody text here.\n`;
    const r = parsePhaseMarkdown(md);
    expect(r.phaseNumber).toBe(1);
    expect(r.frontmatter['status']).toBe('Approved');
    expect(r.body).toContain('# PRD');
    expect(r.issues).toEqual([]);
  });

  it('handles file with no frontmatter', () => {
    const r = parsePhaseMarkdown('just markdown, no fm');
    expect(r.phaseNumber).toBeNull();
    expect(r.body).toBe('just markdown, no fm');
    expect(r.issues).toEqual([]);
  });

  it('returns issues when status field is invalid', () => {
    const md = `---\nphase: 3\nstatus: WeirdState\n---\nbody\n`;
    const r = parsePhaseMarkdown(md);
    expect(r.phaseNumber).toBe(3);
    expect(r.issues.length).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.includes('status'))).toBe(true);
  });

  it('round-trips frontmatter+body through serialize', () => {
    const md = `---\nphase: 2\nstatus: Draft\nmode: HOLD_SCOPE\n---\nHello.\n`;
    const parsed = parsePhaseMarkdown(md);
    const re = serializePhaseMarkdown(parsed.frontmatter, parsed.body);
    const reparsed = parsePhaseMarkdown(re);
    expect(reparsed.phaseNumber).toBe(2);
    expect(reparsed.frontmatter['status']).toBe('Draft');
    expect(reparsed.frontmatter['mode']).toBe('HOLD_SCOPE');
    expect(reparsed.body.trim()).toBe('Hello.');
  });
});
