#!/usr/bin/env node
// 0.2.1 codemod: extract AC<->TC mapping + EDGE<->AC mapping from Phase 10 tables.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'docs/spec/10-test-strategy.md';
const text = readFileSync(FILE, 'utf8');

const tcToAc = new Map();
const acTcRe = /^\|\s*((?:AC-R\d+-\d+|INV-\d+))\s*\|\s*(TC-\d+)\s*\|/gm;
let m;
while ((m = acTcRe.exec(text)) !== null) {
  const acOrInv = m[1];
  const tc = m[2];
  if (!tcToAc.has(tc)) tcToAc.set(tc, new Set());
  tcToAc.get(tc).add(acOrInv);
}

// EDGE catalog table: | EDGE-N | name | TC-M | (3-col)
// Build EDGE → TC, then chain TC → AC via tcToAc.
const edgeToAc = new Map();
const edgeRe = /^\|\s*(EDGE-\d+)\s*\|[^|]*\|\s*([^|]+?)\s*\|/gm;
while ((m = edgeRe.exec(text)) !== null) {
  const edge = m[1];
  const cellRefs = [...m[2].matchAll(/(?:AC-R\d+-\d+|INV-\d+|TC-\d+)/g)].map((mm) => mm[0]);
  const acRefs = new Set();
  for (const r of cellRefs) {
    if (r.startsWith('AC-') || r.startsWith('INV-')) acRefs.add(r);
    else if (r.startsWith('TC-') && tcToAc.has(r)) {
      for (const ac of tcToAc.get(r)) acRefs.add(ac);
    }
  }
  // If no chained AC found but TC ref exists, fall back to including TC itself
  if (acRefs.size === 0 && cellRefs.length > 0) {
    for (const r of cellRefs) acRefs.add(r);
  }
  if (acRefs.size > 0) edgeToAc.set(edge, acRefs);
}
console.error(`parsed: ${tcToAc.size} TC mappings, ${edgeToAc.size} EDGE mappings`);

let updated = text;
let tcReplaced = 0, edgeReplaced = 0;

const blockRe = /(<!--\s*specrail:attrs\s+id=((?:TC|EDGE)-\d+)\s*-->\s*\n```yaml\n)([\s\S]*?)(\n```\s*\n<!--\s*\/specrail:attrs\s*-->)/g;
updated = updated.replace(blockRe, (full, prefix, id, body, suffix) => {
  const map = id.startsWith('TC-') ? tcToAc : edgeToAc;
  const refs = map.get(id);
  if (!refs || refs.size === 0) return full;
  const list = [...refs].sort().map((r) => `"${r}"`).join(', ');
  const newBody = body.replace(/^linked-ac:\s*\[\]$/m, `linked-ac: [${list}]`);
  if (newBody !== body) {
    if (id.startsWith('TC-')) tcReplaced++; else edgeReplaced++;
  }
  return prefix + newBody + suffix;
});

writeFileSync(FILE, updated);
console.error(`replaced TC: ${tcReplaced}, EDGE: ${edgeReplaced}`);
