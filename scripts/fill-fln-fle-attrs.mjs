#!/usr/bin/env node
// 0.2.1 codemod: generate FLN + FLE attrs blocks for Phase 5 dogfood spec.
// Parses §2 Node Catalog (FLN ID | Type | name | Spec | SM) and §3 Edge
// Catalog (FLE ID | From | To | condition). Appends a section §11 with
// 1 attrs block per entity.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'docs/spec/05-user-flow.md';
const text = readFileSync(FILE, 'utf8');

// Track which SEC each FLN appears under (running counter via heading)
const lines = text.split('\n');
let currentSec = null;
let stepOrder = 0;
const flnSec = new Map();
const flnStep = new Map();
const flnName = new Map();
const flnFeature = new Map();
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const secMatch = line.match(/^###\s+(SEC-\d+):/);
  if (secMatch) {
    currentSec = secMatch[1];
    stepOrder = 0;
    continue;
  }
  const rowMatch = line.match(/^\|\s*(FLN-\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
  if (rowMatch && currentSec) {
    stepOrder++;
    const id = rowMatch[1];
    flnSec.set(id, currentSec);
    flnStep.set(id, stepOrder);
    flnName.set(id, rowMatch[3].trim());
    const spec = rowMatch[4].trim();
    const featureMatch = spec.match(/F-?R?\d+\.\d+|F\d+\.\d+/);
    if (featureMatch) flnFeature.set(id, featureMatch[0]);
  }
}

// SEC -> SCEN mapping per Phase 2 delta semantics
const secToScen = {
  'SEC-1': 'SCEN-1',
  'SEC-2': 'SCEN-1',
  'SEC-3': 'SCEN-2',
  'SEC-4': 'SCEN-1',
  'SEC-5': 'SCEN-1',
  'SEC-6': 'SCEN-1',
};

// FLE rows: | FLE-N | from | to | condition |
// from/to are usually FLN-N but may be descriptive labels for aggregate edges
// (e.g. "(SEC-4 끝)", "(anytime)"). schema idRef is just a string, accept both.
const fleRows = [];
const fleRe = /^\|\s*(FLE-\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
let m;
while ((m = fleRe.exec(text)) !== null) {
  fleRows.push({ id: m[1], from: m[2].trim(), to: m[3].trim(), trigger: m[4].trim() });
}

console.error(`parsed FLN: ${flnSec.size}, FLE: ${fleRows.length}`);

// Generate attrs appendix
const flnBlocks = [...flnSec.keys()].sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4))).map((id) => {
  const sec = flnSec.get(id);
  const scen = secToScen[sec] || 'SCEN-1';
  const step = flnStep.get(id);
  const feature = flnFeature.get(id);
  const featureLine = feature ? `\nfeature: ${feature}` : '';
  return `<!-- specrail:attrs id=${id} -->
\`\`\`yaml
status: Approved
scenario: ${scen}
step-order: ${step}${featureLine}
surface: cli
last-modified: 2026-05-16
\`\`\`
<!-- /specrail:attrs -->
`;
}).join('\n');

const fleBlocks = fleRows.map((r) => `<!-- specrail:attrs id=${r.id} -->
\`\`\`yaml
status: Approved
from: ${r.from}
to: ${r.to}
trigger: ${JSON.stringify(r.trigger)}
last-modified: 2026-05-16
\`\`\`
<!-- /specrail:attrs -->
`).join('\n');

const appendix = `

---

## 11. Attrs blocks (M-CSA - schema v1.0)

Per skills/_common/principles.md FLN nodes (section 2) and FLE edges (section 3) are table-defined; attrs blocks aggregate here. scenario derived from SEC heading; step-order is per-section running count; feature extracted from Spec column when present.

${flnBlocks}
${fleBlocks}`;

writeFileSync(FILE, text + appendix);
console.error(`appended ${flnSec.size + fleRows.length} attrs blocks`);
