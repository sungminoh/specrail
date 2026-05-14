/**
 * Implementation verification — type definitions.
 *
 * Two-axis model:
 *   - **Intent** (author-written, in spec): is this spec item meant to exist?
 *   - **Reality** (auto-derived from code/tests/git): does it actually exist?
 *
 * The verifier reads spec + repo and produces an `IdEvidence` per ID. A
 * downstream lint hook then flags genuine mismatches (e.g. spec asserts an
 * `Evidence:` pointer that does not resolve).
 */

/** Author intent. Sourced from `**Status:**` line near the spec heading. */
export type IntentState = 'Draft' | 'Approved';

/** Auto-derived build reality. Never written by hand. */
export type RealityState =
  | 'NotBuilt'
  | 'Partial'
  | 'Built'
  | 'ManualReview'
  | 'ManualReview-Stale';

/** Confidence in the rule's classification. */
export type Confidence = 'high' | 'medium' | 'low';

/** One piece of evidence collected by a rule for a single ID. */
export interface EvidenceItem {
  /**
   * Evidence kind tag. Examples:
   *   - "test-pass" / "test-fail" / "test-skip"
   *   - "file-exists" / "symbol-found"
   *   - "git-commit" / "runbook-doc"
   *   - "signoff" / "signoff-stale"
   *   - "child-aggregation"
   */
  readonly kind: string;
  readonly path?: string;
  readonly line?: number;
  readonly note?: string;
}

/** Per-ID verification record. */
export interface IdEvidence {
  readonly id: string;
  readonly idType: IdType;
  readonly intent: IntentState;
  readonly reality: RealityState;
  readonly evidence: readonly EvidenceItem[];
  readonly confidence: Confidence;
  /** Identifier of the rule module that classified this ID. */
  readonly rule: string;
}

/** Top-level ID type classifier. Used to dispatch rules. */
export type IdType =
  | 'AC'
  | 'TC'
  | 'INV'
  | 'EDGE'
  | 'NFR'
  | 'ENT'
  | 'ARCH'
  | 'EXT'
  | 'OPS'
  | 'RB'
  | 'ADR'
  | 'RISK'
  | 'KPI'
  | 'PAIN'
  | 'OQ'
  | 'R'
  | 'F'
  | 'S'
  | 'T'
  | 'unknown';

/** Aggregate verification result for a single project root. */
export interface VerifyResult {
  readonly timestamp: string;
  readonly projectRoot: string;
  /** Per-ID records keyed by spec id. */
  readonly results: ReadonlyMap<string, IdEvidence>;
  /** True when docs/spec/ existed and the run produced classifications. */
  readonly initialized: boolean;
}

/** Options accepted by `verify()`. */
export interface VerifyOptions {
  /** Skip the vitest run (used when the caller already has fresh test data). */
  readonly skipTests?: boolean;
  /** Only classify IDs that match this regex (debugging / scoping). */
  readonly filter?: RegExp;
}

/**
 * Classify an ID string into its top-level type. Lightweight — does NOT
 * validate the full ID grammar; that is the citation regex's job.
 */
export function classifyId(id: string): IdType {
  if (/^AC-R\d+-\d+/.test(id)) return 'AC';
  if (/^TC-\d+/.test(id)) return 'TC';
  if (/^INV-\d+/.test(id)) return 'INV';
  if (/^EDGE-\d+/.test(id)) return 'EDGE';
  if (/^NFR-/.test(id)) return 'NFR';
  if (/^ENT-/.test(id)) return 'ENT';
  if (/^ARCH-\d+/.test(id)) return 'ARCH';
  if (/^EXT-\d+/.test(id)) return 'EXT';
  if (/^OPS-\d+/.test(id)) return 'OPS';
  if (/^RB-\d+/.test(id)) return 'RB';
  if (/^ADR-\d+/.test(id)) return 'ADR';
  if (/^RISK-\d+/.test(id)) return 'RISK';
  if (/^KPI-\d+/.test(id)) return 'KPI';
  if (/^PAIN-\d+/.test(id)) return 'PAIN';
  if (/^OQ-\d+/.test(id)) return 'OQ';
  if (/^R\d+(?:\.\d+)?$/.test(id)) return 'R';
  if (/^F\d+\.\d+$/.test(id)) return 'F';
  if (/^S\d+\.\d+\.\d+$/.test(id)) return 'S';
  if (/^T\d+\.\d+$/.test(id)) return 'T';
  return 'unknown';
}
