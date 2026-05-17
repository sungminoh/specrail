// Language-agnostic harness config.
// Loaded from <projectRoot>/.specrail.config.json — optional.
// Default: typescript preset.
//
// Schema:
//   extends?: 'typescript' | 'python' | 'go' | 'rust' | 'none'
//   testFilePattern?: string        // file suffix used to discover tests
//   qualityChecklist?: string[]     // lines injected into QualityReview prompt

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface SpecrailConfig {
  readonly testFilePattern: string;
  readonly qualityChecklist: readonly string[];
}

export type PresetName = 'typescript' | 'python' | 'go' | 'rust' | 'none';

const PRESETS: Record<PresetName, SpecrailConfig> = {
  typescript: Object.freeze({
    testFilePattern: '.test.ts',
    qualityChecklist: Object.freeze([
      'typecheck: npm run typecheck → 0 errors',
      'tests: npx vitest run [new test files] → all green',
      'naming consistency with Phase 4 glossary (enum 값 일치)',
      'no TODO/FIXME/placeholder comments',
      'ESM .js suffix on imports',
    ]),
  }) as SpecrailConfig,

  python: Object.freeze({
    testFilePattern: '_test.py',
    qualityChecklist: Object.freeze([
      'typecheck: mypy src/ → 0 errors',
      'tests: pytest tests/ → all pass',
      'naming consistency with Phase 4 glossary (snake_case 일치)',
      'no TODO/FIXME/placeholder comments',
      'imports sorted (ruff check --select I)',
    ]),
  }) as SpecrailConfig,

  go: Object.freeze({
    testFilePattern: '_test.go',
    qualityChecklist: Object.freeze([
      'vet: go vet ./... → 0 issues',
      'tests: go test ./... → all pass',
      'naming consistency with Phase 4 glossary (CamelCase 일치)',
      'no TODO/FIXME/placeholder comments',
      'gofmt clean (gofmt -l . returns empty)',
    ]),
  }) as SpecrailConfig,

  rust: Object.freeze({
    testFilePattern: '.rs',
    qualityChecklist: Object.freeze([
      'check: cargo check → 0 errors',
      'tests: cargo test → all pass',
      'naming consistency with Phase 4 glossary (snake_case/CamelCase 규약 일치)',
      'no TODO/FIXME/placeholder comments',
      'clippy clean: cargo clippy -- -D warnings',
    ]),
  }) as SpecrailConfig,

  none: Object.freeze({
    testFilePattern: '.test',
    qualityChecklist: Object.freeze([]),
  }) as SpecrailConfig,
};

export const DEFAULT_CONFIG: SpecrailConfig = PRESETS.typescript;

export function getPreset(name: PresetName): SpecrailConfig {
  const p = PRESETS[name];
  if (!p) throw new Error(`unknown preset "${name}"`);
  return p;
}

interface UserConfigFile {
  extends?: unknown;
  testFilePattern?: unknown;
  qualityChecklist?: unknown;
}

function isPresetName(v: unknown): v is PresetName {
  return v === 'typescript' || v === 'python' || v === 'go' || v === 'rust' || v === 'none';
}

function freezeConfig(cfg: SpecrailConfig): SpecrailConfig {
  return Object.freeze({
    testFilePattern: cfg.testFilePattern,
    qualityChecklist: Object.freeze([...cfg.qualityChecklist]),
  });
}

/**
 * Load .specrail.config.json from projectRoot.
 * Returns DEFAULT_CONFIG (typescript preset) when file is missing.
 * Throws Error with clear message on malformed JSON or invalid fields.
 */
export async function loadConfig(projectRoot: string): Promise<SpecrailConfig> {
  const path = join(projectRoot, '.specrail.config.json');

  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    return DEFAULT_CONFIG;
  }

  let parsed: UserConfigFile;
  try {
    parsed = JSON.parse(raw) as UserConfigFile;
  } catch (e) {
    throw new Error(`.specrail.config.json: malformed JSON — ${String(e)}`);
  }

  // Resolve base preset
  let base: SpecrailConfig;
  if (parsed.extends === undefined) {
    base = DEFAULT_CONFIG;
  } else if (isPresetName(parsed.extends)) {
    base = PRESETS[parsed.extends];
  } else {
    throw new Error(
      `.specrail.config.json: unknown preset "${String(parsed.extends)}". ` +
        `Valid: typescript, python, go, rust, none.`,
    );
  }

  // Field validation + merge
  let testFilePattern = base.testFilePattern;
  if (parsed.testFilePattern !== undefined) {
    if (typeof parsed.testFilePattern !== 'string' || parsed.testFilePattern.length === 0) {
      throw new Error(
        `.specrail.config.json: testFilePattern must be a non-empty string.`,
      );
    }
    testFilePattern = parsed.testFilePattern;
  }

  let qualityChecklist = base.qualityChecklist;
  if (parsed.qualityChecklist !== undefined) {
    if (
      !Array.isArray(parsed.qualityChecklist) ||
      !parsed.qualityChecklist.every((l) => typeof l === 'string')
    ) {
      throw new Error(
        `.specrail.config.json: qualityChecklist must be an array of strings.`,
      );
    }
    qualityChecklist = parsed.qualityChecklist;
  }

  return freezeConfig({ testFilePattern, qualityChecklist });
}
