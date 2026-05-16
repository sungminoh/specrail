// T-CSA.8 — attrs-completeness + attrs-placement + review-required lint
// Per docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md T-CSA.8
// Linked AC: AC-R-CSA-1 (state gate), AC-R-CSA-3 (placement), AC-R-CSA-5
// (review marker always ERROR), AC-R-CSA-6 (version-gated severity).

import { parseAttrsBlocks } from '../markdown/attrs.js';
import { classifyEntityKind } from '../schema/validator.js';

export type LintLevel = 'warn' | 'error';

export type AttrsLintKind =
  | 'attrs-completeness'
  | 'attrs-placement'
  | 'review-required';

export interface AttrsLintFinding {
  readonly kind: AttrsLintKind;
  readonly level: LintLevel;
  readonly line: number;
  readonly entityId?: string;
  readonly message: string;
}

export interface AttrsLintResult {
  readonly findings: AttrsLintFinding[];
}

export interface AttrsLintOptions {
  /** Plugin version (semver). Drives severity gating per OQ-CSA-3. */
  readonly pluginVersion: string;
  /** Override source file path for error messages. */
  readonly file?: string;
}

const REVIEW_MARKER_RE = /<!--\s*specrail:attrs-review-required\s+reason="([^"]+)"\s*-->/g;
const HEADING_RE = /^(#{1,6})\s+([A-Z][A-Za-z0-9.\-_]+)/;

function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10));
  const pb = b.split('.').map((x) => parseInt(x, 10));
  for (let i = 0; i < 3; i++) {
    const ai = pa[i] ?? 0;
    const bi = pb[i] ?? 0;
    if (ai !== bi) return ai < bi ? -1 : 1;
  }
  return 0;
}

function severityForVersion(version: string): LintLevel {
  return semverCompare(version, '0.5.0') >= 0 ? 'error' : 'warn';
}

const REQUIRED_FIELDS_BY_KIND: Record<string, readonly string[]> = {
  R: ['status', 'importance', 'owner'],
  F: ['status', 'parent-r'],
  S: ['status', 'parent-f'],
  ENT: ['status', 'aggregate-root'],
  INV: ['status', 'applies-to'],
  NFR: ['status', 'target', 'unit', 'measure-method'],
  ARCH: ['status', 'c4-level'],
  EXT: ['status', 'protocol', 'failure-mode'],
  OPS: ['status', 'env'],
  ADR: ['status', 'decision', 'consequences'],
  RISK: ['severity', 'probability', 'mitigation'],
  TC: ['status', 'level', 'linked-ac'],
  EDGE: ['status', 'linked-ac'],
  OQ: ['decider', 'due', 'blocking'],
  PERSONA: ['alias', 'role', 'primary-pain'],
  SCEN: ['name', 'personas', 'triggers'],
  JNY: ['scenario', 'step-order', 'surface'],
  ZN: ['page', 'purpose', 'visible-to-state'],
  KPI: ['target', 'unit', 'measure-when'],
  'P-CC': ['surface', 'trigger'],
  T: ['milestone', 'status', 'red-test', 'commit-msg-stub'],
};

export function lintAttrs(raw: string, options: AttrsLintOptions): AttrsLintResult {
  const findings: AttrsLintFinding[] = [];
  const lines = raw.split('\n');

  // Rule 3: review-required markers (always ERROR).
  let m: RegExpExecArray | null;
  const reviewRe = new RegExp(REVIEW_MARKER_RE.source, 'g');
  while ((m = reviewRe.exec(raw)) !== null) {
    const lineNum = raw.slice(0, m.index).split('\n').length;
    findings.push({
      kind: 'review-required',
      level: 'error',
      line: lineNum,
      message: `unresolved migrate review-required marker (reason="${m[1]}") - resolve attrs payload and remove the marker, or run "specrail audit --accept-codemod-conflict"`,
    });
  }

  const { blocks } = parseAttrsBlocks(raw, options.file);

  // Rule 2: heading-immediate placement.
  const headingLineByEntityId = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(HEADING_RE);
    if (!h) continue;
    headingLineByEntityId.set(h[2], i + 1);
  }

  for (const b of blocks) {
    const headingLine = headingLineByEntityId.get(b.entityId);
    if (headingLine === undefined) continue;
    const openLine = b.lineRange.start;
    for (let li = headingLine; li < openLine - 1; li++) {
      if (lines[li].trim() !== '') {
        findings.push({
          kind: 'attrs-placement',
          level: 'error',
          line: openLine,
          entityId: b.entityId,
          message: `attrs block for ${b.entityId} is not heading-immediate; line ${headingLine} (heading) -> line ${openLine} (attrs marker) has prose between. Move attrs immediately after heading.`,
        });
        break;
      }
    }
  }

  // Rule 1: attrs-completeness via required-field check per kind.
  for (const b of blocks) {
    const kind = classifyEntityKind(b.entityId);
    if (kind === null) {
      findings.push({
        kind: 'attrs-completeness',
        level: severityForVersion(options.pluginVersion),
        line: b.lineRange.start,
        entityId: b.entityId,
        message: `unknown entity kind for id="${b.entityId}" - not classifiable. Run "specrail migrate --fix" or update src/spec/patterns.ts ID_PATTERN_SOURCE.`,
      });
      continue;
    }
    const required = REQUIRED_FIELDS_BY_KIND[kind] ?? [];
    for (const f of required) {
      if (!(f in b.payload)) {
        findings.push({
          kind: 'attrs-completeness',
          level: severityForVersion(options.pluginVersion),
          line: b.lineRange.start,
          entityId: b.entityId,
          message: `${b.entityId} (kind=${kind}) missing required attrs field "${f}". Run "specrail migrate --fix" to scaffold.`,
        });
      }
    }
  }

  return { findings };
}
