// TC-78 (T-CSA.1) — attrs block parser
// Linked AC: AC-R-CSA-2 (id mismatch lint)
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.1
//
// Marker convention (proposal.md §3.1):
//   <!-- specrail:attrs id=ENTITY-ID -->
//   ```yaml
//   key: value
//   ...
//   ```
//   <!-- /specrail:attrs -->

import { describe, it, expect } from 'vitest';
import {
  parseAttrsBlocks,
  type AttrsBlock,
  type AttrsParseDiagnostic,
} from '../src/markdown/attrs.js';

describe('parseAttrsBlocks (T-CSA.1, TC-78, AC-R-CSA-2)', () => {
  it('parses a single valid attrs block', () => {
    const md = `# Phase 3

### R1: Structured I/O

<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
importance: P0
owner: PERSONA-1
\`\`\`
<!-- /specrail:attrs -->

(prose)
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    expect(diagnostics).toEqual([]);
    expect(blocks).toHaveLength(1);
    const b = blocks[0] as AttrsBlock;
    expect(b.entityId).toBe('R1');
    expect(b.payload).toEqual({
      status: 'Approved',
      importance: 'P0',
      owner: 'PERSONA-1',
    });
    expect(b.lineRange.start).toBeGreaterThan(0);
    expect(b.lineRange.end).toBeGreaterThanOrEqual(b.lineRange.start);
  });

  it('parses multiple attrs blocks in one file', () => {
    const md = `# Phase 3

### R1: A
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
\`\`\`
<!-- /specrail:attrs -->

### F-R1.1: child

<!-- specrail:attrs id=F-R1.1 -->
\`\`\`yaml
status: Approved
parent-r: R1
\`\`\`
<!-- /specrail:attrs -->
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    expect(diagnostics).toEqual([]);
    expect(blocks.map((b) => b.entityId)).toEqual(['R1', 'F-R1.1']);
  });

  it('emits diagnostic for invalid YAML body', () => {
    const md = `### R1
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
  bad indent: oops
not: : valid
\`\`\`
<!-- /specrail:attrs -->
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    expect(blocks).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);
    const d = diagnostics[0] as AttrsParseDiagnostic;
    expect(d.kind).toBe('invalid-yaml');
    expect(d.entityId).toBe('R1');
  });

  it('emits diagnostic when opening marker has no closing marker', () => {
    const md = `### R1
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
\`\`\`
(no closing marker — file ends here)
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    expect(blocks).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].kind).toBe('unclosed-marker');
  });

  it('emits diagnostic when fenced YAML block is missing inside markers', () => {
    const md = `### R1
<!-- specrail:attrs id=R1 -->
status: Approved
<!-- /specrail:attrs -->
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    expect(blocks).toHaveLength(0);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].kind).toBe('missing-yaml-fence');
  });

  it('emits diagnostic on duplicate entityId within one file', () => {
    const md = `### R1
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
\`\`\`
<!-- /specrail:attrs -->

### R1 (duplicate heading)
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Draft
\`\`\`
<!-- /specrail:attrs -->
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    // first block kept, second flagged
    expect(blocks).toHaveLength(1);
    expect(blocks[0].payload.status).toBe('Approved');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].kind).toBe('duplicate-id');
    expect(diagnostics[0].entityId).toBe('R1');
  });

  it('parses zero blocks from markdown with no attrs markers', () => {
    const md = `# Phase 3

### R1: Title

Regular prose. No attrs blocks.
`;
    const { blocks, diagnostics } = parseAttrsBlocks(md);
    expect(blocks).toEqual([]);
    expect(diagnostics).toEqual([]);
  });

  it('records sourceFile in lineRange when filePath provided', () => {
    const md = `### R1
<!-- specrail:attrs id=R1 -->
\`\`\`yaml
status: Approved
\`\`\`
<!-- /specrail:attrs -->
`;
    const { blocks } = parseAttrsBlocks(md, 'docs/spec/03-features.md');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].sourceFile).toBe('docs/spec/03-features.md');
  });
});
