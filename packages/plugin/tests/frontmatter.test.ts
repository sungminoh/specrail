// TC-57: EDGE-18 empty frontmatter rejection
import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../src/markdown/frontmatter.js';

describe('parseFrontmatter (F1.1, F1.2, AC-R1-1, ADR-4, TC-1, TC-57, EDGE-18)', () => {
  it('extracts frontmatter object', () => {
    const raw = `---
phase: 1
status: Draft
---
# Body content`;
    const r = parseFrontmatter(raw);
    expect(r.frontmatter).toEqual({ phase: 1, status: 'Draft' });
    expect(r.hasFrontmatter).toBe(true);
  });

  it('preserves body without frontmatter prefix', () => {
    const raw = `---
phase: 2
status: Approved
---
# Phase 2

Body text here.`;
    const r = parseFrontmatter(raw);
    expect(r.body).toContain('# Phase 2');
    expect(r.body).toContain('Body text here.');
    expect(r.body).not.toContain('phase: 2');
  });

  it('returns empty frontmatter when none', () => {
    const raw = '# Just markdown, no frontmatter';
    const r = parseFrontmatter(raw);
    expect(r.hasFrontmatter).toBe(false);
    expect(r.frontmatter).toEqual({});
    expect(r.body).toBe(raw);
  });

  it('parses inline arrays', () => {
    const raw = `---
refs: [R1, F1.2, S1.2.3]
---
body`;
    const r = parseFrontmatter(raw);
    expect(r.frontmatter.refs).toEqual(['R1', 'F1.2', 'S1.2.3']);
  });

  it('parses block-style arrays', () => {
    const raw = `---
refs:
  - R1
  - F1.2
  - S1.2.3
---
body`;
    const r = parseFrontmatter(raw);
    expect(r.frontmatter.refs).toEqual(['R1', 'F1.2', 'S1.2.3']);
  });

  it('coerces booleans and numbers', () => {
    const raw = `---
phase: 5
approved: true
draft: false
note: null
---
body`;
    const r = parseFrontmatter(raw);
    expect(r.frontmatter.phase).toBe(5);
    expect(r.frontmatter.approved).toBe(true);
    expect(r.frontmatter.draft).toBe(false);
    expect(r.frontmatter.note).toBeNull();
  });

  it('strips quotes from values', () => {
    const raw = `---
title: "sample plugin"
mode: 'HOLD_SCOPE'
---
body`;
    const r = parseFrontmatter(raw);
    expect(r.frontmatter.title).toBe('sample plugin');
    expect(r.frontmatter.mode).toBe('HOLD_SCOPE');
  });

  it('handles 한국어 in values (NFR-I18N-1)', () => {
    const raw = `---
title: "한국어 우선 spec"
phase: 1
---
# 한국어 본문`;
    const r = parseFrontmatter(raw);
    expect(r.frontmatter.title).toBe('한국어 우선 spec');
    expect(r.body).toContain('한국어 본문');
  });
});
