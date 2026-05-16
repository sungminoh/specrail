// US-T5.5 — /specrail approve CLI (M5 wire-up)
// frontmatter status: Draft → Approved write + 검증.
// 검증 chain: schema → INV-2 → state machine transition.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from '../markdown/frontmatter.js';
import { PhaseStatus, assertTransition, checkApprovedAttrsGate } from '../state/machine.js';
import { runHook as runIdHook } from '../hook/id-consistency.js';
import { runHook as runSchemaHook } from '../hook/schema-validate.js';
import { tryEmit } from '../telemetry/client.js';
import { readProjectPluginVersion } from '../config/plugin-version.js';

export interface ApproveResult {
  approved: boolean;
  phaseFile: string;
  approvedAt?: string;
  message: string;
}

export async function approve(projectRoot: string, phaseN: number): Promise<ApproveResult> {
  // 1. Find phase file
  const specDir = join(projectRoot, 'docs', 'spec');
  const prefix = String(phaseN).padStart(2, '0') + '-';
  const files = await readdir(specDir);
  const file = files.find((f) => f.startsWith(prefix) && f.endsWith('.md'));
  if (!file) throw new Error(`Phase ${phaseN} file not found in docs/spec`);
  const path = join(specDir, file);

  // 2. Read + parse current status
  const raw = await readFile(path, 'utf8');
  const { frontmatter } = parseFrontmatter(raw);
  const current = frontmatter.status as PhaseStatus | undefined;

  if (current === PhaseStatus.Approved) {
    return { approved: false, phaseFile: file, message: `Phase ${phaseN} already Approved (idempotent)` };
  }

  // 3. Validate state transition (will throw INV-3 if invalid)
  assertTransition(current ?? PhaseStatus.Empty, PhaseStatus.Approved);

  // 4. Run hooks — both must pass
  const schemaResult = await runSchemaHook(projectRoot);
  if (!schemaResult.ok) {
    throw new Error(`Schema validation FAILED before approve:\n${schemaResult.message}`);
  }
  const idResult = await runIdHook(projectRoot);
  if (!idResult.ok) {
    throw new Error(`INV-2 check FAILED before approve:\n${idResult.message}`);
  }

  // T-CSA.9 wire-up: INV-3 attrs gate. v0.2.0~v0.4.x → WARN (transition
  // allowed, surface message); v0.5.0+ → ERROR (block). Review-required
  // markers always block regardless of version (OQ-CSA-10).
  const pluginVersion = await readProjectPluginVersion(projectRoot);
  const gate = checkApprovedAttrsGate(raw, pluginVersion);
  if (gate.level === 'error') {
    throw new Error(`INV-3 attrs gate FAILED before approve:\n${gate.message}\n${gate.missing.map((f) => `  - ${f.kind} @line ${f.line}: ${f.message}`).join('\n')}`);
  }
  if (gate.level === 'warn') {
    console.warn(`⚠ ${gate.message}`);
    for (const f of gate.missing.slice(0, 5)) {
      console.warn(`  - ${f.kind} @line ${f.line}: ${f.message}`);
    }
    if (gate.missing.length > 5) console.warn(`  ... ${gate.missing.length - 5} more`);
  }

  // 5. Write status: Approved + approvedAt
  const approvedAt = new Date().toISOString();
  const updated = updateFrontmatter(raw, { status: PhaseStatus.Approved, approvedAt });
  await writeFile(path, updated);

  // 6. Emit PhaseApproved telemetry (architect M11 P1 wire-up close).
  // Fire-and-forget: never blocks approval. No-op if env vars unset or consent !== OptedIn.
  await tryEmit(projectRoot, { eventType: 'PhaseApproved', phaseId: phaseN });

  return {
    approved: true,
    phaseFile: file,
    approvedAt,
    message: `Phase ${phaseN} (${file}) approved at ${approvedAt}`,
  };
}

function updateFrontmatter(raw: string, updates: Record<string, string>): string {
  // Simple YAML frontmatter update: assumes `---\n...\n---` block at top
  const match = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!match) {
    throw new Error('No YAML frontmatter found to update');
  }
  let body = match[2];
  for (const [key, value] of Object.entries(updates)) {
    const lineRe = new RegExp(`^${key}\\s*:.*$`, 'm');
    if (lineRe.test(body)) {
      body = body.replace(lineRe, `${key}: ${value}`);
    } else {
      // R7 M1: trim trailing newlines/CRs before append, exactly 1 separator (L-R8-1 CRLF)
      body = body.replace(/[\r\n]+$/, '') + '\n' + key + ': ' + value;
    }
  }
  return match[1] + body + match[3] + raw.slice(match[0].length);
}
