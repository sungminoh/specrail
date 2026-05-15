/**
 * `specrail verify` CLI entry point.
 *
 * Flags (parsed left-to-right):
 *   --json              emit JSON report instead of human report
 *   --md                emit Markdown report instead of human report
 *   --filter <regex>    only classify IDs whose name matches the regex
 *   --check-honesty     exit non-zero when any spec ID is a genuine
 *                       two-axis lie. A lie is any `intent=Approved`
 *                       item whose `reality` is NotBuilt, Partial, or
 *                       ManualReview-Stale — i.e. the author asserted
 *                       the spec is final but the evidence says the
 *                       claim is unbacked, partially backed, or based
 *                       on a sign-off whose SHA has drifted.
 *                       ManualReview (no signal either way) is NOT a
 *                       lie — the verifier punts to humans, not flags.
 *   --no-cache          force a fresh run (skip cache read)
 *   --clear-cache       delete .specrail-cache/ before running. Use
 *                       this when a rule change makes the cache stale
 *                       but no watched file has its mtime bumped.
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
  clearCache,
} from '../verify/cache.js';
import { isInfraStale } from '../verify/honesty.js';
import type { VerifyResult } from '../verify/types.js';

export interface CliOptions {
  readonly format: 'human' | 'json' | 'md';
  readonly filter?: RegExp;
  readonly checkHonesty: boolean;
  readonly useCache: boolean;
  readonly clearCache: boolean;
  readonly skipTests: boolean;
}

export function parseArgs(args: readonly string[]): CliOptions {
  let format: CliOptions['format'] = 'human';
  let filter: RegExp | undefined;
  let checkHonesty = false;
  let useCache = true;
  let clearCacheFlag = false;
  let skipTests = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') format = 'json';
    else if (a === '--md' || a === '--markdown') format = 'md';
    else if (a === '--check-honesty') checkHonesty = true;
    else if (a === '--no-cache') useCache = false;
    else if (a === '--clear-cache') clearCacheFlag = true;
    else if (a === '--no-tests') skipTests = true;
    else if (a === '--filter') {
      const next = args[i + 1];
      if (next) {
        filter = new RegExp(next);
        i++;
      }
    }
  }
  return {
    format,
    filter,
    checkHonesty,
    useCache,
    clearCache: clearCacheFlag,
    skipTests,
  };
}

export async function runVerifyCli(
  projectRoot: string,
  args: readonly string[],
): Promise<{ exitCode: number; output: string }> {
  const opts = parseArgs(args);

  let preamble = '';
  if (opts.clearCache) {
    const cleared = await clearCache(projectRoot);
    preamble = cleared
      ? `cache cleared: .specrail-cache/ removed\n`
      : `cache cleared: (nothing to remove)\n`;
  }

  let result: VerifyResult | null = null;
  if (opts.useCache && !opts.clearCache && !opts.filter) {
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
  let honestyReport = '';
  if (opts.checkHonesty) {
    // A lie is any Approved item whose reality contradicts the
    // declaration. The matrix is enumerated rather than negated so the
    // intent is auditable in code review:
    //   - NotBuilt: rule looked, found no evidence at all.
    //   - Partial: rule found some evidence but not the whole story.
    //   - ManualReview-Stale: rule found positive evidence of content
    //     drift (e.g. ADR sign-off SHA mismatch). Excluded when the
    //     staleness reason is `test-ref-no-run` — that's infrastructure
    //     absence (`--no-tests`), not a content lie. The carve-out also
    //     recurses through `rfs-aggregate` parents (R / F tier) whose
    //     ManualReview-Stale is purely inherited from `test-ref-no-run`
    //     children — round-10 architect review flagged 9 R-tier false
    //     positives (R1-R8, R13) caused by that propagation gap.
    const lies: Array<{ id: string; rule: string; reality: string }> = [];
    const unknownApproved: string[] = [];
    for (const ev of result.results.values()) {
      if (ev.intent !== 'Approved') continue;
      // Surface the skeleton-rule blind spot — any Approved ID that
      // hits the skeleton rule has no evidence either way and is not a
      // lie. Round-11 architect feedback: keying on `rule === 'skeleton'`
      // alone (not `&& idType === 'unknown'`) catches future taxonomy
      // additions where an IdType is added to classifyId without a
      // matching rule registration.
      if (ev.rule === 'skeleton') {
        unknownApproved.push(ev.id);
      }
      if (ev.reality === 'NotBuilt' || ev.reality === 'Partial') {
        lies.push({ id: ev.id, rule: ev.rule, reality: ev.reality });
        continue;
      }
      if (ev.reality === 'ManualReview-Stale') {
        if (isInfraStale(ev, result.results)) continue;
        lies.push({ id: ev.id, rule: ev.rule, reality: ev.reality });
      }
    }
    if (lies.length > 0) {
      exitCode = 1;
      honestyReport =
        `\n--- honesty check: FAILED ---\n` +
        `${lies.length} spec ID(s) declared Approved have insufficient evidence:\n` +
        lies
          .map((l) => `  - ${l.id} [${l.reality}] (rule=${l.rule})`)
          .join('\n') +
        `\nFix: either implement the missing work, drop the phase back to Draft,\n` +
        `or remove the offending ID from the spec.\n`;
    } else {
      honestyReport =
        `\n--- honesty check: OK ` +
        `(no Approved+NotBuilt/Partial/ManualReview-Stale lies) ---\n`;
    }
    if (unknownApproved.length > 0) {
      honestyReport +=
        `\n--- honesty check: warning ---\n` +
        `${unknownApproved.length} Approved ID(s) have no registered rule ` +
        `and were not audited:\n` +
        unknownApproved.map((id) => `  ? ${id}`).join('\n') +
        `\nThese are not lies — the verifier has no rule to evaluate them.\n` +
        `Add an idType taxonomy entry or rename the ID to a known prefix.\n`;
    }
  }
  // Round-11/12 architect P1: human-format diagnostic text MUST NOT
  // leak into machine-parseable formats. Both the cache-clear preamble
  // and the honesty report fall into this class. JSON/MD consumers
  // already have `exitCode` for the pass/fail signal and the full
  // results map for deeper introspection. The round-12 fix that gated
  // only the honesty tail was an under-reading of the same bug class —
  // this round gates both.
  const isHuman = opts.format === 'human';
  const finalPreamble = isHuman ? preamble : '';
  const appendHonesty = isHuman ? honestyReport : '';
  return { exitCode, output: finalPreamble + output + appendHonesty };
}

