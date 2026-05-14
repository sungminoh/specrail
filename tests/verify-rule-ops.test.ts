import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-ops-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('ops-path rule (US-V07)', () => {
  it('Built when referenced .github/workflows/ path exists', async () => {
    await mkdir(join(dir, '.github', 'workflows'), { recursive: true });
    await writeFile(join(dir, '.github', 'workflows', 'release.yml'), '# ok\n', 'utf8');
    await writeSpec(
      '11-ops.md',
      [
        '---',
        'phase: 11',
        'status: Approved',
        '---',
        '',
        '## OPS-1: deploy',
        '',
        '`.github/workflows/release.yml` is the deploy entry point.',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('OPS-1');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('ops-path');
  });

  it('NotBuilt when referenced path is missing', async () => {
    await writeSpec(
      '11-ops.md',
      [
        '---',
        'phase: 11',
        'status: Approved',
        '---',
        '',
        '## OPS-99: phantom',
        '',
        '`.github/workflows/never.yml` would deploy.',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('OPS-99');
    expect(ev?.reality).toBe('NotBuilt');
  });

  it('ManualReview when no path tokens are declared', async () => {
    await writeSpec(
      '11-ops.md',
      [
        '---',
        'phase: 11',
        'status: Approved',
        '---',
        '',
        '## OPS-5: abstract concept',
        '',
        'No concrete path declared.',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('OPS-5');
    expect(ev?.reality).toBe('ManualReview');
  });
});

describe('rb-content rule (US-V07)', () => {
  it('Built when a dedicated docs/runbooks/RB-{n}*.md exists', async () => {
    await mkdir(join(dir, 'docs', 'runbooks'), { recursive: true });
    await writeFile(
      join(dir, 'docs', 'runbooks', 'RB-1-secret-rotation.md'),
      '# Rotation\nbody',
      'utf8',
    );
    await writeSpec(
      '11-ops.md',
      [
        '---',
        'phase: 11',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| RB | 시나리오 |',
        '|---|---|',
        '| RB-1 | Secret rotation incident response procedure |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('RB-1');
    expect(ev?.reality).toBe('Built');
    expect(ev?.evidence.some((e) => e.kind === 'runbook-doc')).toBe(true);
  });

  it('Built when inline definition row has substantive body', async () => {
    await writeSpec(
      '11-ops.md',
      [
        '---',
        'phase: 11',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| RB | 시나리오 |',
        '|---|---|',
        '| RB-2 | Hook install 실패 사용자 보고 → OS 별 가이드 |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('RB-2');
    expect(ev?.reality).toBe('Built');
    expect(ev?.evidence.some((e) => e.kind === 'inline-body')).toBe(true);
  });

  it('NotBuilt when the inline body is only "TBD"', async () => {
    await writeSpec(
      '11-ops.md',
      [
        '---',
        'phase: 11',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:deftable -->',
        '| RB | 시나리오 |',
        '|---|---|',
        '| RB-3 | TBD |',
      ].join('\n'),
    );
    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('RB-3');
    expect(ev?.reality).toBe('NotBuilt');
  });
});
