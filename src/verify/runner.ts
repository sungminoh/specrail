/**
 * Verification runner — orchestrates buildGraph → per-id rules → aggregate.
 *
 * US-V01: returns a `NotBuilt` classification for every defined ID with
 * confidence 'low' and rule name 'skeleton'. Subsequent stories register
 * concrete rules and the runner dispatches by IdType.
 */

import { buildGraph } from '../graph/builder.js';
import {
  classifyId,
  type IdEvidence,
  type IdType,
  type VerifyOptions,
  type VerifyResult,
} from './types.js';
import { runVitest, scanTestFilesForIds, type VitestRunResult } from './vitest-bridge.js';
import { applyRfsAggregation } from './id-rules/spec.js';
import { applyCrossRefAggregation } from './id-rules/aggregate.js';

/** Shared id → spec-definition location, derived once per verify() run. */
export type LocationIndex = ReadonlyMap<string, { file: string; line: number }>;

/** Shared evidence inputs available to every rule. Gathered once per run. */
export interface VerifyContext {
  readonly projectRoot: string;
  readonly options: VerifyOptions;
  readonly vitest: VitestRunResult;
  /** id → set of test file paths (relative) that mention that ID. */
  readonly testFileIds: ReadonlyMap<string, ReadonlySet<string>>;
  /** id → spec file + line where the ID is defined (one shared map). */
  readonly locations: LocationIndex;
}

/** A rule classifies a single ID by inspecting the project state. */
export interface IdRule {
  readonly id: string;
  /**
   * Apply the rule to an ID, returning an `IdEvidence`. Rules MUST NOT
   * throw — return a low-confidence NotBuilt with a note if they cannot
   * gather any signal.
   */
  apply(args: {
    id: string;
    idType: IdType;
    ctx: VerifyContext;
  }): Promise<IdEvidence>;
}

/** Internal: rule registry, populated by US-V04+ stories. */
const RULE_REGISTRY = new Map<IdType, IdRule>();

export function registerRule(idTypes: readonly IdType[], rule: IdRule): void {
  for (const t of idTypes) RULE_REGISTRY.set(t, rule);
}

/** Returns the rule registered for an idType, or the skeleton fallback. */
function resolveRule(idType: IdType): IdRule {
  return RULE_REGISTRY.get(idType) ?? SKELETON_RULE;
}

/** Default rule for IDs without a registered classifier. */
const SKELETON_RULE: IdRule = {
  id: 'skeleton',
  async apply({ id, idType }) {
    return {
      id,
      idType,
      intent: 'Approved',
      reality: 'NotBuilt',
      evidence: [],
      confidence: 'low',
      rule: 'skeleton',
    };
  },
};

/** Run verification across all defined IDs in the project's docs/spec/. */
export async function verify(
  projectRoot: string,
  options: VerifyOptions = {},
): Promise<VerifyResult> {
  const graph = await buildGraph(projectRoot);

  if (!graph.initialized) {
    return {
      timestamp: new Date().toISOString(),
      projectRoot,
      results: new Map(),
      initialized: false,
    };
  }

  const vitest: VitestRunResult = options.skipTests
    ? { ran: false, outcomes: new Map(), note: 'skipTests' }
    : await runVitest(projectRoot);
  const testFileIds = await scanTestFilesForIds(projectRoot);
  const locations = new Map<string, { file: string; line: number }>();
  for (const node of graph.nodes) {
    locations.set(node.specId, { file: node.definedAt.file, line: node.definedAt.line });
  }
  const ctx: VerifyContext = {
    projectRoot,
    options,
    vitest,
    testFileIds,
    locations,
  };

  const filter = options.filter;
  const results = new Map<string, IdEvidence>();

  for (const id of graph.definedIds) {
    if (filter && !filter.test(id)) continue;
    const idType = classifyId(id);
    const rule = resolveRule(idType);
    const ev = await rule.apply({ id, idType, ctx });
    results.set(id, ev);
  }

  // Aggregation pass: roll up R / F over their AC + child evidence,
  // and resolve PAIN / KPI / RISK from their cited cross-references.
  applyRfsAggregation(results);
  applyCrossRefAggregation(results);

  return {
    timestamp: new Date().toISOString(),
    projectRoot,
    results,
    initialized: true,
  };
}
