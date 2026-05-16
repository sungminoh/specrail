// T-CSA.11 + T-CSA.12 — skill body + principles.md teach attrs convention
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.11 + T-CSA.12

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('T-CSA.12 — principles.md §Attrs Blocks Are Mandatory', () => {
  it('section heading exists', async () => {
    const raw = await readFile('skills/_common/principles.md', 'utf8');
    expect(raw).toContain('## Attrs Blocks Are Mandatory');
  });

  it('references schemas/attrs.schema.json', async () => {
    const raw = await readFile('skills/_common/principles.md', 'utf8');
    expect(raw).toContain('attrs.schema.json');
  });

  it('lists 8 closed-enum edge kinds', async () => {
    const raw = await readFile('skills/_common/principles.md', 'utf8');
    for (const kind of [
      'solves',
      'linked-features',
      'parent',
      'tested-by',
      'covers-ac',
      'mitigates',
      'linked-arch',
      'depends-on',
    ]) {
      expect(raw).toContain(`\`${kind}\``);
    }
  });

  it('documents WARN/ERROR version gate', async () => {
    const raw = await readFile('skills/_common/principles.md', 'utf8');
    expect(raw).toContain('v0.5.0');
    expect(raw).toContain('WARN');
    expect(raw).toContain('ERROR');
  });
});

describe('T-CSA.11 — every phase skill contains a specrail:attrs example', () => {
  it('all 13 skills/phase-*/SKILL.md mention specrail:attrs', async () => {
    const dirs = await readdir('skills');
    const phaseDirs = dirs.filter((d) => d.startsWith('phase-')).sort();
    expect(phaseDirs.length).toBe(13);

    for (const phaseDir of phaseDirs) {
      const raw = await readFile(join('skills', phaseDir, 'SKILL.md'), 'utf8');
      expect(raw, `${phaseDir}/SKILL.md missing specrail:attrs example`).toContain(
        'specrail:attrs',
      );
    }
  });
});
