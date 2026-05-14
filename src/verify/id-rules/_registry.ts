/**
 * Built-in rule registration. Imported once at process start so the
 * runner's rule dispatch table is populated before any `verify()` call.
 *
 * Each new rule module appends its registration here. Keeping this file
 * separate from the rule modules themselves keeps the rules
 * dependency-free of the runner — rules only know about types + context.
 */

import { registerRule } from '../runner.js';
import { testGrepRule } from './test-grep.js';
import { pathRule } from './path.js';
import { entRule } from './ent.js';
import { opsRule, rbRule } from './ops.js';
import { taskRule } from './task.js';
import { oqRule } from './oq.js';
import { sLeafRule } from './spec.js';
import { painRule, kpiRule, riskRule } from './aggregate.js';
import { adrRule } from './adr.js';

export function registerBuiltinRules(): void {
  registerRule(['AC', 'TC', 'INV', 'EDGE', 'NFR'], testGrepRule);
  registerRule(['ARCH', 'EXT'], pathRule);
  registerRule(['ENT'], entRule);
  registerRule(['OPS'], opsRule);
  registerRule(['RB'], rbRule);
  registerRule(['T'], taskRule);
  registerRule(['OQ'], oqRule);
  // S leaves use a path-based rule (same shape as ARCH); R and F are
  // assigned the skeleton at first and then overwritten by the
  // applyRfsAggregation post-pass in the runner.
  registerRule(['S'], sLeafRule);
  registerRule(['PAIN'], painRule);
  registerRule(['KPI'], kpiRule);
  registerRule(['RISK'], riskRule);
  registerRule(['ADR'], adrRule);
}
