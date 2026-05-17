// Prompt templates per origin. End-of-response patch JSON block required (M6 AC-R4-2).
const PATCH_FORMAT_SUFFIX = `

When proposing edits, end with a single JSON code block:

\`\`\`json
{"patches":[{"phase":N,"hunks":[{"before":"...","after":"...","rationale":"..."}]}]}
\`\`\`

Each "before" must appear exactly once in the phase markdown body. Each "after" replaces it.`;

export function reviewScanPrompt(phaseSummaries: Array<{ number: number; status: string | null; ids: number }>): string {
  return [
    'You are reviewing a specrail spec for quality. Identify any of the following issues:',
    '- Acceptance criteria missing measurable units',
    '- Vague language that lacks specificity',
    '- Cross-references that look broken',
    '- Status mismatches across phases',
    '',
    'Phases:',
    ...phaseSummaries.map((p) => `- Phase ${String(p.number).padStart(2, '0')} status=${p.status ?? '?'} ids=${p.ids}`),
    '',
    'Propose specific edits. Each edit must be a targeted before/after hunk.' + PATCH_FORMAT_SUFFIX,
  ].join('\n');
}

export function chatPrompt(phaseNumber: number, phaseBody: string, userMessage: string): string {
  return [
    `Current context: Phase ${phaseNumber}.`,
    `\`\`\`md\n${truncate(phaseBody, 8000)}\n\`\`\``,
    '',
    `User: ${userMessage}`,
    PATCH_FORMAT_SUFFIX,
  ].join('\n');
}

export function inlinePrompt(phaseNumber: number, selection: string, surrounding: string, instruction: string): string {
  return [
    `Rewrite the SELECTED text below per the user's instruction. Only edit the selection; preserve everything else.`,
    `Phase ${phaseNumber} context (excerpt):`,
    `\`\`\`md\n${truncate(surrounding, 4000)}\n\`\`\``,
    '',
    `SELECTION (to rewrite):`,
    `\`\`\`\n${selection}\n\`\`\``,
    '',
    `Instruction: ${instruction}`,
    PATCH_FORMAT_SUFFIX,
  ].join('\n');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n…[truncated ${s.length - max} chars]`;
}
