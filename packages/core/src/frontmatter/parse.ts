import matter from 'gray-matter';
import type { PhaseNumber } from '../spec/types.js';
import { phaseFrontmatterSchema } from './schema.js';

export interface ParsedPhase {
  /** Validated frontmatter (raw object, not narrowed to a single phase schema). */
  frontmatter: Record<string, unknown>;
  /** Markdown body without frontmatter. */
  body: string;
  /** Detected phase number from the `phase` field, if present and 1-13. */
  phaseNumber: PhaseNumber | null;
  /** Validation issues. Empty when frontmatter passed the corresponding phase schema. */
  issues: string[];
}

/** Parse a full phase markdown document (with `---\n...\n---` frontmatter). */
export function parsePhaseMarkdown(raw: string): ParsedPhase {
  const parsed = matter(raw, { engines: undefined });
  const frontmatter = (parsed.data ?? {}) as Record<string, unknown>;
  const body = typeof parsed.content === 'string' ? parsed.content : '';

  let phaseNumber: PhaseNumber | null = null;
  const rawPhase = frontmatter.phase;
  if (typeof rawPhase === 'number' && Number.isInteger(rawPhase) && rawPhase >= 1 && rawPhase <= 13) {
    phaseNumber = rawPhase as PhaseNumber;
  }

  const issues: string[] = [];
  if (phaseNumber !== null) {
    const schema = phaseFrontmatterSchema(phaseNumber);
    const result = schema.safeParse(frontmatter);
    if (!result.success) {
      for (const z of result.error.issues) {
        issues.push(`${z.path.join('.') || '<root>'}: ${z.message}`);
      }
    }
  }

  return { frontmatter, body, phaseNumber, issues };
}
