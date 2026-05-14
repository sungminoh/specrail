// Config loader tests — language-agnostic harness config.
// Covers: presets (typescript/python/go/rust/none), file load, merge, validation.
import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadConfig,
  getPreset,
  DEFAULT_CONFIG,
  type PlanPipelineConfig,
} from '../src/config/index.js';

async function setup(configJson: string | null): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'pp-config-'));
  if (configJson !== null) {
    await writeFile(join(root, '.specrail.config.json'), configJson, 'utf8');
  }
  return root;
}

describe('config loader', () => {
  it('returns DEFAULT_CONFIG (typescript preset) when no config file exists', async () => {
    const root = await setup(null);
    try {
      const cfg = await loadConfig(root);
      expect(cfg.testFilePattern).toBe('.test.ts');
      expect(cfg.qualityChecklist.length).toBeGreaterThan(0);
      expect(cfg.qualityChecklist.some((l) => /typecheck/i.test(l))).toBe(true);
      expect(cfg).toEqual(DEFAULT_CONFIG);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('loads python preset when extends="python"', async () => {
    const root = await setup(JSON.stringify({ extends: 'python' }));
    try {
      const cfg = await loadConfig(root);
      expect(cfg.testFilePattern).toBe('_test.py');
      expect(cfg.qualityChecklist.some((l) => /mypy/i.test(l))).toBe(true);
      expect(cfg.qualityChecklist.some((l) => /pytest/i.test(l))).toBe(true);
      // No TS-specific ESM line
      expect(cfg.qualityChecklist.some((l) => /\.js suffix/i.test(l))).toBe(false);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('loads go preset when extends="go"', async () => {
    const root = await setup(JSON.stringify({ extends: 'go' }));
    try {
      const cfg = await loadConfig(root);
      expect(cfg.testFilePattern).toBe('_test.go');
      expect(cfg.qualityChecklist.some((l) => /go vet/i.test(l))).toBe(true);
      expect(cfg.qualityChecklist.some((l) => /go test/i.test(l))).toBe(true);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('loads rust preset when extends="rust"', async () => {
    const root = await setup(JSON.stringify({ extends: 'rust' }));
    try {
      const cfg = await loadConfig(root);
      expect(cfg.testFilePattern).toBe('.rs');
      expect(cfg.qualityChecklist.some((l) => /cargo check/i.test(l))).toBe(true);
      expect(cfg.qualityChecklist.some((l) => /cargo test/i.test(l))).toBe(true);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('merges user overrides on top of preset', async () => {
    const userCfg = {
      extends: 'typescript',
      testFilePattern: '.spec.ts',
      qualityChecklist: ['custom rule 1', 'custom rule 2'],
    };
    const root = await setup(JSON.stringify(userCfg));
    try {
      const cfg = await loadConfig(root);
      expect(cfg.testFilePattern).toBe('.spec.ts');
      expect(cfg.qualityChecklist).toEqual(['custom rule 1', 'custom rule 2']);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('extends="none" yields empty checklist (full opt-out)', async () => {
    const root = await setup(JSON.stringify({ extends: 'none' }));
    try {
      const cfg = await loadConfig(root);
      expect(cfg.qualityChecklist).toEqual([]);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('throws clear error on malformed JSON', async () => {
    const root = await setup('{ not json');
    try {
      await expect(loadConfig(root)).rejects.toThrow(/\.specrail\.config\.json/);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('throws on unknown extends value', async () => {
    const root = await setup(JSON.stringify({ extends: 'cobol' }));
    try {
      await expect(loadConfig(root)).rejects.toThrow(/unknown preset/i);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('rejects non-array qualityChecklist', async () => {
    const root = await setup(JSON.stringify({ qualityChecklist: 'oops' }));
    try {
      await expect(loadConfig(root)).rejects.toThrow(/qualityChecklist/);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('rejects non-string testFilePattern', async () => {
    const root = await setup(JSON.stringify({ testFilePattern: 42 }));
    try {
      await expect(loadConfig(root)).rejects.toThrow(/testFilePattern/);
    } finally {
      await rm(root, { recursive: true });
    }
  });

  it('returned config is frozen (immutable)', async () => {
    const root = await setup(null);
    try {
      const cfg = await loadConfig(root);
      expect(Object.isFrozen(cfg)).toBe(true);
      expect(Object.isFrozen(cfg.qualityChecklist)).toBe(true);
    } finally {
      await rm(root, { recursive: true });
    }
  });
});

describe('getPreset', () => {
  it('returns typescript preset by default identifier', () => {
    const p = getPreset('typescript');
    expect(p.testFilePattern).toBe('.test.ts');
  });

  it('all presets define testFilePattern', () => {
    for (const name of ['typescript', 'python', 'go', 'rust', 'none'] as const) {
      const p = getPreset(name);
      expect(typeof p.testFilePattern).toBe('string');
      expect(p.testFilePattern.length).toBeGreaterThan(0);
    }
  });

  it('throws on unknown preset name', () => {
    expect(() => getPreset('cobol' as never)).toThrow(/unknown preset/i);
  });
});

describe('PlanPipelineConfig type contract', () => {
  it('DEFAULT_CONFIG conforms to interface', () => {
    const cfg: PlanPipelineConfig = DEFAULT_CONFIG;
    expect(cfg.testFilePattern).toBeDefined();
    expect(Array.isArray(cfg.qualityChecklist)).toBe(true);
  });
});
