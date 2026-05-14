import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanForId, scanForRegex } from '../src/verify/evidence/grep.js';
import {
  pathExists,
  existsRelative,
  hasSymbolInFile,
  findSymbol,
} from '../src/verify/evidence/fs.js';
import { commitsTouchingFile, blobSha, commitsMatching } from '../src/verify/evidence/git.js';

/**
 * US-V03 — evidence helpers.
 *
 * grep / fs operate on synthetic temp directories. git helpers are tested
 * for graceful degradation when the directory is not a git repo (return
 * empty arrays / null instead of throwing).
 */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'verify-ev-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('grep helpers (US-V03)', () => {
  it('scanForId finds whole-word matches but not substring partials', async () => {
    await mkdir(join(dir, 'tests'), { recursive: true });
    await writeFile(
      join(dir, 'tests', 'a.test.ts'),
      [
        '// covers AC-R1-1',
        'describe("AC-R1-1", () => {});',
        '// AC-R1-10 is different — not a hit for AC-R1-1',
        '',
      ].join('\n'),
      'utf8',
    );
    const hits = await scanForId(dir, 'tests', 'AC-R1-1');
    // Hits: line 1 (comment), line 2 (describe), and line 3's trailing
    // "AC-R1-1" mention (the AC-R1-10 substring is rejected by \b
    // because the trailing 0 is a word char).
    expect(hits.length).toBe(3);
    expect(hits.every((h) => h.file === 'tests/a.test.ts')).toBe(true);
  });

  it('scanForRegex respects the extensions filter', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    await writeFile(join(dir, 'src', 'a.ts'), 'TC-1 in ts\n', 'utf8');
    await writeFile(join(dir, 'src', 'b.md'), 'TC-1 in md\n', 'utf8');

    const tsOnly = await scanForRegex(dir, 'src', /TC-1/, { extensions: ['.ts'] });
    expect(tsOnly.length).toBe(1);
    expect(tsOnly[0].file).toBe('src/a.ts');
  });

  it('returns empty when the directory is missing', async () => {
    const hits = await scanForId(dir, 'no-such', 'AC-R1-1');
    expect(hits).toEqual([]);
  });

  it('skips node_modules and dist', async () => {
    await mkdir(join(dir, 'node_modules', 'x'), { recursive: true });
    await writeFile(join(dir, 'node_modules', 'x', 'y.ts'), 'TC-7\n', 'utf8');
    await mkdir(join(dir, 'dist'), { recursive: true });
    await writeFile(join(dir, 'dist', 'y.js'), 'TC-7\n', 'utf8');
    await mkdir(join(dir, 'tests'), { recursive: true });
    await writeFile(join(dir, 'tests', 'a.test.ts'), 'TC-7\n', 'utf8');

    const hits = await scanForId(dir, '.', 'TC-7');
    expect(hits.length).toBe(1);
    expect(hits[0].file).toBe('tests/a.test.ts');
  });
});

describe('fs helpers (US-V03)', () => {
  it('pathExists / existsRelative report presence correctly', async () => {
    await writeFile(join(dir, 'a.txt'), 'x', 'utf8');
    expect(await pathExists(join(dir, 'a.txt'))).toBe(true);
    expect(await pathExists(join(dir, 'b.txt'))).toBe(false);
    expect(await existsRelative(dir, 'a.txt')).toBe(true);
    expect(await existsRelative(dir, 'b.txt')).toBe(false);
  });

  it('hasSymbolInFile detects type-level definitions', async () => {
    // const / let are intentionally excluded — architect flagged that
    // `const Project = "foo"` would false-positive on ENT-Project even
    // when no domain entity is implemented. interface/type/class/
    // function/enum are still recognised.
    const file = join(dir, 's.ts');
    await writeFile(
      file,
      [
        'export interface Project { id: string }',
        'function helper() {}',
        'class Foo {}',
        'const bar = 1;',
        'type Alias = number;',
        'enum Color { Red }',
      ].join('\n'),
      'utf8',
    );

    expect(await hasSymbolInFile(file, 'Project')).toBe(1);
    expect(await hasSymbolInFile(file, 'helper')).toBe(2);
    expect(await hasSymbolInFile(file, 'Foo')).toBe(3);
    expect(await hasSymbolInFile(file, 'bar')).toBe(0); // const excluded
    expect(await hasSymbolInFile(file, 'Alias')).toBe(5);
    expect(await hasSymbolInFile(file, 'Color')).toBe(6);
    expect(await hasSymbolInFile(file, 'Missing')).toBe(0);
  });

  it('findSymbol walks a directory and locates the first definition', async () => {
    await mkdir(join(dir, 'src', 'nested'), { recursive: true });
    await writeFile(
      join(dir, 'src', 'nested', 'project.ts'),
      'export interface Project { id: string }',
      'utf8',
    );
    const hit = await findSymbol(dir, 'src', 'Project');
    expect(hit).not.toBeNull();
    expect(hit?.file).toBe('src/nested/project.ts');
  });

  it('findSymbol returns null when no match', async () => {
    await mkdir(join(dir, 'src'), { recursive: true });
    const hit = await findSymbol(dir, 'src', 'NoSuch');
    expect(hit).toBeNull();
  });
});

describe('git helpers (US-V03)', () => {
  it('returns empty / null when the dir is not a git repo', async () => {
    expect(await commitsTouchingFile(dir, 'a.txt')).toEqual([]);
    expect(await commitsMatching(dir, 'anything')).toEqual([]);
    expect(await blobSha(dir, 'missing')).toBeNull();
  });
});
