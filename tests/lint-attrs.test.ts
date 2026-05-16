// T-CSA.8 — attrs-completeness + attrs-placement lints
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.8
// Linked AC: AC-R-CSA-1, AC-R-CSA-3, AC-R-CSA-5, AC-R-CSA-6
// Lint windows: v0.2.0~v0.4.0 → WARN, v0.5.0+ → ERROR (OQ-CSA-3 resolved).
// review-required marker → ERROR regardless of version (OQ-CSA-10).

import { describe, it, expect } from 'vitest';
import {
  lintAttrs,
  type LintLevel,
  type AttrsLintFinding,
} from '../src/lint/attrs-lint.js';

describe('lintAttrs — attrs-completeness (T-CSA.8, AC-R-CSA-1/6)', () => {
  it('flags R-tier missing required `status` (v0.2.0 → WARN)', () => {
    const md = `### R1: Title

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;
    const r = lintAttrs(md, { pluginVersion: '0.2.0' });
    const missing = r.findings.find(
      (f) => f.kind === 'attrs-completeness' && /status/.test(f.message),
    );
    expect(missing).toBeDefined();
    expect((missing as AttrsLintFinding).level).toBe<LintLevel>('warn');
    expect(missing?.message).toMatch(/specrail migrate --fix/);
  });

  it('flags missing required field at ERROR severity for v0.5.0+', () => {
    const md = `### R1: Title

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;
    const r = lintAttrs(md, { pluginVersion: '0.5.0' });
    const f = r.findings.find((x) => x.kind === 'attrs-completeness');
    expect(f?.level).toBe<LintLevel>('error');
  });

  it('passes when all required fields present', () => {
    const md = `<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;
    const r = lintAttrs(md, { pluginVersion: '0.2.0' });
    const completeness = r.findings.filter((f) => f.kind === 'attrs-completeness');
    expect(completeness).toEqual([]);
  });

  it('flags unknown entity kind (classifyEntityKind returns null)', () => {
    const md = `<!-- specrail:attrs id=FOO-BAR-NOPE -->
\`\`\`yaml
status: Approved
\`\`\`
<!-- /specrail:attrs -->
`;
    const r = lintAttrs(md, { pluginVersion: '0.2.0' });
    expect(r.findings.some((f) => f.kind === 'attrs-completeness' && /unknown.*kind/i.test(f.message))).toBe(true);
  });
});

describe('lintAttrs — attrs-placement (T-CSA.8, AC-R-CSA-3)', () => {
  it('passes when attrs follows entity heading directly (with at most 1 blank line)', () => {
    const md = `### R1: Title

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->

(prose)
`;
    const r = lintAttrs(md, { pluginVersion: '0.2.0' });
    expect(r.findings.filter((f) => f.kind === 'attrs-placement')).toEqual([]);
  });

  it('flags attrs block far from heading (mid-paragraph)', () => {
    const md = `### R1: Title

Some prose paragraph here.

Another paragraph.

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;
    const r = lintAttrs(md, { pluginVersion: '0.2.0' });
    const placement = r.findings.find((f) => f.kind === 'attrs-placement');
    expect(placement).toBeDefined();
    expect(placement?.level).toBe<LintLevel>('error'); // placement always ERROR
  });

  it('passes for attrs with no preceding heading (e.g. table attrs)', () => {
    // No heading → no placement violation (different rule applies)
    const md = `Some prose.

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;
    const r = lintAttrs(md, { pluginVersion: '0.2.0' });
    // Acceptable — no preceding heading to anchor to. Should NOT trigger placement error.
    expect(r.findings.filter((f) => f.kind === 'attrs-placement')).toEqual([]);
  });
});

describe('lintAttrs — review-required marker (T-CSA.8, AC-R-CSA-5, OQ-CSA-10)', () => {
  it('flags review-required marker as ERROR regardless of version', () => {
    const md = `<!-- specrail:attrs-review-required reason="yaml-conflict" -->
### R1: Title
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;
    const r020 = lintAttrs(md, { pluginVersion: '0.2.0' });
    const f020 = r020.findings.find((f) => f.kind === 'review-required');
    expect(f020?.level).toBe<LintLevel>('error');

    const r050 = lintAttrs(md, { pluginVersion: '0.5.0' });
    const f050 = r050.findings.find((f) => f.kind === 'review-required');
    expect(f050?.level).toBe<LintLevel>('error');
  });
});
