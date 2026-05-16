// TC-79 (T-CSA.2) — JSON Schema + ajv validator for attrs blocks
// Linked AC: AC-R-CSA-2 (id mismatch lint), AC-R-CSA-4 (unknown kind ERROR)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.2

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateAttrs,
  validateEdgeKind,
  classifyEntityKind,
  ATTRS_ENTITY_KINDS,
  _resetValidatorCache,
} from '../src/schema/validator.js';

beforeEach(() => {
  _resetValidatorCache();
});

describe('classifyEntityKind (T-CSA.2, AC-R-CSA-2)', () => {
  it('classifies canonical R-tier id', () => {
    expect(classifyEntityKind('R1')).toBe('R');
    expect(classifyEntityKind('R13')).toBe('R');
  });

  it('classifies F-tier id', () => {
    expect(classifyEntityKind('F-R1.1')).toBe('F');
    expect(classifyEntityKind('F-R13.4')).toBe('F');
  });

  it('classifies ENT-*', () => {
    expect(classifyEntityKind('ENT-Project')).toBe('ENT');
    expect(classifyEntityKind('ENT-AttrsBlock')).toBe('ENT');
  });

  it('classifies NFR with domain', () => {
    expect(classifyEntityKind('NFR-PERF-1')).toBe('NFR');
    expect(classifyEntityKind('NFR-A11Y-2')).toBe('NFR');
  });

  it('returns null for unknown shape', () => {
    expect(classifyEntityKind('zzz')).toBe(null);
    expect(classifyEntityKind('123')).toBe(null);
  });
});

describe('validateAttrs — R-tier (T-CSA.2, AC-R-CSA-2)', () => {
  it('accepts valid R-tier payload', async () => {
    const r = await validateAttrs(
      { status: 'Approved', importance: 'P0', owner: 'PERSONA-1' },
      'R',
    );
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects R-tier missing required field', async () => {
    const r = await validateAttrs(
      { importance: 'P0', owner: 'PERSONA-1' }, // no status
      'R',
    );
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /status/.test(e.message ?? '') || /status/.test(e.instancePath))).toBe(true);
  });

  it('accepts R-tier with all optional fields', async () => {
    const r = await validateAttrs(
      {
        status: 'Approved',
        importance: 'P0',
        owner: 'PERSONA-1',
        'solves-pains': ['PAIN-1', 'PAIN-2'],
        'linked-features': ['F-R1.1'],
        'linked-tests': ['TC-1'],
        mode: 'HOLD',
        since: '2026-05-10',
        'last-modified': '2026-05-15',
      },
      'R',
    );
    expect(r.valid).toBe(true);
  });

  it('rejects R-tier with unknown additional property', async () => {
    const r = await validateAttrs(
      { status: 'Approved', importance: 'P0', owner: 'PERSONA-1', bogus: 'x' },
      'R',
    );
    expect(r.valid).toBe(false);
  });
});

describe('validateAttrs — ENT scalar metadata (T-CSA.2)', () => {
  it('accepts ENT-* with linked-r scalar metadata (not typed edge)', async () => {
    const r = await validateAttrs(
      { status: 'Approved', 'aggregate-root': true, 'linked-r': ['R1'] },
      'ENT',
    );
    expect(r.valid).toBe(true);
  });

  it('accepts ENT-* with state-machine scalar reference', async () => {
    const r = await validateAttrs(
      { status: 'Approved', 'aggregate-root': false, 'state-machine': 'SM-Phase-Lifecycle' },
      'ENT',
    );
    expect(r.valid).toBe(true);
  });
});

describe('validateAttrs — NFR (T-CSA.2)', () => {
  it('accepts NFR with required fields', async () => {
    const r = await validateAttrs(
      { status: 'Approved', target: 50, unit: 'millisecond', 'measure-method': 'perf bench' },
      'NFR',
    );
    expect(r.valid).toBe(true);
  });

  it('rejects NFR missing measure-method', async () => {
    const r = await validateAttrs(
      { status: 'Approved', target: 50, unit: 'ms' },
      'NFR',
    );
    expect(r.valid).toBe(false);
  });
});

describe('validateAttrs — RISK (T-CSA.2)', () => {
  it('accepts RISK with severity/probability/mitigation', async () => {
    const r = await validateAttrs(
      { severity: 'H', probability: 'M', mitigation: 'codemod manual review' },
      'RISK',
    );
    expect(r.valid).toBe(true);
  });

  it('rejects RISK with invalid severity', async () => {
    const r = await validateAttrs(
      { severity: 'extreme', probability: 'M', mitigation: 'x' },
      'RISK',
    );
    expect(r.valid).toBe(false);
  });
});

describe('validateAttrs — unknown kind (AC-R-CSA-4)', () => {
  it('returns invalid for unregistered entity kind', async () => {
    const r = await validateAttrs({ foo: 'bar' }, 'UNKNOWN' as never);
    expect(r.valid).toBe(false);
    expect(r.errors[0]?.message).toMatch(/unknown.*kind|no schema|unregistered/i);
  });
});

describe('validateEdgeKind — closed enum 8 (T-CSA.2, AC-R-CSA-4)', () => {
  it('accepts canonical kinds from §3.4', () => {
    for (const kind of [
      'solves',
      'linked-features',
      'parent',
      'tested-by',
      'covers-ac',
      'mitigates',
      'linked-arch',
      'depends-on',
    ]) {
      expect(validateEdgeKind(kind).valid).toBe(true);
    }
  });

  it('rejects unknown kinds', () => {
    expect(validateEdgeKind('addresses').valid).toBe(false);
    expect(validateEdgeKind('').valid).toBe(false);
    expect(validateEdgeKind('SOLVES').valid).toBe(false); // case-sensitive
  });
});

describe('ATTRS_ENTITY_KINDS export (T-CSA.2)', () => {
  it('lists all 21 entity kinds per proposal §5', () => {
    expect(ATTRS_ENTITY_KINDS.length).toBe(21);
    expect(ATTRS_ENTITY_KINDS).toContain('R');
    expect(ATTRS_ENTITY_KINDS).toContain('F');
    expect(ATTRS_ENTITY_KINDS).toContain('S');
    expect(ATTRS_ENTITY_KINDS).toContain('ENT');
    expect(ATTRS_ENTITY_KINDS).toContain('INV');
    expect(ATTRS_ENTITY_KINDS).toContain('NFR');
    expect(ATTRS_ENTITY_KINDS).toContain('ARCH');
    expect(ATTRS_ENTITY_KINDS).toContain('EXT');
    expect(ATTRS_ENTITY_KINDS).toContain('OPS');
    expect(ATTRS_ENTITY_KINDS).toContain('ADR');
    expect(ATTRS_ENTITY_KINDS).toContain('RISK');
    expect(ATTRS_ENTITY_KINDS).toContain('TC');
    expect(ATTRS_ENTITY_KINDS).toContain('EDGE');
    expect(ATTRS_ENTITY_KINDS).toContain('OQ');
    expect(ATTRS_ENTITY_KINDS).toContain('PERSONA');
    expect(ATTRS_ENTITY_KINDS).toContain('SCEN');
    expect(ATTRS_ENTITY_KINDS).toContain('JNY');
    expect(ATTRS_ENTITY_KINDS).toContain('ZN');
    expect(ATTRS_ENTITY_KINDS).toContain('KPI');
    expect(ATTRS_ENTITY_KINDS).toContain('P-CC');
    expect(ATTRS_ENTITY_KINDS).toContain('T');
  });
});
