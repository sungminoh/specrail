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

/** Citation regex (word-boundary, captured group, global flag). */
export const CITATION_RE = new RegExp(`\\b(${ID_PATTERN_SOURCE})\\b`, 'g');

/** Definition pattern — heading text starting with "ID: ..." */
export const HEADING_DEF = new RegExp(`^([A-Z][A-Za-z0-9.\\-_]+):\\s`);

/** Markdown heading with definition prefix (for line-based scan). */
export const MARKDOWN_HEADING_DEF = new RegExp(`^#+\\s+([A-Z][A-Za-z0-9.\\-_]+):`);
