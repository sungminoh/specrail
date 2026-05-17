import { describe, it, expect } from 'vitest';
import {
  ProjectSchema,
  PhaseSchema,
  IssueSchema,
  PatchProposalSchema,
  AiSessionSchema,
  RegistrySchema,
} from '../src/spec/index.js';

describe('zod schemas accept valid shapes', () => {
  it('Project', () => {
    expect(() =>
      ProjectSchema.parse({
        id: 'a1b2c3d4e5f60718',
        name: 'specrail',
        rootPath: '/Users/x/y',
        hasSpecrail: true,
        lastOpenedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it('Phase', () => {
    expect(() =>
      PhaseSchema.parse({
        projectId: 'a1b2c3d4e5f60718',
        number: 1,
        slug: 'prd',
        filePath: 'docs/spec/01-prd.md',
        frontmatter: { phase: 1 },
        body: '# PRD',
        parsedIds: ['R1'],
        parsedRefs: [],
        mtimeMs: 12345,
      }),
    ).not.toThrow();
  });

  it('PatchProposal', () => {
    expect(() =>
      PatchProposalSchema.parse({
        id: '0192c1a4b8db7700a000000000000000',
        projectId: 'a1b2c3d4e5f60718',
        createdAt: new Date(),
        origin: 'chat',
        target: { phase: 3 },
        hunks: [{ before: 'x', after: 'y' }],
        rationale: 'because',
        status: 'proposed',
        basedOnMtimeMs: 0,
      }),
    ).not.toThrow();
  });

  it('AiSession', () => {
    expect(() =>
      AiSessionSchema.parse({
        id: '0192c1a4b8db7700a000000000000001',
        projectId: 'a1b2c3d4e5f60718',
        origin: 'chat',
        messages: [],
        proposedPatches: [],
        status: 'idle',
        startedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it('Registry', () => {
    expect(() =>
      RegistrySchema.parse({
        version: '0.1.0',
        projects: [],
      }),
    ).not.toThrow();
  });

  it('Issue', () => {
    expect(() =>
      IssueSchema.parse({
        id: 'iss-1',
        projectId: 'a1b2c3d4e5f60718',
        severity: 'warn',
        source: 'cross-phase',
        ruleId: 'dangling-ref',
        message: 'F1.1 references R3 which is not defined',
        location: { phase: 3 },
      }),
    ).not.toThrow();
  });
});

describe('zod schemas reject invalid shapes', () => {
  it('rejects bad phase number', () => {
    expect(() =>
      PhaseSchema.parse({
        projectId: 'a1b2c3d4e5f60718',
        number: 14,
        slug: 'x',
        filePath: 'p',
        frontmatter: {},
        body: '',
        parsedIds: [],
        parsedRefs: [],
        mtimeMs: 0,
      }),
    ).toThrow();
  });

  it('rejects empty hunks', () => {
    expect(() =>
      PatchProposalSchema.parse({
        id: '0192c1a4b8db7700a000000000000000',
        projectId: 'a1b2c3d4e5f60718',
        createdAt: new Date(),
        origin: 'chat',
        target: { phase: 3 },
        hunks: [],
        rationale: '',
        status: 'proposed',
        basedOnMtimeMs: 0,
      }),
    ).toThrow();
  });
});
