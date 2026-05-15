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

/**
 * Author intent. Sourced from the phase frontmatter `status:` field — the
 * authoritative declaration of whether the phase author has committed to
 * this body of spec being built. Schema enum is `Empty | Draft | Approved`
 * (see schemas/common-frontmatter.json).
 *
 *   - `Empty`    — phase placeholder, author has not yet authored anything.
 *   - `Draft`    — author is still drafting; do not lie-detect against it.
 *   - `Approved` — author asserts the spec is final and should be built.
 *
 * Only `Approved` IDs are candidates for the `intent vs reality` lie check.
 */
export type IntentState = 'Empty' | 'Draft' | 'Approved';

/** id → declared author intent. Read from spec frontmatter, not hardcoded. */
export type IntentIndex = ReadonlyMap<string, IntentState>;

/** Auto-derived build reality. Never written by hand. */
export type RealityState =
  | 'NotBuilt'
  | 'Partial'
  | 'Built'
  | 'ManualReview'
  | 'ManualReview-Stale';

/** Confidence in the rule's classification. */
export type Confidence = 'high' | 'medium' | 'low';

/**
 * All evidence kinds produced by any rule. Discriminated-union typed so
 * that a typo (`'sigoff'` instead of `'signoff'`) fails the build instead
 * of silently mis-categorising a rule's output.
 *
 * Dynamic ref/child kinds (`ref:Built`, `child:Partial`, ...) are
 * generated from `RealityState` via template literal types so adding a
 * new reality state automatically extends the union.
 */
export type EvidenceKind =
  | 'aggregated-children'
  | 'aggregated-from'
  | 'cited'
  | 'cross-references'
  | 'file-exists'
  | 'file-has-todo'
  | 'file-missing'
  | 'inline-body'
  | 'inline-body-thin'
  | 'no-definition-location'
  | 'no-path-tokens'
  | 'no-rule-registered'
  | 'no-runbook-no-definition'
  | 'no-signoff'
  | 'no-test-ref'
  | 'oq-open'
  | 'oq-resolved'
  | 'oq-status-unknown'
  | 'runbook-doc'
  | 'sha-match'
  | 'sha-mismatch'
  | 'signoff'
  | 'signoff-target-missing'
  | 'spec-file-unreadable'
  | 'symbol-found'
  | 'symbol-missing'
  | 'test-fail'
  | 'test-pass'
  | 'test-ref-no-outcome'
  | 'test-ref-no-run'
  | 'unparseable-entity-name'
  | `ref:${RealityState}`
  | `child:${RealityState}`;

/** One piece of evidence collected by a rule for a single ID. */
export interface EvidenceItem {
  readonly kind: EvidenceKind;
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
