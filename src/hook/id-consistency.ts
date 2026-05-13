// F2.3 ID consistency hook (INV-2 환각 ID 차단)
// Reviewer C6 — 2-pass: M1 file-scan stub, M2 T2.1b graph 기반 교체

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const HEADING_DEF = /^#+\s+([A-Z][A-Za-z0-9.\-_]+):/;

const CITATION_RE =
  /\b([RFS]\d+(?:\.\d+){0,2}|ENT-[A-Za-z0-9_]+|INV-\d+|NFR-[A-Z]+-\d+|ARCH-\d+|EXT-\d+|OPS-\d+|ADR-\d+|RISK-\d+|TC-\d+|EDGE-\d+|AC-R\d+-\d+|T\d+\.\d+)\b/g;

export interface ConsistencyResult {
  defined: Set<string>;
  cited: Set<string>;
  dangling: string[];
}

export async function checkIdConsistency(projectRoot: string): Promise<ConsistencyResult> {
  const specDir = join(projectRoot, 'docs', 'spec');
  let files: string[];
  try {
    files = (await readdir(specDir)).filter((f) => f.endsWith('.md')).sort();
  } catch {
    return { defined: new Set(), cited: new Set(), dangling: [] };
  }

  const defined = new Set<string>();
  const cited = new Set<string>();

  for (const file of files) {
    const raw = await readFile(join(specDir, file), 'utf8');
    for (const line of raw.split('\n')) {
      const def = line.match(HEADING_DEF);
      if (def) defined.add(def[1]);

      const re = new RegExp(CITATION_RE);
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        cited.add(m[1]);
      }
    }
  }

  const dangling = [...cited].filter((id) => !defined.has(id)).sort();
  return { defined, cited, dangling };
}

export async function runHook(projectRoot: string): Promise<{ ok: boolean; message: string }> {
  const r = await checkIdConsistency(projectRoot);
  if (r.dangling.length === 0) {
    return { ok: true, message: 'INV-2 OK: ' + r.defined.size + ' defined, ' + r.cited.size + ' cited, 0 dangling' };
  }
  const lines = [
    'INV-2 violation: ' + r.dangling.length + ' cited IDs not defined:',
    ...r.dangling.slice(0, 20).map((id) => '  - ' + id),
  ];
  if (r.dangling.length > 20) lines.push('  ... and ' + (r.dangling.length - 20) + ' more');
  lines.push('', 'Valid defined IDs (first 20):');
  for (const id of [...r.defined].sort().slice(0, 20)) lines.push('  - ' + id);
  return { ok: false, message: lines.join('\n') };
}
