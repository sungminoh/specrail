// US-T5.4 — Frontmatter inject runtime tests (F1.2)
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getInputFromPhase, formatInputBlock } from '../src/skill/inject.js';
import { composeSkillPrompt } from '../src/skill/inheritance.js';

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'inject-test-'));
  await mkdir(join(projectRoot, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe('getInputFromPhase (US-T5.4, F1.2)', () => {
  it('returns frontmatter from matching phase file', async () => {
    await writeFile(
      join(projectRoot, 'docs', 'spec', '01-discovery.md'),
      `---
phase: 1
status: Approved
owner: alice
---
# Discovery body`,
    );
    const fm = await getInputFromPhase(projectRoot, 1);
    expect(fm).toEqual({ phase: 1, status: 'Approved', owner: 'alice' });
  });

  it('returns empty object when phase file does not exist', async () => {
    const fm = await getInputFromPhase(projectRoot, 99);
    expect(fm).toEqual({});
  });

  it('returns empty object when spec dir does not exist', async () => {
    const missingRoot = join(tmpdir(), 'no-such-dir-' + Date.now());
    const fm = await getInputFromPhase(missingRoot, 1);
    expect(fm).toEqual({});
  });

  it('returns empty object when file has no frontmatter block', async () => {
    await writeFile(
      join(projectRoot, 'docs', 'spec', '02-scoping.md'),
      '# Just a markdown file with no frontmatter',
    );
    const fm = await getInputFromPhase(projectRoot, 2);
    expect(fm).toEqual({});
  });

  it('handles multi-phase chain: phase 4 reads phase 3 frontmatter', async () => {
    // Write phase 1, 2, 3 specs
    await writeFile(
      join(projectRoot, 'docs', 'spec', '01-discovery.md'),
      `---\nphase: 1\nstatus: Done\n---\nbody1`,
    );
    await writeFile(
      join(projectRoot, 'docs', 'spec', '02-scoping.md'),
      `---\nphase: 2\nstatus: Done\n---\nbody2`,
    );
    await writeFile(
      join(projectRoot, 'docs', 'spec', '03-design.md'),
      `---\nphase: 3\nstatus: Approved\ndecision: option-A\n---\nbody3`,
    );

    // Phase 4 reads phase 3 frontmatter as inputs
    const fm = await getInputFromPhase(projectRoot, 3);
    expect(fm).toEqual({ phase: 3, status: 'Approved', decision: 'option-A' });

    // Independently verify phase 1 and 2 are accessible
    const fm1 = await getInputFromPhase(projectRoot, 1);
    expect(fm1.phase).toBe(1);
    const fm2 = await getInputFromPhase(projectRoot, 2);
    expect(fm2.phase).toBe(2);
  });
});

describe('formatInputBlock (US-T5.4)', () => {
  it('produces comment header and key-value lines', () => {
    const block = formatInputBlock({ phase: 3, status: 'Approved' }, 3);
    expect(block).toContain('<!-- F1.2 auto-inject: Phase 3 frontmatter -->');
    expect(block).toContain('- phase: 3');
    expect(block).toContain('- status: "Approved"');
  });

  it('returns only comment header for empty frontmatter', () => {
    const block = formatInputBlock({}, 5);
    expect(block).toBe('<!-- F1.2 auto-inject: Phase 5 frontmatter -->');
  });
});

describe('composeSkillPrompt with inputFrom (US-T5.4)', () => {
  it('prepends phase frontmatter when inputFrom provided', async () => {
    await writeFile(
      join(projectRoot, 'docs', 'spec', '02-scoping.md'),
      `---\nphase: 2\nstatus: Approved\n---\nbody`,
    );
    const out = await composeSkillPrompt('SKILL BODY', {
      includeCommon: false,
      inputFrom: { projectRoot, phase: 2 },
    });
    expect(out).toContain('F1.2 auto-inject: Phase 2 frontmatter');
    expect(out).toContain('- phase: 2');
    expect(out).toContain('SKILL BODY');
    // inject block must appear before skill body
    expect(out.indexOf('F1.2 auto-inject')).toBeLessThan(out.indexOf('SKILL BODY'));
  });

  it('skips inject block when phase file missing', async () => {
    const out = await composeSkillPrompt('SKILL BODY', {
      includeCommon: false,
      inputFrom: { projectRoot, phase: 99 },
    });
    expect(out).not.toContain('F1.2 auto-inject');
    expect(out).toBe('SKILL BODY');
  });

  it('regression: no inputFrom preserves existing behavior', async () => {
    const out = await composeSkillPrompt('BODY', { includeCommon: false });
    expect(out).toBe('BODY');
  });
});
