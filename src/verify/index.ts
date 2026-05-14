/**
 * Public entry point for the implementation-verification subsystem.
 *
 * Consumers import only from this module; internal modules under
 * `id-rules/`, `evidence/`, and `report/` are implementation details
 * subject to change.
 */

import { registerBuiltinRules } from './id-rules/_registry.js';

export { verify, registerRule } from './runner.js';
export type { IdRule, VerifyContext } from './runner.js';
export {
  classifyId,
  type IntentState,
  type RealityState,
  type Confidence,
  type EvidenceItem,
  type IdEvidence,
  type IdType,
  type VerifyResult,
  type VerifyOptions,
} from './types.js';

// Side-effect: every consumer of the public API gets built-in rules.
registerBuiltinRules();
