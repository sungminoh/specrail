/**
 * Domain entities — TypeScript shapes for the 9 ENT-* entries in
 * docs/spec/04-domain-model.md. These are kept here as a single source
 * of truth so that:
 *
 *   1. Plugin code consuming these concepts can import a concrete type
 *      instead of redefining ad-hoc shapes per call-site.
 *   2. The verifier (`ent-symbol` rule, src/verify/id-rules/ent.ts)
 *      finds a matching `interface|type|class|enum|function Name` for
 *      each ENT-* citation. Without this file, every ENT in the spec
 *      reported NotBuilt even though the concepts were implemented
 *      throughout the codebase (just with different internal names).
 *
 * The type-system shape mirrors the column rows in 04-domain-model.md
 * — additions to the spec must keep this file in sync.
 */

/** Branded ID aliases — kept structurally compatible with `string` so
 *  existing code that uses raw `string` IDs continues to compile. */
export type ProjectId = string;
export type PhaseId = number;
export type SpecId = string;
export type AcId = string;
export type HookId = string;
export type ChangeId = string;
export type SkillName = string;
export type SubagentId = string;
export type ConsentId = string;
export type CapabilityId = string;
export type TaskId = string;
export type PainId = string;
export type FilePath = string;
export type ISODateTime = string;
export type SemVer = string;

export type PhaseStatus = 'Empty' | 'Draft' | 'Approved';
export type SpecStatus = 'Draft' | 'Approved' | 'Implementing' | 'Done';
export type SpecTier = 'Requirement' | 'Feature' | 'Specification';
export type Importance = 'P0' | 'P1' | 'P2' | 'P3';
export type HookType = 'PreCommit' | 'PhaseTransition' | 'SchemaValidation';
export type HookStatus = 'Installed' | 'Failed' | 'Disabled';
export type ChangeStatus =
  | 'Proposed'
  | 'Reviewed'
  | 'Approved'
  | 'Applied'
  | 'Archived';
export type SubagentStage =
  | 'Implementation'
  | 'SpecReview'
  | 'QualityReview';
export type SubagentStatus = 'Running' | 'Passed' | 'Blocked' | 'Failed';
export type ConsentStatus = 'NotAsked' | 'OptedIn' | 'OptedOut';

/** ENT-Project — plugin이 관리하는 한 사용자 product 사양화 단위. */
export interface Project {
  readonly id: ProjectId;
  readonly rootPath: FilePath;
  readonly createdAt: ISODateTime;
  readonly name?: string;
}

/** ENT-Phase — 13단계 중 하나. */
export interface Phase {
  readonly id: PhaseId;
  readonly name: string;
  readonly projectId: ProjectId;
  readonly skillName: SkillName;
  readonly status: PhaseStatus;
  readonly outputPath: FilePath;
  readonly approvedAt?: ISODateTime;
}

/** ENT-Spec — 산출물 안의 한 결정 단위 (R/F/S 3-tier). */
export interface Spec {
  readonly id: SpecId;
  readonly tier: SpecTier;
  readonly phaseId: PhaseId;
  readonly description: string;
  readonly importance: Importance;
  readonly status: SpecStatus;
  readonly sourcePainIds?: readonly PainId[];
  readonly frontmatterRaw: string;
}

/** ENT-AcceptanceCriteria — Requirement 수준 testable 조건. */
export interface AcceptanceCriteria {
  readonly id: AcId;
  readonly requirementId: SpecId;
  readonly given: string;
  readonly when: string;
  readonly then: string;
}

/** ENT-Hook — Plugin이 install·관리하는 검증 hook 정의. */
export interface Hook {
  readonly id: HookId;
  readonly type: HookType;
  readonly projectId: ProjectId;
  readonly installPath: FilePath;
  readonly status: HookStatus;
}

/** ENT-Change (DELTA mode) — 기존 spec 위 변경 단위. */
export interface Change {
  readonly id: ChangeId;
  readonly projectId: ProjectId;
  readonly capability: CapabilityId;
  readonly status: ChangeStatus;
  readonly affectedPhases: readonly PhaseId[];
  readonly addedSpecIds?: readonly SpecId[];
  readonly modifiedSpecIds?: readonly SpecId[];
  readonly removedSpecIds?: readonly SpecId[];
  readonly createdAt: ISODateTime;
  readonly appliedAt?: ISODateTime;
}

/** ENT-Skill — Claude Code skill 정의. */
export interface Skill {
  readonly name: SkillName;
  readonly version: SemVer;
  readonly triggerWords: readonly string[];
  readonly inputSchema: unknown;
  readonly outputSchema: unknown;
  readonly requiresPhaseStatus: readonly PhaseStatus[];
}

/** ENT-Subagent — Phase 13 atomic task 별 fresh subagent. */
export interface Subagent {
  readonly id: SubagentId;
  readonly taskId: TaskId;
  readonly stage: SubagentStage;
  readonly status: SubagentStatus;
  readonly escalationReason?: string;
}

/** ENT-TelemetryConsent — 사용자 opt-in 동의 상태 (Local storage). */
export interface TelemetryConsent {
  readonly id: ConsentId;
  readonly status: ConsentStatus;
  readonly consentedAt?: ISODateTime;
  readonly revokedAt?: ISODateTime;
}
