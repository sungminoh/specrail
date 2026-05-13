// D15 fix (4차 reviewer simplifier): shared ID regex patterns
// builder.ts, id-consistency.ts, secret-detect.ts, r7-b2b.ts 등이 사용

/**
 * Full ID pattern — covers all v4 spec identifier types.
 * Used by graph builder, ID consistency hook, lints.
 *
 * Tiers covered:
 * - R/F/S (Requirement / Feature / Specification)
 * - ENT-Name (Entity)
 * - INV-N (Invariant)
 * - NFR-Domain-N (Non-Functional Requirement)
 * - ARCH-N (Architecture container)
 * - EXT-N (External integration)
 * - OPS-N (Operations)
 * - ADR-N (Architecture Decision Record)
 * - RISK-N
 * - TC-N (Test Case)
 * - EDGE-N
 * - AC-R{n}-{m} (Acceptance Criteria)
 * - T{n}.{m} (Implementation Task)
 */
export const ID_PATTERN_SOURCE =
  '[RFS]\\d+(?:\\.\\d+){0,2}' +
  '|ENT-[A-Za-z0-9_]+' +
  '|INV-\\d+' +
  '|NFR-[A-Z]+-\\d+' +
  '|ARCH-\\d+' +
  '|EXT-\\d+' +
  '|OPS-\\d+' +
  '|ADR-\\d+' +
  '|RISK-\\d+' +
  '|TC-\\d+' +
  '|EDGE-\\d+' +
  '|AC-R\\d+-\\d+' +
  '|T\\d+\\.\\d+';

/**
 * US-T6.4 (M6): User-defined namespace pattern.
 * Matches custom spec IDs (e.g. PAY-12, AUTH-3, GHOST-999) that don't fit
 * the canonical taxonomy above. Without this, arbitrary namespaces silently
 * pass dangling-citation checks.
 *
 * Shape: leading uppercase letter, 1+ uppercase/digit chars, '-', digits,
 * optional '.NN' tails (T-style nested tasks).
 */
export const USER_NAMESPACE_PATTERN = '[A-Z][A-Z0-9]+-\\d+(?:\\.\\d+)*';

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

/** Citation regex (word-boundary, captured group, global flag). */
export const CITATION_RE = new RegExp(
  `\\b(${ID_PATTERN_SOURCE}|${USER_NAMESPACE_PATTERN})\\b`,
  'g',
);

/** Definition pattern — heading text starting with "ID: ..." */
export const HEADING_DEF = new RegExp(`^([A-Z][A-Za-z0-9.\\-_]+):\\s`);

/** Markdown heading with definition prefix (for line-based scan). */
export const MARKDOWN_HEADING_DEF = new RegExp(`^#+\\s+([A-Z][A-Za-z0-9.\\-_]+):`);
