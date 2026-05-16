// D15 fix (4차 reviewer simplifier): shared ID regex patterns
// builder.ts, id-consistency.ts, secret-detect.ts, r7-b2b.ts 등이 사용

/**
 * Full ID pattern — covers all specrail spec identifier types.
 * Used by graph builder, ID consistency hook, lints.
 *
 * Tiers covered:
 * - R/F/S (Requirement / Feature / Specification) — canonical numeric
 * - R-{CAP} / F-R-{CAP}.{m} / AC-R-{CAP}-{m} — capability-suffix (T-CSA.3)
 * - ENT-Name (Entity)
 * - INV-N (Invariant)
 * - NFR-Domain-N (Non-Functional Requirement)
 * - ARCH-N (Architecture container)
 * - EXT-N (External integration)
 * - OPS-N (Operations, incl. OPS-CSA-N capability suffix)
 * - ADR-N (Architecture Decision Record)
 * - RISK-N (incl. RISK-CSA-N capability suffix)
 * - TC-N (Test Case)
 * - EDGE-N
 * - AC-R{n}-{m} (Acceptance Criteria)
 * - T{n}.{m} (Implementation Task)
 * - T-CSA.N (capability-suffix task; M-CSA milestone)
 * - FLN-N / FLE-N (Flow Node / Flow Edge; T-CSA.3 rename from N-NNN / E-N)
 * - PERSONA-N / PERSONA-EDGE-N (T-CSA.3)
 * - SCEN-N (Scenario; T-CSA.3 rename from S1/S2/S3)
 * - JNY-{scen}.{step} (Journey step, dotted; T-CSA.3)
 * - ZN-{NAME}-N (Wireframe zone; T-CSA.3)
 * - P-CC-N / E-CC-N (Page / Element on Claude Code surface)
 * - KPI-N
 */
export const ID_PATTERN_SOURCE =
  // Canonical numeric R/F/S/T
  '[RFS]\\d+(?:\\.\\d+){0,2}' +
  '|T\\d+\\.\\d+' +
  // Capability-suffix R/F/AC/T (M-CSA et al.)
  '|R-[A-Z]+[A-Z0-9]*' +
  '|F-R-[A-Z]+[A-Z0-9]*\\.\\d+' +
  '|AC-R-[A-Z]+[A-Z0-9]*-\\d+' +
  '|T-[A-Z]+[A-Z0-9]*\\.\\d+' +
  // Existing taxonomies
  '|ENT-[A-Za-z0-9_]+' +
  '|INV-\\d+' +
  '|NFR-[A-Z][A-Z0-9]*-\\d+' +
  '|ARCH-\\d+' +
  '|EXT-\\d+' +
  '|OPS-(?:[A-Z]+-)?\\d+' +
  '|ADR-\\d+' +
  '|RISK-(?:[A-Z]+-)?\\d+' +
  '|TC-\\d+' +
  '|EDGE-\\d+' +
  '|AC-R\\d+-\\d+' +
  // T-CSA.3 new ID families
  '|FLN-\\d+' +
  '|FLE-\\d+' +
  '|PERSONA(?:-EDGE)?-\\d+' +
  '|SCEN-\\d+' +
  '|JNY-\\d+\\.\\d+' +
  '|ZN-[A-Z][A-Z0-9-]*-\\d+' +
  '|P-CC-\\d+' +
  '|E-CC-\\d+' +
  '|KPI-\\d+';

/**
 * US-T6.4 (M6): User-defined namespace pattern.
 * Matches custom spec IDs (e.g. PAY-12, AUTH-3, GHOST-999, OQ-1-2) that
 * don't fit the canonical taxonomy above. Without this, arbitrary
 * namespaces silently pass dangling-citation checks.
 *
 * Shape: leading uppercase letter, 1+ uppercase/digit chars, '-', digits,
 * then zero or more `.NN` (dotted) or `-NN` (compound) tails. The
 * compound-tail support lets `OQ-1-2`, `OQ-13-1` parse as single tokens
 * (previously only the `OQ-1` prefix matched).
 */
export const USER_NAMESPACE_PATTERN = '[A-Z][A-Z0-9]+-\\d+(?:[-.]\\d+)*';

/**
 * US-T6.4 (M6): Reserved-word blocklist.
 * HTTP method / status-line tokens (HTTP-200, GET-401) match the user
 * namespace shape but are not spec IDs. After regex match, filter these out.
 */
export const RESERVED_ID_PREFIXES: ReadonlySet<string> = new Set([
  'HTTP',
  'HTTPS',
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'CONNECT',
  'TRACE',
]);

/** Returns true if a matched ID starts with a reserved (non-spec) prefix. */
export function isReservedId(id: string): boolean {
  const dash = id.indexOf('-');
  if (dash < 0) return false;
  return RESERVED_ID_PREFIXES.has(id.slice(0, dash));
}

/**
 * Zero-width / format characters that JS \b does not treat as word breaks.
 * Used in CITATION_RE lookarounds to suppress false-positive matches when
 * an ID token is immediately adjacent to one of these chars (US-11.6, M11).
 */
const ZWS_CHARS = '\\u200B\\u200C\\u200D\\uFEFF';

/** Citation regex (word-boundary, captured group, global flag).
 * Negative lookarounds for ZWS_CHARS prevent false-positive matches when
 * an ID is adjacent to a zero-width character (US-11.6, M11).
 *
 * Compound-token guards (Step 0 + Step 1): `\b` treats `-` and `.` as
 * word boundaries, so without explicit lookbehinds, in-prose compound
 * tokens leak phantom substring matches:
 *   - `ADR-CAND-1` → `CAND-1` (hyphen boundary)
 *   - `P-CC-1` → `CC-1` (hyphen boundary)
 *   - `NFR-SEC-COMP-1` → `COMP-1` (hyphen boundary)
 *   - `R6.F1` → `F1` (dot boundary in author shorthand `R{n}.F{m}`)
 *   - `R1.F3` → `F3`
 * Adding `\\-` and `\\.` to the negative lookbehind class rejects any
 * match that begins immediately after either separator.
 */
export const CITATION_RE = new RegExp(
  `(?<![${ZWS_CHARS}\\-.])\\b(${ID_PATTERN_SOURCE}|${USER_NAMESPACE_PATTERN})\\b(?![${ZWS_CHARS}])`,
  'g',
);

/** Definition pattern — heading text starting with "ID: ..." */
export const HEADING_DEF = new RegExp(`^([A-Z][A-Za-z0-9.\\-_]+):\\s`);

/** Markdown heading with definition prefix (for line-based scan). */
export const MARKDOWN_HEADING_DEF = new RegExp(`^#+\\s+([A-Z][A-Za-z0-9.\\-_]+):`);
