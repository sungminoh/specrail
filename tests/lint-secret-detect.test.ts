import { describe, it, expect } from 'vitest';
import { detectSecrets, type SecretMatch } from '../src/lint/secret-detect.js';

describe('T3.10 Secret detection (RISK-5, OQ-9-1)', () => {
  // TC-1: OpenAI API key pattern
  it('detects OpenAI API key (sk- + 48 chars)', () => {
    const m = detectSecrets('OPENAI_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcd');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].pattern).toBe('openai-key');
    expect(m[0].trigger).toContain('sk-');
  });

  // TC-2: AWS access key pattern
  it('detects AWS access key (AKIA + 16 chars)', () => {
    const m = detectSecrets('aws_key=AKIA1234567890ABCDEF');
    expect(m.length).toBeGreaterThan(0);
    expect(m.some((x: SecretMatch) => x.pattern === 'aws-access-key')).toBe(true);
  });

  // TC-3: GitHub Personal Access Token
  it('detects GitHub PAT (ghp_ + 36 chars)', () => {
    const token = 'ghp_' + 'a'.repeat(36);
    const m = detectSecrets(`token=${token}`);
    expect(m.length).toBeGreaterThan(0);
    expect(m.some((x: SecretMatch) => x.pattern === 'github-pat')).toBe(true);
  });

  // TC-4: Generic high-entropy hex string (64+ chars) — use assignment context, not hash context
  it('detects high-entropy hex string as maybe-secret', () => {
    const hex64 = 'a'.repeat(32) + 'b'.repeat(32); // 64-char hex
    const m = detectSecrets(`SECRET=${hex64}`);
    expect(m.length).toBeGreaterThan(0);
    expect(m.some((x: SecretMatch) => x.pattern === 'high-entropy')).toBe(true);
  });

  // TC-5: False positive avoidance — spec ID patterns (R1, F1.2, ADR-7)
  it('does not trigger on spec ID patterns (R1, F1.2, ADR-7, RISK-5, OQ-9-1)', () => {
    const m = detectSecrets('참조: R1, F1.2, ADR-7, RISK-5, OQ-9-1, NFR-SEC-7, TC-15');
    expect(m).toHaveLength(0);
  });

  // TC-6: False positive avoidance — regex in code fence is ignored
  it('does not trigger on secret-like regex inside code fence', () => {
    const text = [
      'Example:',
      '```',
      'const re = /sk-\\w+/;',
      'const re2 = /AKIA[A-Z0-9]{16}/;',
      '```',
    ].join('\n');
    const m = detectSecrets(text);
    expect(m).toHaveLength(0);
  });

  // TC-7: Default mode → severity 'warn' (no block); opt-in mode → severity 'block'
  it('returns warn severity in default mode', () => {
    const m = detectSecrets('OPENAI_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcd');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].severity).toBe('warn');
  });

  it('returns block severity in opt-in mode', () => {
    const m = detectSecrets('OPENAI_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcd', {
      mode: 'opt-in',
    });
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].severity).toBe('block');
  });

  // TC-8: suggestion is always present
  it('provides suggestion for each match', () => {
    const m = detectSecrets('OPENAI_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcd');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].suggestion).toBeTruthy();
    expect(m[0].suggestion.length).toBeGreaterThan(0);
  });

  // TC-9: GitHub token variants (gho_, ghu_, ghs_, ghr_)
  it('detects GitHub token variants (gho_, ghu_, ghs_, ghr_)', () => {
    for (const prefix of ['gho_', 'ghu_', 'ghs_', 'ghr_']) {
      const token = prefix + 'z'.repeat(36);
      const m = detectSecrets(`GH_TOKEN=${token}`);
      expect(m.some((x: SecretMatch) => x.pattern === 'github-pat')).toBe(true);
    }
  });

  // TC-10: Slack token
  it('detects Slack token (xoxb-)', () => {
    const m = detectSecrets('SLACK_TOKEN=xoxb-1234567890-abcdefghijklmnop');
    expect(m.some((x: SecretMatch) => x.pattern === 'slack-token')).toBe(true);
  });

  // TC-11: Empty string returns nothing
  it('returns empty array for empty string', () => {
    const m = detectSecrets('');
    expect(m).toHaveLength(0);
  });

  // TC-12: Multiple secrets in one text — all detected
  it('detects multiple secrets in one text', () => {
    const text =
      'OPENAI_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcd ' +
      'AWS_KEY=AKIA1234567890ABCDEF';
    const m = detectSecrets(text);
    const patterns = m.map((x: SecretMatch) => x.pattern);
    expect(patterns).toContain('openai-key');
    expect(patterns).toContain('aws-access-key');
  });

  // TC-13: SHA-256 commit reference — no false positive (R3 M-Round3-9)
  it('does NOT flag SHA-256 commit reference (R3 M-Round3-9)', () => {
    const text = 'parent commit: ' + 'a'.repeat(64);
    const findings = detectSecrets(text);
    const matches = findings.filter((f: SecretMatch) => f.pattern === 'high-entropy');
    expect(matches).toHaveLength(0);
  });

  // TC-14: SHA context variants — sha:, hash:, digest=
  it('does NOT flag hash: / sha: / digest= context (R3 M-Round3-9)', () => {
    const hex64 = 'b'.repeat(64);
    for (const prefix of ['sha256: ', 'hash: ', 'digest=', 'fingerprint: ', 'ref: ', 'cid: ']) {
      const text = prefix + hex64;
      const findings = detectSecrets(text);
      const matches = findings.filter((f: SecretMatch) => f.pattern === 'high-entropy');
      expect(matches, `should not flag "${prefix}..." as secret`).toHaveLength(0);
    }
  });

  // TC-15: bare 64-hex assignment IS still flagged (regression check, R3 M-Round3-9)
  it('still flags bare 64-hex assignment as secret (regression check R3 M-Round3-9)', () => {
    const text = 'API_KEY=' + 'a'.repeat(64);
    const findings = detectSecrets(text);
    const matches = findings.filter((f: SecretMatch) => f.pattern === 'high-entropy');
    expect(matches.length).toBeGreaterThan(0);
  });
});
