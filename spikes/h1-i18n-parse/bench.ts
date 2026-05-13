import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { visit } from 'unist-util-visit';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, 'test-fixture.md');

const ID_RE = /\b([RFS]\d+(?:\.\d+){0,2}|ENT-[A-Za-z0-9]+|INV-\d+|NFR-[A-Z]+-\d+)\b/g;

async function main() {
  const raw = await readFile(fixturePath, 'utf8');
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);
  const tree = processor.parse(raw);

  const yamlNode = (tree as any).children.find((c: any) => c.type === 'yaml');
  const yamlBody = yamlNode?.value ?? '';
  const koreanInYaml = yamlBody.includes('한국어');

  const headings: { depth: number; text: string; line: number }[] = [];
  visit(tree, 'heading', (node: any) => {
    const text = node.children.map((c: any) => c.value ?? '').join('');
    headings.push({ depth: node.depth, text, line: node.position?.start.line ?? -1 });
  });

  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(ID_RE);
  while ((m = re.exec(raw)) !== null) ids.add(m[1]);

  const results = {
    yamlKoreanPreserved: koreanInYaml,
    headingCount: headings.length,
    headingTexts: headings.map((h) => h.text),
    headingLines: headings.map((h) => h.line),
    idsExtracted: [...ids].sort(),
    expectedIds: ['R1', 'F1.1', 'F1.2', 'R2', 'S1.2.3', 'INV-2', 'NFR-SCAL-1'].sort(),
  };

  console.log('=== T0.9 한국어 mixed-lang parse 결과 ===');
  console.log(JSON.stringify(results, null, 2));

  const acceptance = {
    a_id_extraction: results.expectedIds.every((id) => results.idsExtracted.includes(id)),
    b_yaml_korean: results.yamlKoreanPreserved,
    c_heading_lines: results.headingLines.every((l) => l > 0),
  };

  console.log('\n=== Acceptance ===');
  for (const [k, v] of Object.entries(acceptance)) {
    console.log('  ' + (v ? '✓' : '✗') + ' ' + k);
  }
  console.log('\nStatus: ' + (Object.values(acceptance).every(Boolean) ? 'PASSED' : 'FAILED'));
}

await main();
