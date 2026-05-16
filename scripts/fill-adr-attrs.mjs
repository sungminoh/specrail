#!/usr/bin/env node
// 0.2.1 codemod: extract ADR decision/consequences/alternatives from prose.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'docs/spec/12-adr-risks.md';
const text = readFileSync(FILE, 'utf8');

const adrSectionRe = /^### (ADR-\d+):[^\n]*\n([\s\S]*?)(?=^### ADR-\d+:|\n## Part)/gm;
const adrData = new Map();
let m;
while ((m = adrSectionRe.exec(text)) !== null) {
  const id = m[1];
  const body = m[2];

  const decMatch = body.match(/^#### Decision\s*\n+([\s\S]+?)(?=\n#### |\n### |\n## )/m);
  const consMatch = body.match(/^#### Consequences\s*\n+([\s\S]+?)(?=\n#### |\n### |\n## )/m);
  const altMatch = body.match(/^#### Alternatives Considered\s*\n+([\s\S]+?)(?=\n#### [A-Z]|\n### |\n## )/m);

  const alts = [];
  if (altMatch) {
    const optRe = /^#####\s*(옵션\s+\w[^:]*):\s*([^\n]+)/gm;
    let om;
    while ((om = optRe.exec(altMatch[1])) !== null) {
      alts.push(`${om[1]}: ${om[2].trim()}`);
    }
  }

  adrData.set(id, {
    decision: decMatch ? decMatch[1].trim().split('\n').slice(0, 3).join(' ').slice(0, 400) : null,
    consequences: consMatch ? consMatch[1].trim().split('\n').slice(0, 5).join(' ').slice(0, 400) : null,
    alternatives: alts.length > 0 ? alts : null,
  });
}
console.error(`parsed ${adrData.size} ADRs`);

let updated = text;
let replaced = 0;
const blockRe = /(<!--\s*specrail:attrs\s+id=(ADR-\d+)\s*-->\s*\n```yaml\n)([\s\S]*?)(\n```\s*\n<!--\s*\/specrail:attrs\s*-->)/g;
updated = updated.replace(blockRe, (full, prefix, id, body, suffix) => {
  const data = adrData.get(id);
  if (!data) return full;
  let newBody = body;
  newBody = newBody.replace(/^status:\s*Approved$/m, 'status: Accepted');
  if (data.decision) {
    newBody = newBody.replace(/^decision:\s*"see ADR body"$/m, `decision: ${JSON.stringify(data.decision)}`);
  }
  if (data.consequences) {
    newBody = newBody.replace(/^consequences:\s*"see ADR body"$/m, `consequences: ${JSON.stringify(data.consequences)}`);
  }
  if (data.alternatives) {
    const altList = data.alternatives.map((a) => JSON.stringify(a)).join(', ');
    newBody = newBody.replace(/^alternatives-considered:\s*\["see ADR body for [^"]+"\]$/m, `alternatives-considered: [${altList}]`);
  }
  if (newBody !== body) replaced++;
  return prefix + newBody + suffix;
});

writeFileSync(FILE, updated);
console.error(`replaced ${replaced} ADR attrs`);
