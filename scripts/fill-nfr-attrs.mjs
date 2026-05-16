#!/usr/bin/env node
// 0.2.1 codemod: parse NFR table rows, fill attrs placeholder values.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'docs/spec/09-non-functional-requirements.md';
const text = readFileSync(FILE, 'utf8');

const rowRe = /^\|\s*(NFR-[A-Z]+-\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
const rows = new Map();
let m;
while ((m = rowRe.exec(text)) !== null) {
  rows.set(m[1], {
    desc: m[2].trim(),
    unit: m[3].trim(),
    target: m[4].trim(),
    measure: m[5].trim(),
    violates: m[6].trim(),
  });
}
console.error(`parsed ${rows.size} NFR rows`);

let updated = text;
let replaced = 0;
const blockRe = /(<!--\s*specrail:attrs\s+id=(NFR-[A-Z]+-\d+)\s*-->\s*\n```yaml\n)([\s\S]*?)(\n```\s*\n<!--\s*\/specrail:attrs\s*-->)/g;
updated = updated.replace(blockRe, (full, prefix, id, body, suffix) => {
  const row = rows.get(id);
  if (!row) return full;
  let newBody = body
    .replace(/^target:\s*"see row"$/m, `target: ${JSON.stringify(row.target)}`)
    .replace(/^unit:\s*"see row"$/m, `unit: ${JSON.stringify(row.unit)}`)
    .replace(/^measure-method:\s*"see row"$/m, `measure-method: ${JSON.stringify(row.measure)}`);
  if (!/^violates-action:/m.test(newBody) && row.violates && row.violates !== '-') {
    newBody = newBody.replace(/^(last-modified:)/m, `violates-action: ${JSON.stringify(row.violates)}\n$1`);
  }
  if (newBody !== body) replaced++;
  return prefix + newBody + suffix;
});

writeFileSync(FILE, updated);
console.error(`replaced ${replaced} attrs blocks`);
