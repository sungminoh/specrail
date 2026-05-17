// Per-phase frontmatter schemas. Minimal — captures the fields specrail check enforces.
// More restrictive schemas live in packages/plugin/schemas/phase-NN.json (JSON Schema).
import { z } from 'zod';
import type { PhaseNumber } from '../spec/types.js';

const StatusSchema = z.enum([
  'Empty',
  'Draft',
  'Proposed',
  'Reviewed',
  'Approved',
  'Applied',
  'Deferred',
  'Superseded',
  'Accepted',
  'legacy',
]);

const ModeSchema = z.enum(['EXPANSION', 'SELECTIVE', 'HOLD', 'HOLD_SCOPE', 'REDUCTION']);

const commonFields = {
  phase: z.number().int().min(1).max(13),
  status: StatusSchema,
  mode: ModeSchema.optional(),
  version: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional(),
  'approved-date': z.union([z.string(), z.date()]).optional(),
  approver: z.string().optional(),
  'approval-method': z.string().optional(),
  'inputs-from': z.array(z.string()).optional(),
  note: z.string().optional(),
  'upstream-context': z.string().optional(),
  'upstream-product': z.string().optional(),
};

const baseSchema = z.object(commonFields).passthrough();

/** Return the schema for a given phase number. Currently returns a base schema for all phases. */
export function phaseFrontmatterSchema(_phase: PhaseNumber) {
  return baseSchema;
}
