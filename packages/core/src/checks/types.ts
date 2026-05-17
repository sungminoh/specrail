import type { PhaseNumber } from '../spec/types.js';

export type CheckRuleId =
  | 'orphan-id'
  | 'dangling-ref'
  | 'status-mismatch'
  | 'traceability-gap';

export interface CheckFinding {
  ruleId: CheckRuleId;
  severity: 'error' | 'warn' | 'info';
  message: string;
  phase: PhaseNumber;
  line?: number;
  specId?: string;
}
