import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { scanProject } from './anti-sycophancy.js';
import { checkAcCoverage } from './ac-traceability.js';
import { checkInv7File, checkInv5 } from './inv-enforce.js';

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

async function runInv7(projectRoot: string): Promise<SingleLintReport> {
  const adrPath = join(projectRoot, 'docs', 'spec', 'examples', '12-adr-risks.md');
  if (!(await fileExists(adrPath))) {
    return { name: 'inv-7', status: 'PASS', details: 'no ADR file' };
  }
  const violations = await checkInv7File(adrPath);
  const status = violations.length > 0 ? 'FAIL' : 'PASS';
  return {
    name: 'inv-7',
    status,
    details: violations.length > 0 ? `${violations.length} violations` : 'PASS',
    count: violations.length,
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

async function runInv5(projectRoot: string): Promise<SingleLintReport> {
  const candidates = [
    join(projectRoot, 'docs', 'spec', 'examples', '12-adr-risks.md'),
    join(projectRoot, 'docs', 'spec', 'examples', '04-domain-model.md'),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      const text = await readFile(candidate, 'utf8');
      const violations = checkInv5(text, candidate);
      const status = violations.length > 0 ? 'FAIL' : 'PASS';
      return {
        name: 'inv-5',
        status,
        details: violations.length > 0 ? `${violations.length} violations` : 'PASS',
        count: violations.length,
      };
    }
  }

  return { name: 'inv-5', status: 'PASS', details: 'no spec file' };
}

export async function runAllChecks(projectRoot: string): Promise<LintReport> {
  const reports: SingleLintReport[] = [];

  reports.push(await runAntiSycophancy(projectRoot));
  reports.push(await runInv7(projectRoot));
  reports.push(await runAcTraceability(projectRoot));
  reports.push(await runInv5(projectRoot));

  const overall = reports.some((r) => r.status === 'FAIL') ? 'FAIL' : 'PASS';
  return { reports, overall };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] ?? '.';
  runAllChecks(root).then((r) => {
    for (const sr of r.reports) {
      const icon = sr.status === 'PASS' ? '✓' : sr.status === 'WARN' ? '⚠' : '✗';
      console.log(`${icon} ${sr.name}: ${sr.details}`);
    }
    console.log(`\nOverall: ${r.overall}`);
    process.exit(r.overall === 'FAIL' ? 1 : 0);
  });
}
