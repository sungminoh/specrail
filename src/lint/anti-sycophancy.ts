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
const STRONG_EVIDENCE_RE = /(\d+\s*(?:tests?|specs?)\s*(?:PASS|passed|passing)|verified by\s+\S{2,}|tests\/\S+\.test\.[tj]sx?|coverage\s*[≥>=]\s*\d|measured|benchmark)/i;

/**
 * Returns true when the matched keyword is in a benign noun-form context
 * where it is not a self-praise claim (e.g. table cell, mermaid edge label,
 * quoted status label). Currently only applied to '완료'.
 */
function isWordInBenignContext(line: string, matchIndex: number, keyword: string): boolean {
  if (keyword !== '완료') return false;

  // Table row: pipe character anywhere on the line → noun cell, not claim
  if (line.includes('|')) return true;

  // Mermaid edge arrows: -->, <--, <-->, -.->, etc.
  if (/--+>|<--+|<--+>|-\.->/i.test(line)) return true;

  // Markdown horizontal rule: line consists ONLY of dashes (with optional whitespace)
  if (/^\s*-{3,}\s*$/.test(line)) return true;

  // Quoted/backtick-enclosed label: keyword is inside quotes or backticks
  const before = line.slice(0, matchIndex);
  const after = line.slice(matchIndex + keyword.length);
  const hasOpenQuote = /[`"']\s*\S*$/.test(before);
  const hasCloseQuote = /^\S*\s*[`"']/.test(after);
  if (hasOpenQuote && hasCloseQuote) return true;

  return false;
}

/**
 * Returns the evidence window radius (lines before/after) for a given keyword.
 * Percentage keywords need a wider window to capture nearby matrix/metric lines.
 */
function getEvidenceWindowSize(keyword: string): number {
  if (/%$/.test(keyword)) return 5;
  return 3;
}

function buildKeywordRegex(): RegExp {
  const escaped = KEYWORDS.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  return new RegExp(escaped.join('|'), 'gi');
}

const KEYWORD_RE = buildKeywordRegex();

function buildFenceMask(lines: string[]): boolean[] {
  const mask = new Array<boolean>(lines.length).fill(false);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trimStart())) {
      inFence = !inFence;
      mask[i] = true; // fence delimiter line itself is "in fence"
    } else {
      mask[i] = inFence;
    }
  }
  return mask;
}

/**
 * Replace <!--…--> spans with equal-length spaces (preserving newlines)
 * so that line/column offsets remain valid after stripping.
 * Keywords AFTER a same-line closing '-->' are still detected (H2 fix).
 */
function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, (match) =>
    match.replace(/[^\r\n]/g, ' '),
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
  keyword: string,
): { hasEvidence: boolean; hasStrongEvidence: boolean } {
  const radius = getEvidenceWindowSize(keyword);
  const start = Math.max(0, lineIdx - radius);
  const end = Math.min(lines.length - 1, lineIdx + radius);
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
  const fenceMask = buildFenceMask(originalLines);
  const violations: SycophancyViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (fenceMask[i]) continue;

    const re = new RegExp(KEYWORD_RE.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(lines[i])) !== null) {
      const keyword = m[0].toLowerCase();
      if (isWordInBenignContext(lines[i], m.index, keyword)) continue;
      const context = extractContext(originalLines, i);
      const { hasEvidence, hasStrongEvidence } = evidenceFlags(originalLines, i, keyword);
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
