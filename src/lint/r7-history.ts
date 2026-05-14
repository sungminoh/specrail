// R7 chicken-and-egg history check (T3.3, AC-R7-3, TC-17)
// Best-effort static check: v4 plugin spec 작업 시 v3 example 참조 금지.
// git log 결과를 외부에서 주입하거나 execFile로 직접 실행 가능.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface HistoryMatch {
  /** Pattern name that triggered the match */
  pattern: string;
  /** Git commit SHA (available when called via detectV3RefHistoryGit) */
  commitSha?: string;
  /** Commit subject line (or full message excerpt) */
  subject: string;
  /** 'warn' = explicit v3 reference; 'info' = borderline (could be intentional archive work) */
  severity: 'warn' | 'info';
}

interface PatternRule {
  name: string;
  regex: RegExp;
  severity: 'warn' | 'info';
}

const PATTERNS: PatternRule[] = [
  {
    name: 'v3-ref',
    regex: /based on (v3|v3-archive|legacy) example/i,
    severity: 'warn',
  },
  {
    name: 'cherry-pick-v3',
    regex: /cherry-pick.*v3/i,
    severity: 'info',
  },
  {
    name: 'copied-v3',
    regex: /copied from v3/i,
    severity: 'info',
  },
  {
    name: 'retrofit-v3',
    regex: /retrofit.*v3/i,
    severity: 'warn',
  },
  {
    name: 'v3-unique-marker',
    // v3 example의 self-application content 고유 식별자.
    // "Planning Pipeline Plugin (v4)" 문구가 v3 example 내부에서 사용된 구체적 표현.
    regex: /Planning Pipeline Plugin \(v4\)/i,
    severity: 'warn',
  },
];

/**
 * Detect v3 example references in a list of commit message strings.
 * Test-friendly: accepts plain string[] so tests can inject any messages without git.
 */
export function detectV3RefHistory(commitMessages: string[]): HistoryMatch[] {
  const results: HistoryMatch[] = [];

  for (const subject of commitMessages) {
    for (const rule of PATTERNS) {
      if (rule.regex.test(subject)) {
        results.push({
          pattern: rule.name,
          subject,
          severity: rule.severity,
        });
      }
    }
  }

  return results;
}

interface CommitEntry {
  sha: string;
  subject: string;
  body?: string;
}

/**
 * Parse `git log --pretty=format:%H%n%s%n%b%n---` output into commit entries.
 * Each block is delimited by `---` on its own line.
 * Body lines (lines 3+) are joined and stored in `body`.
 */
function parseGitLog(stdout: string): CommitEntry[] {
  const entries: CommitEntry[] = [];
  const blocks = stdout.split(/^---$/m);

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(Boolean);
    if (lines.length < 2) continue;
    const sha = lines[0].trim();
    const subject = lines[1].trim();
    if (!sha || !subject) continue;
    const body = lines.slice(2).join('\n').trim() || undefined;
    entries.push({ sha, subject, body });
  }

  return entries;
}

/**
 * Run `git log` in the given project root and detect v3 example references.
 * Returns empty array if git is unavailable or the directory is not a git repo.
 * Uses execFile (not exec) to prevent shell injection.
 */
export async function detectV3RefHistoryGit(projectRoot: string): Promise<HistoryMatch[]> {
  let stdout: string;
  try {
    const result = await execFileAsync(
      'git',
      ['log', '--all', '--pretty=format:%H%n%s%n%b%n---'],
      { cwd: projectRoot },
    );
    stdout = result.stdout;
  } catch {
    // git not available or not a git repo — graceful fallback
    return [];
  }

  const entries = parseGitLog(stdout);
  const results: HistoryMatch[] = [];

  for (const entry of entries) {
    const haystack = entry.subject + (entry.body ? ' ' + entry.body : '');
    for (const rule of PATTERNS) {
      if (rule.regex.test(haystack)) {
        results.push({
          pattern: rule.name,
          commitSha: entry.sha,
          subject: entry.subject,
          severity: rule.severity,
        });
      }
    }
  }

  return results;
}
