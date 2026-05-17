import { PatchEnvelopeSchema, type PatchEnvelope } from './schema.js';

const FENCE_RE = /```(?:json)?\s*\n([\s\S]*?)```/g;

export interface ParsedPatchResult {
  envelopes: PatchEnvelope[];
  errors: string[];
}

/**
 * Extract patch envelopes from a free-text AI response.
 * Looks at the last ```json code block(s). Tolerant of multiple blocks.
 */
export function extractPatches(text: string): ParsedPatchResult {
  const envelopes: PatchEnvelope[] = [];
  const errors: string[] = [];
  const candidates: string[] = [];

  for (const m of text.matchAll(FENCE_RE)) {
    if (typeof m[1] === 'string') candidates.push(m[1]);
  }

  if (candidates.length === 0) {
    errors.push('no fenced code block found');
    return { envelopes, errors };
  }

  // Try each candidate; only accept those that match PatchEnvelopeSchema.
  for (const c of candidates) {
    let raw: unknown;
    try {
      raw = JSON.parse(c);
    } catch (e) {
      // ignore non-JSON code blocks (markdown, yaml, etc.)
      continue;
    }
    const r = PatchEnvelopeSchema.safeParse(raw);
    if (r.success) {
      envelopes.push(r.data);
    } else {
      errors.push(`patch JSON failed validation: ${r.error.issues.map((i) => i.message).join('; ')}`);
    }
  }

  if (envelopes.length === 0 && errors.length === 0) {
    errors.push('found code blocks but none were valid JSON patch envelopes');
  }

  return { envelopes, errors };
}
