// atomic-commit — commit-time lint (architect M9 condition C2).
// Detects mega-commit anti-pattern (≥10 files without US-X/T-X task ref).
//
// Pre-commit hook wire example:
//   #!/usr/bin/env sh
//   FILES=$(git diff --cached --name-only | tr '\n' ',' | sed 's/,$//')
//   MSG=$(cat .git/COMMIT_EDITMSG)
//   npx --yes tsx src/lint/atomic-commit.ts --files "$FILES" --msg "$MSG" || exit 1
//
// Or via package.json script + manual invocation in CI.

import { execSync } from 'node:child_process';

export interface AtomicCommitResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  reason: string;
  fileCount: number;
  hasAtomicRef: boolean;
  bypassReason?: string;
}

export function checkCommit(
  stagedFiles: string[],
  commitMsg: string,
): AtomicCommitResult {
  const fileCount = stagedFiles.length;

  if (/^BREAKING:|^INITIAL:/m.test(commitMsg)) {
    return {
      status: 'PASS',
      reason: `Atomic commit (${fileCount} files)`,
      fileCount,
      hasAtomicRef: false,
      bypassReason: 'BREAKING/INITIAL bypass',
    };
  }

  const hasAtomicRef =
    /\bUS-[A-Z0-9]+(?:\.[0-9]+)*\b/.test(commitMsg) ||
    /(?<![\w-])T\d+(?:\.\d+)*\b/.test(commitMsg);

  if (fileCount >= 10 && !hasAtomicRef) {
    return {
      status: 'FAIL',
      reason: `Mega-commit (${fileCount} files) without atomic task ref (US-X or T-X)`,
      fileCount,
      hasAtomicRef,
    };
  }

  if (fileCount >= 7 && !hasAtomicRef) {
    return {
      status: 'WARN',
      reason: `Large commit (${fileCount} files) — consider splitting into atomic tasks`,
      fileCount,
      hasAtomicRef,
    };
  }

  const refSuffix = hasAtomicRef ? ', ref' : '';
  return {
    status: 'PASS',
    reason: `Atomic commit (${fileCount} files${refSuffix})`,
    fileCount,
    hasAtomicRef,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  const filesArgIdx = args.indexOf('--files');
  const msgArgIdx = args.indexOf('--msg');

  let stagedFiles: string[];
  let commitMsg: string;

  if (filesArgIdx !== -1 && args[filesArgIdx + 1]) {
    stagedFiles = args[filesArgIdx + 1].split(',').filter(Boolean);
  } else {
    try {
      const raw = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      stagedFiles = raw.split('\n').filter(Boolean);
    } catch {
      stagedFiles = [];
    }
  }

  if (msgArgIdx !== -1 && args[msgArgIdx + 1]) {
    commitMsg = args[msgArgIdx + 1];
  } else {
    try {
      const { readFileSync } = await import('node:fs');
      commitMsg = readFileSync('.git/COMMIT_EDITMSG', 'utf8');
    } catch {
      commitMsg = '';
    }
  }

  const result = checkCommit(stagedFiles, commitMsg);

  if (result.status === 'FAIL') {
    process.stderr.write(`[atomic-commit] FAIL: ${result.reason}\n`);
    process.exit(1);
  } else if (result.status === 'WARN') {
    process.stderr.write(`[atomic-commit] WARN: ${result.reason}\n`);
    process.exit(0);
  } else {
    process.stdout.write(`[atomic-commit] PASS: ${result.reason}\n`);
    process.exit(0);
  }
}
