// T-CSA.9 — state machine attrs presence gate (INV-3 extension)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.9
// Linked AC: AC-R-CSA-1

import { describe, it, expect } from 'vitest';
import { checkApprovedAttrsGate } from '../src/state/machine.js';

const completeR1 = `### R1: Title

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;

const incompleteR1 = `### R1: Title

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
importance: P0
\`\`\`
<!-- /specrail:attrs -->
`;

const withReviewMarker = `<!-- specrail:attrs-review-required reason="yaml-conflict" -->
### R1: Title
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`;

describe('checkApprovedAttrsGate (T-CSA.9, INV-3 extension, AC-R-CSA-1)', () => {
  it('pass when all required attrs present (any version)', () => {
    const r020 = checkApprovedAttrsGate(completeR1, '0.2.0');
    expect(r020.level).toBe('pass');
    const r050 = checkApprovedAttrsGate(completeR1, '0.5.0');
    expect(r050.level).toBe('pass');
  });

  it('WARN under v0.2.0~v0.4.x when required attrs missing (transition allowed)', () => {
    const r020 = checkApprovedAttrsGate(incompleteR1, '0.2.0');
    expect(r020.level).toBe('warn');
    expect(r020.missing.length).toBeGreaterThan(0);
    expect(r020.message).toMatch(/specrail migrate --fix/);

    const r040 = checkApprovedAttrsGate(incompleteR1, '0.4.0');
    expect(r040.level).toBe('warn');
  });

  it('ERROR at v0.5.0+ when required attrs missing (transition blocked)', () => {
    const r050 = checkApprovedAttrsGate(incompleteR1, '0.5.0');
    expect(r050.level).toBe('error');
    expect(r050.message).toMatch(/rejected/);
  });

  it('review-required marker → ERROR regardless of version (OQ-CSA-10)', () => {
    const r020 = checkApprovedAttrsGate(withReviewMarker, '0.2.0');
    expect(r020.level).toBe('error');
    expect(r020.missing.some((f) => f.kind === 'review-required')).toBe(true);

    const r050 = checkApprovedAttrsGate(withReviewMarker, '0.5.0');
    expect(r050.level).toBe('error');
  });
});
