import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export interface SycophancyViolation {
  filePath: string;
  line: number;
  keyword: string;
  context: string;
  hasEvidence: boolean;
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

function isInHtmlComment(lines: string[], lineIdx: number): boolean {
  // Track comment state up to (but not including) the current line,
  // then check if the current line is fully inside an open comment.
  const before = lines.slice(0, lineIdx).join('\n');
  const opensBefore = (before.match(/<!--/g) ?? []).length;
  const closesBefore = (before.match(/-->/g) ?? []).length;
  const openAtLineStart = opensBefore > closesBefore;

  // If already inside a comment before this line, check if line closes it
  if (openAtLineStart) {
    // line is in a comment unless it closes before the keyword
    return true;
  }

  // Check if the current line opens AND closes on the same line (single-line comment)
  const currentLine = lines[lineIdx];
  const opensOnLine = (currentLine.match(/<!--/g) ?? []).length;
  const closesOnLine = (currentLine.match(/-->/g) ?? []).length;
  // Single-line comment: opens and closes same line — the whole line is a comment
  return opensOnLine > 0 && opensOnLine <= closesOnLine;
}

function extractContext(lines: string[], lineIdx: number): string {
  const start = Math.max(0, lineIdx - 2);
  const end = Math.min(lines.length - 1, lineIdx + 2);
  return lines.slice(start, end + 1).join('\n');
}

function hasEvidenceNearby(lines: string[], lineIdx: number): boolean {
  const start = Math.max(0, lineIdx - 3);
  const end = Math.min(lines.length - 1, lineIdx + 3);
  const window = lines.slice(start, end + 1).join('\n');
  return EVIDENCE_RE.test(window);
}

function scanText(text: string, filePath: string): SycophancyViolation[] {
  const lines = text.split('\n');
  const violations: SycophancyViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (isInCodeFence(lines, i)) continue;
    if (isInHtmlComment(lines, i)) continue;

    const re = new RegExp(KEYWORD_RE.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(lines[i])) !== null) {
      const keyword = m[0].toLowerCase();
      const context = extractContext(lines, i);
      const hasEvidence = hasEvidenceNearby(lines, i);
      violations.push({
        filePath,
        line: i + 1,
        keyword,
        context,
        hasEvidence,
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
      const isInDocs = fullPath.includes('/docs/');
      if (ext === '.md' && (isReadme || isInDocs)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

export async function scanProject(rootDir: string): Promise<SycophancyViolation[]> {
  const files = await collectFiles(rootDir);
  const allViolations: SycophancyViolation[] = [];

  for (const file of files) {
    const violations = await scanFile(file);
    allViolations.push(...violations);
  }

  return allViolations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] ?? '.';
  scanProject(root).then((violations) => {
    const bare = violations.filter((v) => !v.hasEvidence);
    if (bare.length === 0) {
      console.log(`Anti-Sycophancy lint clean (${violations.length} keywords with evidence)`);
      process.exit(0);
    }
    for (const v of bare) {
      console.error(`${v.filePath}:${v.line} — '${v.keyword}' without evidence`);
    }
    console.error(`${bare.length} bare sycophancy violations`);
    process.exit(1);
  });
}
