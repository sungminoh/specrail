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

  it('hasSymbolInFile requires substantive declarations (round-N: empty stubs rejected)', async () => {
    // Round-N audit: `interface Project {}` empty stub vacuously
    // matched ENT-Project. New rule needs substance:
    //   interface/class/enum → ≥1 member
    //   function             → params OR body statements
    //   type alias           → not {}/any/never/unknown
    const file = join(dir, 's.ts');
    await writeFile(
      file,
      [
        'export interface Project { id: string }', // 1: 1 member ✓
        'function helper(input: string) { return input; }', // 2: params + body ✓
        'class Foo { name = "foo"; }', // 3: 1 member ✓
        'const bar = 1;', // 4: const ignored
        'type Alias = number;', // 5: substantive type ✓
        'enum Color { Red }', // 6: 1 member ✓
      ].join('\n'),
      'utf8',
    );

    expect(await hasSymbolInFile(file, 'Project')).toBe(1);
    expect(await hasSymbolInFile(file, 'helper')).toBe(2);
    expect(await hasSymbolInFile(file, 'Foo')).toBe(3);
    expect(await hasSymbolInFile(file, 'bar')).toBe(0);
    expect(await hasSymbolInFile(file, 'Alias')).toBe(5);
    expect(await hasSymbolInFile(file, 'Color')).toBe(6);
    expect(await hasSymbolInFile(file, 'Missing')).toBe(0);
  });

  it('hasSymbolInFile REJECTS empty stubs', async () => {
    const file = join(dir, 'stubs.ts');
    await writeFile(
      file,
      [
        'export interface User {}',
        'class Empty {}',
        'function noop() {}',
        'type Anything = any;',
        'type Nothing = {};',
        'enum Void {}',
      ].join('\n'),
      'utf8',
    );

    expect(await hasSymbolInFile(file, 'User')).toBe(0);
    expect(await hasSymbolInFile(file, 'Empty')).toBe(0);
    expect(await hasSymbolInFile(file, 'noop')).toBe(0);
    expect(await hasSymbolInFile(file, 'Anything')).toBe(0);
    expect(await hasSymbolInFile(file, 'Nothing')).toBe(0);
    expect(await hasSymbolInFile(file, 'Void')).toBe(0);
  });

  it('hasSymbolInFile REJECTS interfaces whose only members have trivial types (round-N+1)', async () => {
    // Architect round-N+1: single `_stub: never` member passed the
    // previous ≥1-member check trivially. Now substantive requires
    // at least one member with a non-trivial type annotation.
    const file = join(dir, 'trivial-stubs.ts');
    await writeFile(
      file,
      [
        'export interface NeverStub { _stub: never; }', // line 1: trivial
        'export interface AnyStub { _stub: any; }',     // line 2: trivial
        'export interface VoidStub { _stub: void; }',   // line 3: trivial
        'export interface UndefinedStub { _stub: undefined; }', // line 4: trivial
        'export interface EmptyTypeStub { _stub: {}; }', // line 5: trivial
        'export interface MixedReal { _stub: never; id: string; }', // line 6: substantive (one real member)
      ].join('\n'),
      'utf8',
    );

    expect(await hasSymbolInFile(file, 'NeverStub')).toBe(0);
    expect(await hasSymbolInFile(file, 'AnyStub')).toBe(0);
    expect(await hasSymbolInFile(file, 'VoidStub')).toBe(0);
    expect(await hasSymbolInFile(file, 'UndefinedStub')).toBe(0);
    expect(await hasSymbolInFile(file, 'EmptyTypeStub')).toBe(0);
    expect(await hasSymbolInFile(file, 'MixedReal')).toBe(6);
  });

  it('hasSymbolInFile accepts member with inferred type (no annotation)', async () => {
    // Class properties with initializers and no explicit type annotation
    // count as substantive — the initializer carries the semantic.
    const file = join(dir, 'inferred.ts');
    await writeFile(
      file,
      [
        'export class Inferred {',
        '  name = "default"; // no type annotation, but real value',
        '}',
      ].join('\n'),
      'utf8',
    );
    expect(await hasSymbolInFile(file, 'Inferred')).toBe(1);
  });

  it('hasSymbolInFile rejects union/intersection types whose constituents are ALL trivial (architect round-N+2)', async () => {
    const file = join(dir, 'union-stubs.ts');
    await writeFile(
      file,
      [
        'export interface UnionStub1 { id: never | any; }', // all-trivial union
        'export interface UnionStub2 { id: void | undefined | null; }', // all trivials
        'export interface UnionStub3 { id: never & any; }', // intersection of trivials
        'export interface MixedUnion { id: string | undefined; }', // string is non-trivial → accept
        'export interface RealUnion { id: string | never; }', // string is non-trivial → accept (never doesn\'t poison)
        'export interface TypeofStub { id: typeof undefined; }', // typeof undefined ≡ undefined
      ].join('\n'),
      'utf8',
    );

    expect(await hasSymbolInFile(file, 'UnionStub1')).toBe(0);
    expect(await hasSymbolInFile(file, 'UnionStub2')).toBe(0);
    expect(await hasSymbolInFile(file, 'UnionStub3')).toBe(0);
    expect(await hasSymbolInFile(file, 'MixedUnion')).toBe(4);
    expect(await hasSymbolInFile(file, 'RealUnion')).toBe(5);
    expect(await hasSymbolInFile(file, 'TypeofStub')).toBe(0);
  });

  it('hasSymbolInFile accepts methods/getters as substance signals', async () => {
    const file = join(dir, 'methods.ts');
    await writeFile(
      file,
      [
        'export interface HasMethod {',
        '  doThing(input: string): void;',
        '}',
        'export class HasGetter {',
        '  get value(): string { return "x"; }',
        '}',
      ].join('\n'),
      'utf8',
    );
    expect(await hasSymbolInFile(file, 'HasMethod')).toBe(1);
    expect(await hasSymbolInFile(file, 'HasGetter')).toBe(4);
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
