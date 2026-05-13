/**
 * Secret pattern detection (T3.10, RISK-5, OQ-9-1 resolved)
 *
 * Detects API keys, tokens, and high-entropy secrets that should not appear
 * in spec text. Default mode emits warnings only (opt-in F off); opt-in mode
 * blocks commits (NFR-SEC-7 보강).
 *
 * False positive mitigations:
 *   1. Strip spec ID tokens (R1, F1.2, ADR-7, RISK-5, …) before matching.
 *   2. Strip content inside code fences (``` … ```) — intentional examples.
 */

export interface SecretMatch {
  /** Pattern identifier (e.g. 'openai-key') */
  pattern: string;
  /** The matched text fragment */
  trigger: string;
  /**
   * warn  = default mode (opt-in F off) — message only, commit passes.
   * block = opt-in mode on            — commit is blocked.
   */
  severity: 'warn' | 'block';
  /** Human-readable remediation hint */
  suggestion: string;
}

export interface DetectOptions {
  /**
   * 'default' (opt-in F off): severity 'warn', commit passes.
   * 'opt-in'               : severity 'block', commit blocked.
   */
  mode?: 'opt-in' | 'default';
}

interface PatternDef {
  id: string;
  regex: RegExp;
  suggestion: string;
}

const SUGGESTION =
  '환경변수·secret manager·credential vault 사용 권장. spec에는 placeholder (예: `OPENAI_KEY=<env>`)를 사용하세요.';

const PATTERNS: PatternDef[] = [
  {
    id: 'openai-key',
    regex: /sk-[A-Za-z0-9]{20,}/g,
    suggestion: SUGGESTION,
  },
  // D4 additions (4차 reviewer security):
  {
    id: 'anthropic-key',
    regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'private-key-block',
    regex: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE\s+KEY-----/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'bearer-token',
    regex: /\bBearer\s+[A-Za-z0-9_\-.]{20,}\b/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'gcp-service-account',
    regex: /"type":\s*"service_account"/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'aws-access-key',
    regex: /\bAKIA[A-Z0-9]{16}\b/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'github-pat',
    regex: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'slack-token',
    regex: /xox[bpoasr]-[A-Za-z0-9-]{10,}/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'generic-jwt',
    regex: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g,
    suggestion: SUGGESTION,
  },
  {
    id: 'high-entropy',
    regex: /\b[A-Fa-f0-9]{64,}\b/g,
    suggestion: SUGGESTION,
  },
];

/**
 * Spec ID pattern — matches tokens like R1, F1.2, ADR-7, RISK-5, OQ-9-1,
 * NFR-SEC-7, TC-15, EDGE-3, etc. These are stripped before secret scanning
 * to prevent false positives.
 */
const ID_PATTERN =
  /\b(?:[A-Z]+-[A-Z]+-\d+(?:\.\d+)*|[A-Z]+-\d+(?:\.\d+)*|[A-Z]+(?:\.\d+)+|[A-Z]+-[A-Za-z]+)\b/g;

/**
 * Strip spec ID tokens from text to avoid false positives.
 * C2 fix (3차 reviewer code-reviewer): length-preserving replacement
 * so that match.index from sanitized string aligns with original text.
 */
function stripIds(text: string): string {
  return text.replace(ID_PATTERN, (match) => ' '.repeat(match.length));
}

/**
 * Strip content inside code fences (``` … ```) — intentional regex examples
 * inside fences must not be reported as secrets.
 */
function stripCodeFences(text: string): string {
  return text.replace(/```[\s\S]*?```/g, (match) => ' '.repeat(match.length));
}

/**
 * Detect secrets in the given text.
 *
 * @param text    - Raw text to analyze (single or multi-line)
 * @param options - Detection options (mode: 'default' | 'opt-in')
 * @returns       Array of SecretMatch for each detected secret
 */
export function detectSecrets(text: string, options?: DetectOptions): SecretMatch[] {
  if (text.length === 0) {
    return [];
  }

  const severity: 'warn' | 'block' = options?.mode === 'opt-in' ? 'block' : 'warn';

  // Apply false-positive mitigations in order
  const sanitized = stripIds(stripCodeFences(text));

  const results: SecretMatch[] = [];

  for (const { id, regex, suggestion } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(sanitized)) !== null) {
      const trigger = text.slice(m.index, m.index + m[0].length);
      results.push({ pattern: id, trigger, severity, suggestion });
    }
  }

  return results;
}
