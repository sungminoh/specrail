#!/usr/bin/env node
// 0.2.1 codemod: extract T-task red-test from prose body.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'docs/spec/13-implementation-plan.md';
const text = readFileSync(FILE, 'utf8');

const taskSectionRe = /^#### (T\d+\.\d+):[^\n]*\n([\s\S]*?)(?=^#### T\d+\.\d+:|\n## )/gm;
const taskData = new Map();
let m;
while ((m = taskSectionRe.exec(text)) !== null) {
  const id = m[1];
  const body = m[2];

  let redTest = null;
  const fileBlock = body.match(/Step 1:\s*Failing test[\s\S]{0,1500}/i);
  const searchScope = fileBlock ? fileBlock[0] : body.slice(0, 1500);
  const explicit = searchScope.match(/File\s+`(tests\/[^`]+\.test\.[tj]sx?)`/);
  if (explicit) redTest = explicit[1];
  else {
    const first = searchScope.match(/(tests\/[A-Za-z0-9_.\-/]+\.test\.[tj]sx?)/);
    if (first) redTest = first[1];
  }

  taskData.set(id, { redTest });
}
console.error(`parsed ${taskData.size} T-tasks`);

let updated = text;
let redReplaced = 0, commitReplaced = 0;
const blockRe = /(<!--\s*specrail:attrs\s+id=(T\d+\.\d+)\s*-->\s*\n```yaml\n)([\s\S]*?)(\n```\s*\n<!--\s*\/specrail:attrs\s*-->)/g;
updated = updated.replace(blockRe, (full, prefix, id, body, suffix) => {
  const data = taskData.get(id);
  let newBody = body;
  if (data && data.redTest) {
    const before = newBody;
    newBody = newBody.replace(/^red-test:\s*"see task (?:body|table)"$/m, `red-test: ${JSON.stringify(data.redTest)}`);
    if (newBody !== before) redReplaced++;
  }
  const stub = `chore: ${id}`;
  const before2 = newBody;
  newBody = newBody.replace(/^commit-msg-stub:\s*"see task (?:body|table)"$/m, `commit-msg-stub: ${JSON.stringify(stub)}`);
  if (newBody !== before2) commitReplaced++;
  return prefix + newBody + suffix;
});

writeFileSync(FILE, updated);
console.error(`replaced red-test: ${redReplaced}, commit-msg-stub: ${commitReplaced}`);
