/**
 * git log helpers — best-effort. When the working tree is not a git
 * repository or git is unavailable, every function returns empty results
 * so callers can degrade gracefully.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

const GIT_TIMEOUT_MS = 10_000;

/** Return the short SHAs of commits that touched `relFilePath`. */
export async function commitsTouchingFile(
  projectRoot: string,
  relFilePath: string,
): Promise<string[]> {
  try {
    const { stdout } = await execFileP(
      'git',
      ['log', '--pretty=format:%h', '--', relFilePath],
      { cwd: projectRoot, timeout: GIT_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
    );
    return stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Return commit messages whose subject line matches `filter` (a substring
 * search via `git log --grep=<filter>`). The filter is passed as a single
 * argv element to git — git treats it as a regex but we keep callers'
 * patterns simple (substring-like).
 */
export async function commitsMatching(
  projectRoot: string,
  filter: string,
  limit = 50,
): Promise<{ sha: string; subject: string }[]> {
  try {
    const { stdout } = await execFileP(
      'git',
      [
        'log',
        `--grep=${filter}`,
        `--max-count=${limit}`,
        '--pretty=format:%h%x00%s',
      ],
      { cwd: projectRoot, timeout: GIT_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
    );
    return stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [sha, subject = ''] = l.split('\x00');
        return { sha, subject };
      });
  } catch {
    return [];
  }
}

/**
 * Return the SHA-1 of the file's contents as known to git's index (i.e.
 * `git hash-object <path>` — equivalent to the blob SHA). Used by ADR
 * sign-off staleness detection. Returns null when the path is missing
 * or git is unavailable.
 */
export async function blobSha(
  projectRoot: string,
  relFilePath: string,
): Promise<string | null> {
  try {
    const { stdout } = await execFileP(
      'git',
      ['hash-object', '--', relFilePath],
      { cwd: projectRoot, timeout: GIT_TIMEOUT_MS },
    );
    const sha = stdout.trim();
    return sha.length === 40 ? sha : null;
  } catch {
    return null;
  }
}
