// Anti-Sycophancy lint (architect M9 condition C3 — known limitation).
//
// EVIDENCE_RE is a SIMPLE keyword-proximity check: keyword + (test|tests|
// measurement|passed|verified|evidence|PASS) within ±3 lines = hasEvidence:true.
//
// This does NOT distinguish real evidence from claimed evidence.
// False-negative example:
//   "ship-ready (we ran the tests but they all failed — ignoring for now)"
//   → hasEvidence: true (because 'tests' appears nearby) — INCORRECT pass.
//
// Use STRONG_EVIDENCE_RE for structured/measured claims (--strict mode).
// Use lint as guardrail, not proof. Quality of evidence requires human review.

import { readFile, readdir } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

export interface SycophancyViolation {
  filePath: string;
  line: number;
  keyword: string;
  context: string;
  hasEvidence: boolean;
  hasStrongEvidence: boolean;
}

const KEYWORDS = [
  'ship-ready',
  'release-ready',
  'production-ready',
  '실증됨',
  '완료',
  '100%',
  '97%+',
  'perfect',
  'flawless',
  'enterprise-grade',
];

const EVIDENCE_RE = /\b(test|tests|measurement|passed|verified|evidence|PASS)\b/i;
// ↑ simple keyword proximity; subject to false-negatives — see module docstring.

// Strong evidence: structured/measured claims — number + verb, test file ref, coverage, benchmark.
const STRONG_EVIDENCE_RE = /(\d+\s*(?:tests?|specs?)\s*(?:PASS|passed|passing)|verified by\s+\S|tests\/\S+\.test\.[tj]sx?|coverage\s*[≥>=]\s*\d|measured|benchmark)/i;

function buildKeywordRegex(): RegExp {
  const escaped = KEYWORDS.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  return new RegExp(escaped.join('|'), 'gi');
}

const KEYWORD_RE = buildKeywordRegex();

function isInCodeFence(lines: string[], lineIdx: number): boolean {
  let fenceCount = 0;
  for (let i = 0; i < lineIdx; i++) {
    if (/^```/.test(lines[i].trimStart())) {
      fenceCount++;
    }
  }
  return fenceCount % 2 === 1;
}

/**
 * Replace <!--…--> spans with equal-length spaces (preserving newlines)
 * so that line/column offsets remain valid after stripping.
 * Keywords AFTER a same-line closing '-->' are still detected (H2 fix).
 */
function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, (match) =>
    match.replace(/[^\n]/g, ' '),
  );
}

function extractContext(lines: string[], lineIdx: number): string {
  const start = Math.max(0, lineIdx - 2);
  const end = Math.min(lines.length - 1, lineIdx + 2);
  return lines.slice(start, end + 1).join('\n');
}

function evidenceFlags(
  lines: string[],
  lineIdx: number,
): { hasEvidence: boolean; hasStrongEvidence: boolean } {
  const start = Math.max(0, lineIdx - 3);
  const end = Math.min(lines.length - 1, lineIdx + 3);
  const window = lines.slice(start, end + 1).join('\n');
  return {
    hasEvidence: EVIDENCE_RE.test(window),
    hasStrongEvidence: STRONG_EVIDENCE_RE.test(window),
  };
}

function scanText(text: string, filePath: string): SycophancyViolation[] {
  // H2 fix: strip HTML comments before scanning — replaces <!--…--> with
  // equal-length spaces so line/column offsets remain valid. Keywords that
  // appear AFTER a same-line closing '-->' are still detected.
  const stripped = stripHtmlComments(text);
  const lines = stripped.split('\n');
  const originalLines = text.split('\n');
  const violations: SycophancyViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (isInCodeFence(originalLines, i)) continue;

    const re = new RegExp(KEYWORD_RE.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(lines[i])) !== null) {
      const keyword = m[0].toLowerCase();
      const context = extractContext(originalLines, i);
      const { hasEvidence, hasStrongEvidence } = evidenceFlags(originalLines, i);
      violations.push({
        filePath,
        line: i + 1,
        keyword,
        context,
        hasEvidence,
        hasStrongEvidence,
      });
    }
  }

  return violations;
}

export async function scanFile(filePath: string): Promise<SycophancyViolation[]> {
  const text = await readFile(filePath, 'utf-8');
  return scanText(text, filePath);
}

async function collectFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const nested = await collectFiles(fullPath);
      results.push(...nested);
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      const isReadme = /^README/i.test(entry.name) && ext === '.md';
      const isInDocs = fullPath.split(sep).includes('docs');
      if (ext === '.md' && (isReadme || isInDocs)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

export async function scanProject(rootDir: string): Promise<SycophancyViolation[]> {
  const files = await collectFiles(resolve(rootDir));
  const allViolations: SycophancyViolation[] = [];

  for (const file of files) {
    const violations = await scanFile(file);
    allViolations.push(...violations);
  }

  return allViolations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const strict = process.argv.includes('--strict');
  const root = process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) ?? '.';
  scanProject(root).then((violations) => {
    const filter = strict
      ? (v: SycophancyViolation) => !v.hasStrongEvidence
      : (v: SycophancyViolation) => !v.hasEvidence;
    const bare = violations.filter(filter);
    const modeLabel = strict ? 'strong evidence' : 'evidence';
    if (bare.length === 0) {
      console.log(`Anti-Sycophancy lint clean (${violations.length} keywords with ${modeLabel})`);
      process.exit(0);
    }
    for (const v of bare) {
      console.error(`${v.filePath}:${v.line} — '${v.keyword}' without ${modeLabel}`);
    }
    console.error(`${bare.length} bare sycophancy violations`);
    process.exit(1);
  });
}
