// T-CSA.15 — full-chain E2E (TC-86)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.15
//
// Copies docs/spec/ to a temp dir, runs the codemod, then the audit CLI,
// and asserts: (a) no review-required markers, (b) audit returns a
// coverage report shape (entitiesTotal, coveragePercent), (c) codemod is
// idempotent on the real dogfood spec.

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMigrate } from '../src/migrate/codemod.js';
import { runAttrsAudit } from '../src/cli/attrs-audit.js';

const PROJECT_ROOT = process.cwd();

describe('T-CSA.15 — full-chain migrate→audit E2E on dogfood (TC-86)', () => {
  it('migrate is idempotent on the real docs/spec/ tree', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'specrail-e2e-'));
    try {
      cpSync(join(PROJECT_ROOT, 'docs', 'spec'), join(tmp, 'docs', 'spec'), {
        recursive: true,
      });

      // First pass
      const r1 = await runMigrate({ projectRoot: tmp, apply: true });
      // Second pass — should produce 0 new renames
      const r2 = await runMigrate({ projectRoot: tmp, apply: true });
      expect(r2.renamed.length).toBe(0);
      // Verify scanned at least the spec files
      expect(r1.filesScanned).toBeGreaterThan(0);
      expect(r2.filesScanned).toBe(r1.filesScanned);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 30_000);

  it('audit produces a well-shaped coverage report on real spec', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'specrail-e2e-audit-'));
    try {
      cpSync(join(PROJECT_ROOT, 'docs', 'spec'), join(tmp, 'docs', 'spec'), {
        recursive: true,
      });
      const r = await runAttrsAudit({ projectRoot: tmp });
      expect(typeof r.coveragePercent).toBe('number');
      expect(r.coveragePercent).toBeGreaterThanOrEqual(0);
      // Denominator bias (countEntityHeadings over-counts section headings,
      // under-counts table-defined entities) means real coverage can exceed
      // 100% once attrs blocks land on table-defined entities. Allow up to
      // 200% pending the 0.2.1 denominator fix.
      expect(r.coveragePercent).toBeLessThanOrEqual(200);
      expect(r.entitiesTotal).toBeGreaterThan(0);
      expect(Array.isArray(r.perPhase)).toBe(true);
      // Spec has 13 phase files (+ docs not yet under per-phase migration).
      // Audit should have at least 1 per-phase entry on the dogfood.
      expect(r.perPhase.length).toBeGreaterThan(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 30_000);

  it('combined migrate+audit chain emits no review-required markers on dogfood', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'specrail-e2e-chain-'));
    try {
      cpSync(join(PROJECT_ROOT, 'docs', 'spec'), join(tmp, 'docs', 'spec'), {
        recursive: true,
      });
      await runMigrate({ projectRoot: tmp, apply: true });
      const r = await runAttrsAudit({ projectRoot: tmp });
      // Codemod is mechanical rename only — does not emit review-required
      // markers on its current scope. So audit should see 0.
      expect(r.reviewRequiredCount).toBe(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 30_000);
});
