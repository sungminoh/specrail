// T-CSA.10 — specrail audit CLI
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.10
// Linked NFR: NFR-CSA-A11Y-1 (CLI output)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAttrsAudit, type AttrsAuditReport } from '../src/cli/attrs-audit.js';

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'specrail-audit-'));
  mkdirSync(join(tmpRoot, 'docs', 'spec'), { recursive: true });
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

function writeSpec(rel: string, content: string): void {
  writeFileSync(join(tmpRoot, rel), content);
}

describe('runAttrsAudit — coverage (T-CSA.10)', () => {
  it('reports 100% coverage when every entity has complete attrs', async () => {
    writeSpec(
      'docs/spec/03-features.md',
      `# Features
### R1: Title
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`,
    );
    const r = await runAttrsAudit({ projectRoot: tmpRoot });
    expect(r.coveragePercent).toBe(100);
    expect(r.entitiesTotal).toBe(1);
    expect(r.entitiesWithAttrs).toBe(1);
    expect(r.entitiesComplete).toBe(1);
  });

  it('reports partial coverage when some entities have attrs but missing required fields', async () => {
    writeSpec(
      'docs/spec/03-features.md',
      `### R1: Title
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->

### R2: Title2
<!-- specrail:attrs id=R2 -->
\`\`\`yaml
importance: P0
\`\`\`
<!-- /specrail:attrs -->
`,
    );
    const r = await runAttrsAudit({ projectRoot: tmpRoot });
    expect(r.entitiesWithAttrs).toBe(2);
    expect(r.entitiesComplete).toBe(1);
    expect(r.coveragePercent).toBe(50);
  });

  it('counts review-required markers separately', async () => {
    writeSpec(
      'docs/spec/03-features.md',
      `<!-- specrail:attrs-review-required reason="yaml-conflict" -->
### R1: Title
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`,
    );
    const r = await runAttrsAudit({ projectRoot: tmpRoot });
    expect(r.reviewRequiredCount).toBe(1);
  });
});

describe('renderMarkdown — output format (T-CSA.10, OQ-CSA-6)', () => {
  it('renders a markdown report with sections', async () => {
    writeSpec(
      'docs/spec/03-features.md',
      `### R1: Title
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->
`,
    );
    const r = await runAttrsAudit({ projectRoot: tmpRoot });
    const md = renderAttrsAuditMarkdown(r);
    expect(md).toContain('# Attrs coverage');
    expect(md).toContain('100');
  });
});

import { renderAttrsAuditMarkdown } from '../src/cli/attrs-audit.js';
