import { describe, it, expect } from 'vitest';
import { checkCommit, type AtomicCommitResult } from '../src/lint/atomic-commit.js';

function files(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `file${i}.ts`);
}

describe('US-9.2 Atomic commit lint — mega-commit detection', () => {
  // TC-1: FAIL — 12 files, no atomic ref
  it('FAIL: 12 files with no US/T ref', () => {
    const result: AtomicCommitResult = checkCommit(files(12), 'refactor module');
    expect(result.status).toBe('FAIL');
    expect(result.fileCount).toBe(12);
    expect(result.hasAtomicRef).toBe(false);
    expect(result.reason).toContain('12 files');
  });

  // TC-2: PASS — 12 files, atomic ref present
  it('PASS: 12 files with atomic ref US-T9.2', () => {
    const result = checkCommit(files(12), 'feat(x): foo (US-T9.2, M9)');
    expect(result.status).toBe('PASS');
    expect(result.fileCount).toBe(12);
    expect(result.hasAtomicRef).toBe(true);
  });

  // TC-3: WARN — 8 files, no ref (mega-risk but < 10)
  it('WARN: 8 files, no ref — large commit risk', () => {
    const result = checkCommit(files(8), 'fix bug');
    expect(result.status).toBe('WARN');
    expect(result.fileCount).toBe(8);
    expect(result.reason).toContain('8 files');
  });

  // TC-4: PASS — 3 files, small commit
  it('PASS: 3 files — small atomic commit', () => {
    const result = checkCommit(files(3), 'fix typo');
    expect(result.status).toBe('PASS');
    expect(result.fileCount).toBe(3);
  });

  // TC-5: PASS — 50 files, BREAKING bypass
  it('PASS: 50 files, BREAKING bypass', () => {
    const result = checkCommit(files(50), 'BREAKING: new architecture');
    expect(result.status).toBe('PASS');
    expect(result.bypassReason).toBe('BREAKING/INITIAL bypass');
    expect(result.fileCount).toBe(50);
  });

  // TC-6: PASS — 30 files, INITIAL bypass
  it('PASS: 30 files, INITIAL bypass', () => {
    const result = checkCommit(files(30), 'INITIAL: bootstrap v0.1');
    expect(result.status).toBe('PASS');
    expect(result.bypassReason).toBe('BREAKING/INITIAL bypass');
    expect(result.fileCount).toBe(30);
  });

  // R7 M4: tightened T regex — digit-prefixed context must not match
  it('does NOT count "2024-T1" as atomic ref (R7 M4)', () => {
    const r = checkCommit(files(12), 'release: 2024-T1 retrospective');
    expect(r.status).toBe('FAIL');
    expect(r.hasAtomicRef).toBe(false);
  });

  it('still counts standalone T9.6 as atomic ref (regression)', () => {
    const r = checkCommit(files(12), 'feat: T9.6 implementation done');
    expect(r.hasAtomicRef).toBe(true);
  });

  it('still counts "#T1.1" prefix as atomic ref', () => {
    const r = checkCommit(files(12), 'fix: address #T1.1 comments');
    expect(r.hasAtomicRef).toBe(true);
  });
});
