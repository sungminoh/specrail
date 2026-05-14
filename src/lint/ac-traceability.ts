/**
 * AC Traceability auto-grep (US-9.3, M9)
 *
 * Checks whether every Acceptance Criteria label (`AC-R{n}-{m}`) that appears
 * in the implementation-plan spec is also referenced in at least one test file
 * under tests/.
 *
 * Spec lookup order:
 *   1. docs/spec/examples/13-implementation-plan.md
 *   2. docs/spec/13-implementation-plan.md
 *   3. Neither found → empty result (specSource: 'none')
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig } from '../config/index.js';

export interface AcCoverageResult {
  totalAc: number;
  coveredAc: number;
  missingAc: string[];
  /** 0..100 percentage, rounded to 1 decimal */
  coverage: number;
  /** path scanned for AC labels, or 'none' */
  specSource: string;
}

export interface CheckAcCoverageOptions {
  /** Override test file suffix (default: loaded from .plan-pipeline.config.json or '.test.ts') */
  readonly testFilePattern?: string;
}

const AC_PATTERN = /AC-R\d+-\d+/g;

/** Extract all unique AC labels from text, sorted. */
function extractAcLabels(text: string): string[] {
  const matches = text.match(AC_PATTERN) ?? [];
  return [...new Set(matches)].sort();
}

/** Resolve the spec file path, trying examples/ first. */
async function resolveSpecPath(projectRoot: string): Promise<string | null> {
  const candidates = [
    join(projectRoot, 'docs', 'spec', 'examples', '13-implementation-plan.md'),
    join(projectRoot, 'docs', 'spec', '13-implementation-plan.md'),
  ];
  for (const p of candidates) {
    try {
      await stat(p);
      return p;
    } catch {
      // not found — try next
    }
  }
  return null;
}

/** Recursively collect all test files matching the configured suffix. */
async function collectTestFiles(dir: string, suffix: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const results: string[] = [];
  await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry);
      let s;
      try {
        s = await stat(full);
      } catch {
        return;
      }
      if (s.isDirectory()) {
        const nested = await collectTestFiles(full, suffix);
        results.push(...nested);
      } else if (entry.endsWith(suffix)) {
        results.push(full);
      }
    }),
  );
  return results;
}

/**
 * Check AC coverage: compare AC labels in spec vs AC labels in tests.
 *
 * @param projectRoot - Absolute or relative path to the project root
 * @returns AcCoverageResult
 */
export async function checkAcCoverage(
  projectRoot: string,
  options: CheckAcCoverageOptions = {},
): Promise<AcCoverageResult> {
  // 1. Locate spec
  const specPath = await resolveSpecPath(projectRoot);
  if (specPath === null) {
    return { totalAc: 0, coveredAc: 0, missingAc: [], coverage: 0, specSource: 'none' };
  }

  // 2. Extract AC labels from spec
  const specText = await readFile(specPath, 'utf8');
  const specAc = extractAcLabels(specText);

  // 3. Resolve test file pattern — explicit option > config file > default
  const testFilePattern =
    options.testFilePattern ?? (await loadConfig(projectRoot)).testFilePattern;

  // 4. Collect AC labels from all test files
  const testsDir = join(projectRoot, 'tests');
  const testFiles = await collectTestFiles(testsDir, testFilePattern);
  const testTexts = await Promise.all(testFiles.map((f) => readFile(f, 'utf8')));
  const allTestText = testTexts.join('\n');
  const testedAc = new Set(extractAcLabels(allTestText));

  // 4. Compute coverage
  const coveredAc = specAc.filter((ac) => testedAc.has(ac));
  const missingAc = specAc.filter((ac) => !testedAc.has(ac));

  const total = specAc.length;
  const covered = coveredAc.length;
  const coverage = total === 0 ? 100 : Math.round((covered / total) * 1000) / 10;

  return {
    totalAc: total,
    coveredAc: covered,
    missingAc,
    coverage,
    specSource: specPath,
  };
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] ?? '.';
  checkAcCoverage(root).then((r) => {
    console.log(`AC Coverage: ${r.coveredAc}/${r.totalAc} (${r.coverage}%)`);
    console.log(`Source: ${r.specSource}`);
    if (r.missingAc.length > 0) {
      console.log('Missing in tests:');
      for (const ac of r.missingAc) console.log(`  - ${ac}`);
    }
    process.exit(r.coverage >= 80 ? 0 : 1);
  });
}
