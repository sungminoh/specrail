// @specrail/core — pure domain library.
// No fs / net / process imports anywhere in src/.

export * from './spec/index.js';
export {
  parsePhaseMarkdown,
  serializePhaseMarkdown,
  phaseFrontmatterSchema,
  type ParsedPhase,
} from './frontmatter/index.js';
export {
  extractPatches,
  applyHunks,
  PatchConflictError,
  PatchEnvelopeSchema,
  type PatchEnvelope,
  type ParsedPatchResult,
} from './patch/index.js';
export {
  buildGraph,
  nHop,
  findOrphans,
  findDanglingRefs,
  type GraphNode,
  type GraphEdge,
  type SpecGraph,
  type SubGraph,
} from './graph/index.js';
export {
  runChecks,
  type CheckFinding,
  type RunChecksOptions,
} from './checks/index.js';
