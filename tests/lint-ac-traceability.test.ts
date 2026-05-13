import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkAcCoverage } from '../src/lint/ac-traceability.js';

async function setupFixture(
  specContent: string | null,
  testContents: Record<string, string>,
  opts: { specInExamples?: boolean } = {},
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'ac-trace-'));

  if (specContent !== null) {
    const specDir = opts.specInExamples
      ? join(root, 'docs', 'spec', 'examples')
      : join(root, 'docs', 'spec');
    await mkdir(specDir, { recursive: true });
    await writeFile(join(specDir, '13-implementation-plan.md'), specContent, 'utf8');
  }

  const testsDir = join(root, 'tests');
  await mkdir(testsDir, { recursive: true });
  for (const [name, content] of Object.entries(testContents)) {
    await writeFile(join(testsDir, name), content, 'utf8');
  }

  return root;
}

describe('AC Traceability (US-9.3)', () => {
  // TC-1: Full coverage — spec has 3 AC, tests have all 3 → coverage 100
  it('reports 100% coverage when all spec ACs appear in tests', async () => {
    const spec = '## Plan\n- AC-R1-1 done\n- AC-R1-2 done\n- AC-R2-1 done\n';
    const root = await setupFixture(spec, {
      'feature.test.ts': '// AC-R1-1 verified\n// AC-R1-2 checked\n// AC-R2-1 ok\n',
    });
    try {
      const r = await checkAcCoverage(root);
      expect(r.totalAc).toBe(3);
      expect(r.coveredAc).toBe(3);
      expect(r.missingAc).toHaveLength(0);
      expect(r.coverage).toBe(100);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  // TC-2: Partial — spec has 5 AC, tests have 3 → missingAc has 2 items, coverage 60
  it('reports 60% coverage when 3 of 5 spec ACs appear in tests', async () => {
    const spec =
      '- AC-R1-1\n- AC-R1-2\n- AC-R1-3\n- AC-R2-1\n- AC-R2-2\n';
    const root = await setupFixture(spec, {
      'partial.test.ts': 'AC-R1-1 AC-R1-2 AC-R1-3',
    });
    try {
      const r = await checkAcCoverage(root);
      expect(r.totalAc).toBe(5);
      expect(r.coveredAc).toBe(3);
      expect(r.missingAc).toHaveLength(2);
      expect(r.missingAc).toContain('AC-R2-1');
      expect(r.missingAc).toContain('AC-R2-2');
      expect(r.coverage).toBe(60);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  // TC-3: No spec file — both attempted paths missing → coverage 0, specSource 'none'
  it('returns specSource none and coverage 0 when no spec file exists', async () => {
    const root = await setupFixture(null, {});
    try {
      const r = await checkAcCoverage(root);
      expect(r.totalAc).toBe(0);
      expect(r.coveredAc).toBe(0);
      expect(r.missingAc).toHaveLength(0);
      expect(r.coverage).toBe(0);
      expect(r.specSource).toBe('none');
    } finally {
      await rm(root, { recursive: true });
    }
  });

  // TC-4: No tests dir — spec has 5 AC, tests empty → missingAc has all 5
  it('reports all ACs missing when tests directory is empty', async () => {
    const spec = '- AC-R3-1\n- AC-R3-2\n- AC-R3-3\n- AC-R4-1\n- AC-R4-2\n';
    const root = await setupFixture(spec, {}); // no test files
    try {
      const r = await checkAcCoverage(root);
      expect(r.totalAc).toBe(5);
      expect(r.coveredAc).toBe(0);
      expect(r.missingAc).toHaveLength(5);
      expect(r.coverage).toBe(0);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  // TC-5: Real fixture round-trip — spec with AC-R3-1, AC-R3-2; tests with AC-R3-1 → 50%
  it('round-trip: spec AC-R3-1 + AC-R3-2, tests only AC-R3-1 → 50%', async () => {
    const spec = 'AC-R3-1 requirement\nAC-R3-2 requirement\n';
    const root = await setupFixture(spec, {
      'roundtrip.test.ts': "it('AC-R3-1 test', () => {});",
    });
    try {
      const r = await checkAcCoverage(root);
      expect(r.totalAc).toBe(2);
      expect(r.coveredAc).toBe(1);
      expect(r.missingAc).toEqual(['AC-R3-2']);
      expect(r.coverage).toBe(50);
      expect(r.specSource).toContain('13-implementation-plan.md');
    } finally {
      await rm(root, { recursive: true });
    }
  });

  // TC-6: examples/ path takes priority over plain docs/spec/
  it('prefers docs/spec/examples/ over docs/spec/', async () => {
    const specExamples = 'AC-R5-1\nAC-R5-2\n';
    const specPlain = 'AC-R9-1\nAC-R9-2\nAC-R9-3\n';
    const root = await mkdtemp(join(tmpdir(), 'ac-trace-'));
    try {
      // Write both paths
      await mkdir(join(root, 'docs', 'spec', 'examples'), { recursive: true });
      await writeFile(
        join(root, 'docs', 'spec', 'examples', '13-implementation-plan.md'),
        specExamples,
        'utf8',
      );
      await writeFile(
        join(root, 'docs', 'spec', '13-implementation-plan.md'),
        specPlain,
        'utf8',
      );
      await mkdir(join(root, 'tests'), { recursive: true });

      const r = await checkAcCoverage(root);
      // Should read from examples/ (2 ACs), not plain spec (3 ACs)
      expect(r.totalAc).toBe(2);
      expect(r.specSource).toContain('examples');
    } finally {
      await rm(root, { recursive: true });
    }
  });
});
