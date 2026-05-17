// Domain types — Phase 4 (Domain Model) ENT-* mapped to zod schemas.
// Pure: no I/O, no env, no time except where epoch is explicit.
import { z } from 'zod';

export const PhaseNumberSchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
  z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10),
  z.literal(11), z.literal(12), z.literal(13),
]);
export type PhaseNumber = z.infer<typeof PhaseNumberSchema>;

// Spec ID pattern reused from plugin (see packages/plugin/src/spec/patterns.ts).
// Liberal-but-bounded; full validation lives in the plugin's schema package.
export const SpecIdSchema = z
  .string()
  .min(1)
  .regex(/^[A-Z][A-Za-z0-9\-.]*$/, 'invalid spec id (must start with uppercase letter)');
export type SpecId = z.infer<typeof SpecIdSchema>;

export const ProjectIdSchema = z.string().regex(/^[a-f0-9]{16,64}$/);
export type ProjectId = z.infer<typeof ProjectIdSchema>;

export const PatchProposalIdSchema = z.string().uuid().or(z.string().regex(/^[0-9a-f]{32,}$/));
export type PatchProposalId = z.infer<typeof PatchProposalIdSchema>;

export const AiSessionIdSchema = z.string().uuid().or(z.string().regex(/^[0-9a-f]{32,}$/));
export type AiSessionId = z.infer<typeof AiSessionIdSchema>;

export const IssueIdSchema = z.string().min(1);
export type IssueId = z.infer<typeof IssueIdSchema>;

export const TextRangeSchema = z.object({
  startLine: z.number().int().min(1),
  startCol: z.number().int().min(1),
  endLine: z.number().int().min(1),
  endCol: z.number().int().min(1),
});
export type TextRange = z.infer<typeof TextRangeSchema>;

export const ProjectSchema = z.object({
  id: ProjectIdSchema,
  name: z.string().min(1),
  rootPath: z.string().min(1),
  hasSpecrail: z.boolean(),
  lastOpenedAt: z.string().datetime().or(z.date()),
});
export type Project = z.infer<typeof ProjectSchema>;

export const SpecRefSchema = z.object({
  from: SpecIdSchema,
  to: SpecIdSchema,
  line: z.number().int().min(1),
});
export type SpecRef = z.infer<typeof SpecRefSchema>;

export const PhaseSchema = z.object({
  projectId: ProjectIdSchema,
  number: PhaseNumberSchema,
  slug: z.string().min(1),
  filePath: z.string().min(1),
  frontmatter: z.record(z.unknown()),
  body: z.string(),
  parsedIds: z.array(SpecIdSchema),
  parsedRefs: z.array(SpecRefSchema),
  mtimeMs: z.number().int().min(0),
});
export type Phase = z.infer<typeof PhaseSchema>;

export const IssueSeveritySchema = z.enum(['error', 'warn', 'info']);
export type IssueSeverity = z.infer<typeof IssueSeveritySchema>;

export const IssueSourceSchema = z.enum(['plugin-self-check', 'cross-phase', 'ai-quality']);
export type IssueSource = z.infer<typeof IssueSourceSchema>;

export const IssueLocationSchema = z.object({
  phase: PhaseNumberSchema,
  line: z.number().int().min(1).optional(),
  specId: SpecIdSchema.optional(),
});
export type IssueLocation = z.infer<typeof IssueLocationSchema>;

export const IssueSchema = z.object({
  id: IssueIdSchema,
  projectId: ProjectIdSchema,
  severity: IssueSeveritySchema,
  source: IssueSourceSchema,
  ruleId: z.string().min(1),
  message: z.string().min(1),
  location: IssueLocationSchema,
  suggestedPatch: PatchProposalIdSchema.optional(),
});
export type Issue = z.infer<typeof IssueSchema>;

export const PatchOriginSchema = z.enum(['issue-fix', 'chat', 'inline-rewrite']);
export type PatchOrigin = z.infer<typeof PatchOriginSchema>;

export const PatchStatusSchema = z.enum(['proposed', 'accepted', 'rejected', 'stale']);
export type PatchStatus = z.infer<typeof PatchStatusSchema>;

export const HunkSchema = z.object({
  before: z.string(),
  after: z.string(),
});
export type Hunk = z.infer<typeof HunkSchema>;

export const PatchProposalSchema = z.object({
  id: PatchProposalIdSchema,
  projectId: ProjectIdSchema,
  createdAt: z.string().datetime().or(z.date()),
  origin: PatchOriginSchema,
  target: z.object({
    phase: PhaseNumberSchema,
    selection: TextRangeSchema.optional(),
  }),
  hunks: z.array(HunkSchema).min(1),
  rationale: z.string(),
  status: PatchStatusSchema,
  basedOnMtimeMs: z.number().int().min(0),
});
export type PatchProposal = z.infer<typeof PatchProposalSchema>;

export const AiOriginSchema = z.enum(['review-scan', 'chat', 'inline']);
export type AiOrigin = z.infer<typeof AiOriginSchema>;

export const AiStatusSchema = z.enum(['idle', 'streaming', 'done', 'error']);
export type AiStatus = z.infer<typeof AiStatusSchema>;

export const AiMessageRoleSchema = z.enum(['user', 'assistant']);
export type AiMessageRole = z.infer<typeof AiMessageRoleSchema>;

export const AiMessageSchema = z.object({
  sessionId: AiSessionIdSchema,
  role: AiMessageRoleSchema,
  content: z.string(),
  ts: z.string().datetime().or(z.date()),
});
export type AiMessage = z.infer<typeof AiMessageSchema>;

export const AiSessionSchema = z.object({
  id: AiSessionIdSchema,
  projectId: ProjectIdSchema,
  phase: PhaseNumberSchema.optional(),
  origin: AiOriginSchema,
  messages: z.array(AiMessageSchema),
  proposedPatches: z.array(PatchProposalIdSchema),
  status: AiStatusSchema,
  startedAt: z.string().datetime().or(z.date()),
  endedAt: z.string().datetime().or(z.date()).optional(),
});
export type AiSession = z.infer<typeof AiSessionSchema>;

export const RegistrySchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  projects: z.array(ProjectSchema),
  lastActiveProjectId: ProjectIdSchema.optional(),
});
export type Registry = z.infer<typeof RegistrySchema>;

export const FileWatcherSubscriptionSchema = z.object({
  projectId: ProjectIdSchema,
  pathsWatched: z.array(z.string()),
  started: z.boolean(),
  lastEventTs: z.string().datetime().or(z.date()).optional(),
});
export type FileWatcherSubscription = z.infer<typeof FileWatcherSubscriptionSchema>;
