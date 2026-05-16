// Phase 4 SM-Phase-Lifecycle — INV-3 enforce
// ADR-8: explicit state machine (deterministic, not LLM-driven)
// State source-of-truth: frontmatter `status` 필드 (cache는 derived)
//
// T-CSA.9 (INV-3 extension): Proposed→Approved transition checks attrs
// presence on every first-class entity defined in the phase. Per
// proposal §3.2 (Backward compat) + OQ-CSA-3 resolution:
//   - plugin v0.2.0~v0.4.x → WARN (transition allowed, surface a list)
//   - plugin v0.5.0+      → ERROR (transition blocked)

import { lintAttrs, type AttrsLintFinding } from '../lint/attrs-lint.js';

export enum PhaseStatus {
  Empty = 'Empty',
  Draft = 'Draft',
  Approved = 'Approved',
}

const ALLOWED: Record<PhaseStatus, PhaseStatus[]> = {
  [PhaseStatus.Empty]: [PhaseStatus.Draft],
  [PhaseStatus.Draft]: [PhaseStatus.Approved, PhaseStatus.Draft],
  [PhaseStatus.Approved]: [PhaseStatus.Draft], // DELTA: re-edit
};

export function canTransition(from: PhaseStatus, to: PhaseStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: PhaseStatus, to: PhaseStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`INV-3 violation: Phase status ${from} → ${to} not allowed`);
  }
}

export type AttrsGateLevel = 'warn' | 'error' | 'pass';

export interface AttrsGateResult {
  readonly level: AttrsGateLevel;
  readonly missing: AttrsLintFinding[];
  readonly message: string;
}

/**
 * INV-3 extension (T-CSA.9): check attrs presence + completeness for an
 * Approved transition. Returns:
 *   - { level: 'pass' } if all required attrs present
 *   - { level: 'warn' } if missing fields detected under v0.2.0~v0.4.x
 *   - { level: 'error' } if missing fields detected under v0.5.0+, OR if a
 *     review-required marker is present (always ERROR per OQ-CSA-10)
 *
 * Does NOT throw — callers decide enforcement. The intent gate is in
 * src/cli/approve.ts (and future state machine integrations).
 */
export function checkApprovedAttrsGate(
  phaseMarkdown: string,
  pluginVersion: string,
): AttrsGateResult {
  const r = lintAttrs(phaseMarkdown, { pluginVersion });
  const errors = r.findings.filter((f) => f.level === 'error');
  const warns = r.findings.filter((f) => f.level === 'warn');
  if (errors.length === 0 && warns.length === 0) {
    return { level: 'pass', missing: [], message: 'INV-3 attrs gate: all entities have required attrs.' };
  }
  if (errors.length > 0) {
    return {
      level: 'error',
      missing: errors,
      message: `INV-3 attrs gate (plugin ${pluginVersion}, ERROR cut): ${errors.length} blocking finding(s) — Approved transition rejected.`,
    };
  }
  return {
    level: 'warn',
    missing: warns,
    message: `INV-3 attrs gate (plugin ${pluginVersion}, pre-v0.5.0): ${warns.length} field(s) missing — Approved transition allowed, run "specrail migrate --fix" to clear.`,
  };
}
