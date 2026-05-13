// Phase 4 SM-Phase-Lifecycle — INV-3 enforce
// ADR-8: explicit state machine (deterministic, not LLM-driven)
// State source-of-truth: frontmatter `status` 필드 (cache는 derived)

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
