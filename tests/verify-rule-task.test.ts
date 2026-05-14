import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verify } from '../src/verify/index.js';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-task-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function writeSpec(rel: string, content: string) {
  await writeFile(join(dir, 'docs', 'spec', rel), content, 'utf8');
}

describe('task rule (US-V09)', () => {
  it('Built when all referenced files exist and contain no TODOs', async () => {
    await mkdir(join(dir, 'src', 'cli'), { recursive: true });
    await writeFile(join(dir, 'src', 'cli', 'hook-install.ts'), 'export const ok = true;\n', 'utf8');
    await writeSpec(
      '13-impl.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:def-list -->',
        '',
        '- T5.1 hook install entry point — `src/cli/hook-install.ts`',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('T5.1');
    expect(ev?.reality).toBe('Built');
    expect(ev?.rule).toBe('task-files-todo');
  });

  it('Partial when files exist but contain TODO markers', async () => {
    await mkdir(join(dir, 'src', 'cli'), { recursive: true });
    await writeFile(
      join(dir, 'src', 'cli', 'wip.ts'),
      '// TODO: real implementation\nexport const x = 1;\n',
      'utf8',
    );
    await writeSpec(
      '13-impl.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:def-list -->',
        '',
        '- T5.2 wip — `src/cli/wip.ts`',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('T5.2');
    expect(ev?.reality).toBe('Partial');
    expect(ev?.evidence.some((e) => e.kind === 'file-has-todo')).toBe(true);
  });

  it('NotBuilt when referenced files are all missing', async () => {
    await writeSpec(
      '13-impl.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:def-list -->',
        '',
        '- T9.99 phantom — `src/never/exists.ts`',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('T9.99');
    expect(ev?.reality).toBe('NotBuilt');
  });

  it('ManualReview when no path tokens are declared', async () => {
    await writeSpec(
      '13-impl.md',
      [
        '---',
        'phase: 13',
        'status: Approved',
        '---',
        '',
        '<!-- specrail:def-list -->',
        '',
        '- T8.1 abstract task without paths',
      ].join('\n'),
    );

    const r = await verify(dir, { skipTests: true });
    const ev = r.results.get('T8.1');
    expect(ev?.reality).toBe('ManualReview');
  });
});
