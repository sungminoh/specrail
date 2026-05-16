// lint:plan — project-time orchestrator (architect M9 condition C2).
// Runs 4 static checks: anti-sycophancy, INV-7, AC traceability, INV-5.
// atomic-commit is NOT bundled here — it is a commit-time check requiring
// git staged-files context. Invoke separately: see src/lint/atomic-commit.ts
// for pre-commit hook wiring instructions.

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { scanProject } from './anti-sycophancy.js';
import { checkAcCoverage } from './ac-traceability.js';
import { checkInv7File, checkInv5 } from './inv-enforce.js';
import { lintAttrs } from './attrs-lint.js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

export interface SingleLintReport {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  count?: number;
}

export interface LintReport {
  reports: SingleLintReport[];
  overall: 'PASS' | 'FAIL';
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runAntiSycophancy(projectRoot: string): Promise<SingleLintReport> {
  const violations = await scanProject(projectRoot);
  const bare = violations.filter((v) => !v.hasEvidence);
  const status = bare.length > 0 ? 'FAIL' : 'PASS';
  return {
    name: 'anti-sycophancy',
    status,
    details: `${bare.length}/${violations.length} bare violations`,
    count: bare.length,
  };
}

// L-Round4-4: single-pass scan of spec dirs — coalesce ADR + AC discovery
// into one readFile per file (was 2× before).
interface SpecScan {
  adrFiles: string[];
  acFiles: string[];
}

const ADR_HEADING_RE = /^#{1,3}\s+ADR-\d+:/m;
const AC_REF_RE = /AC-R\d+-\d+/m;

async function scanSpecDirs(projectRoot: string): Promise<SpecScan> {
  const adrFiles: string[] = [];
  const acFiles: string[] = [];
  try {
    const dirPath = join(projectRoot, 'docs', 'spec');
    const files = await readdir(dirPath);
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const filePath = join(dirPath, f);
      const text = await readFile(filePath, 'utf8');
      if (ADR_HEADING_RE.test(text)) adrFiles.push(filePath);
      if (AC_REF_RE.test(text)) acFiles.push(filePath);
    }
  } catch { /* dir missing — skip */ }
  return { adrFiles, acFiles };
}

async function runInv7(files: string[]): Promise<SingleLintReport> {
  if (files.length === 0) {
    return { name: 'inv-7', status: 'PASS', details: 'no ADR file' };
  }
  let total = 0;
  for (const file of files) {
    const violations = await checkInv7File(file);
    total += violations.length;
  }
  return {
    name: 'inv-7',
    status: total > 0 ? 'FAIL' : 'PASS',
    details: total > 0 ? `${total} violations across ${files.length} files` : `PASS (${files.length} files)`,
    count: total,
  };
}

async function runAcTraceability(projectRoot: string): Promise<SingleLintReport> {
  const result = await checkAcCoverage(projectRoot);
  if (result.totalAc === 0) {
    return { name: 'ac-traceability', status: 'PASS', details: 'no AC spec' };
  }
  let status: 'PASS' | 'WARN' | 'FAIL';
  if (result.coverage >= 80) {
    status = 'PASS';
  } else if (result.coverage >= 50) {
    status = 'WARN';
  } else {
    status = 'FAIL';
  }
  return {
    name: 'ac-traceability',
    status,
    details: `${result.coveredAc}/${result.totalAc} (${result.coverage}%)`,
    count: result.totalAc - result.coveredAc,
  };
}

async function runInv5(files: string[]): Promise<SingleLintReport> {
  if (files.length === 0) {
    return { name: 'inv-5', status: 'PASS', details: 'no spec file' };
  }
  let total = 0;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const violations = checkInv5(text, file);
    total += violations.length;
  }
  return {
    name: 'inv-5',
    status: total > 0 ? 'FAIL' : 'PASS',
    details: total > 0 ? `${total} violations across ${files.length} files` : `PASS (${files.length} files)`,
    count: total,
  };
}

async function getPluginVersion(projectRoot: string): Promise<string> {
  try {
    const raw = await readFile(join(projectRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function runAttrsCheck(projectRoot: string, files: string[]): Promise<SingleLintReport> {
  if (files.length === 0) {
    return { name: 'attrs', status: 'PASS', details: 'no spec file' };
  }
  const pluginVersion = await getPluginVersion(projectRoot);
  let warns = 0;
  let errors = 0;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const r = lintAttrs(text, { pluginVersion, file });
    for (const f of r.findings) {
      if (f.level === 'error') errors++;
      else if (f.level === 'warn') warns++;
    }
  }
  // T-CSA.8 wire-up: WARN window (pre-v0.5.0) → status WARN, never FAIL.
  // ERROR window (v0.5.0+) or review-required markers → status FAIL.
  let status: 'PASS' | 'WARN' | 'FAIL';
  if (errors > 0) status = 'FAIL';
  else if (warns > 0) status = 'WARN';
  else status = 'PASS';
  return {
    name: 'attrs',
    status,
    details:
      errors === 0 && warns === 0
        ? `PASS (${files.length} files, v${pluginVersion})`
        : `${errors} error(s) · ${warns} warn(s) across ${files.length} files (v${pluginVersion})`,
    count: errors + warns,
  };
}

export async function runAllChecks(
  projectRoot: string,
  options: { strict?: boolean } = {},
): Promise<LintReport> {
  const reports: SingleLintReport[] = [];

  // L-Round4-4: single spec scan shared between INV-7 and INV-5 (was 2 readFile per file)
  const scan = await scanSpecDirs(projectRoot);
  reports.push(await runAntiSycophancy(projectRoot));
  reports.push(await runInv7(scan.adrFiles));
  reports.push(await runAcTraceability(projectRoot));
  reports.push(await runInv5(scan.acFiles));
  // T-CSA.8 wire-up: attrs lint over both ADR and AC spec files.
  reports.push(await runAttrsCheck(projectRoot, [...new Set([...scan.adrFiles, ...scan.acFiles])]));

  const strict = options.strict ?? false;
  const overall = reports.some((r) => r.status === 'FAIL' || (strict && r.status === 'WARN'))
    ? 'FAIL'
    : 'PASS';
  return { reports, overall };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const strict = process.argv.includes('--strict');
  const root = process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) ?? '.';
  runAllChecks(root, { strict }).then((r) => {
    for (const sr of r.reports) {
      const icon = sr.status === 'PASS' ? '✓' : sr.status === 'WARN' ? '⚠' : '✗';
      console.log(`${icon} ${sr.name}: ${sr.details}`);
    }
    console.log(`\nOverall: ${r.overall}`);
    process.exit(r.overall === 'FAIL' ? 1 : 0);
  });
}
