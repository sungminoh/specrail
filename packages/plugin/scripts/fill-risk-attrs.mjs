#!/usr/bin/env node
// 0.2.1 codemod: extract RISK severity/probability/mitigation from RISK table.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'docs/spec/12-adr-risks.md';
const text = readFileSync(FILE, 'utf8');

const sevMap = { High: 'H', Med: 'M', Medium: 'M', Low: 'L' };

const rowRe = /^\|\s*(RISK-\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
const rows = new Map();
let m;
while ((m = rowRe.exec(text)) !== null) {
  rows.set(m[1], {
    severity: sevMap[m[3].trim()] || 'M',
    probability: sevMap[m[4].trim()] || 'M',
    mitigation: m[8].trim(),
  });
}
console.error(`parsed ${rows.size} RISK rows`);

let updated = text;
let replaced = 0;
const blockRe = /(<!--\s*specrail:attrs\s+id=(RISK-\d+)\s*-->\s*\n```yaml\n)([\s\S]*?)(\n```\s*\n<!--\s*\/specrail:attrs\s*-->)/g;
updated = updated.replace(blockRe, (full, prefix, id, body, suffix) => {
  const row = rows.get(id);
  if (!row) return full;
  let newBody = body
    .replace(/^severity:\s*M$/m, `severity: ${row.severity}`)
    .replace(/^probability:\s*M$/m, `probability: ${row.probability}`)
    .replace(/^mitigation:\s*"see RISK body"$/m, `mitigation: ${JSON.stringify(row.mitigation)}`);
  if (newBody !== body) replaced++;
  return prefix + newBody + suffix;
});

writeFileSync(FILE, updated);
console.error(`replaced ${replaced} RISK attrs`);
