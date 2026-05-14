/**
 * `specrail verify` CLI entry point.
 *
 * Flags (parsed left-to-right):
 *   --json              emit JSON report instead of human report
 *   --md                emit Markdown report instead of human report
 *   --filter <regex>    only classify IDs whose name matches the regex
 *   --check-honesty     exit non-zero when any item has Intent=Approved
 *                       with a broken `Evidence:` pointer (placeholder —
 *                       full honesty check arrives with the lint hook)
 *   --no-cache          force a fresh run (skip cache read)
 *   --no-tests          skip vitest (faster but Reality drops to
 *                       ManualReview-Stale for test-grep evidence)
 */

import { verify } from '../verify/index.js';
import { formatHuman } from '../verify/report/human.js';
import { formatJson } from '../verify/report/json.js';
import { formatMarkdown } from '../verify/report/markdown.js';
import {
  readCache,
  isCacheValid,
  cacheToResult,
  writeCache,
} from '../verify/cache.js';
import type { VerifyResult } from '../verify/types.js';

export interface CliOptions {
  readonly format: 'human' | 'json' | 'md';
  readonly filter?: RegExp;
  readonly checkHonesty: boolean;
  readonly useCache: boolean;
  readonly skipTests: boolean;
}

export function parseArgs(args: readonly string[]): CliOptions {
  let format: CliOptions['format'] = 'human';
  let filter: RegExp | undefined;
  let checkHonesty = false;
  let useCache = true;
  let skipTests = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') format = 'json';
    else if (a === '--md' || a === '--markdown') format = 'md';
    else if (a === '--check-honesty') checkHonesty = true;
    else if (a === '--no-cache') useCache = false;
    else if (a === '--no-tests') skipTests = true;
    else if (a === '--filter') {
      const next = args[i + 1];
      if (next) {
        filter = new RegExp(next);
        i++;
      }
    }
  }
  return { format, filter, checkHonesty, useCache, skipTests };
}

export async function runVerifyCli(
  projectRoot: string,
  args: readonly string[],
): Promise<{ exitCode: number; output: string }> {
  const opts = parseArgs(args);

  let result: VerifyResult | null = null;
  if (opts.useCache && !opts.filter) {
    const cache = await readCache(projectRoot);
    if (cache && (await isCacheValid(projectRoot, cache))) {
      result = cacheToResult(cache, projectRoot);
    }
  }
  if (!result) {
    result = await verify(projectRoot, {
      filter: opts.filter,
      skipTests: opts.skipTests,
    });
    if (opts.useCache && !opts.filter) {
      try {
        await writeCache(projectRoot, result);
      } catch {
        // Best effort — cache write failure should not break the CLI.
      }
    }
  }

  const output =
    opts.format === 'json'
      ? formatJson(result)
      : opts.format === 'md'
        ? formatMarkdown(result)
        : formatHuman(result);

  let exitCode = 0;
  if (opts.checkHonesty) {
    // Placeholder — full honesty check (intent-vs-reality enforcement)
    // lands in US-V17 via the dedicated lint hook. For now we exit 1
    // when any explicit Evidence: pointer is broken — that is, any
    // result whose evidence array contains a `file-missing` kind for
    // an item that also claims a hand-written `Evidence:` annotation.
    for (const ev of result.results.values()) {
      if (ev.evidence.some((e) => e.kind === 'file-missing')) {
        exitCode = 1;
        break;
      }
    }
  }
  return { exitCode, output };
}
