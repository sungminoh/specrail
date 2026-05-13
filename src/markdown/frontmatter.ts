// F1.1 frontmatter parser — ADR-4 unified/remark
// F1.2 input auto-inject (다음 phase가 이 함수로 이전 phase frontmatter 읽음)

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { parse as parseYaml } from './yaml.js';

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
  hasFrontmatter: boolean;
}

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const tree = processor.parse(raw);
  const yamlNode = (tree as { children: Array<{ type: string; value?: string }> }).children.find(
    (c) => c.type === 'yaml',
  );

  if (!yamlNode || typeof yamlNode.value !== 'string') {
    return { frontmatter: {}, body: raw, hasFrontmatter: false };
  }

  const frontmatter = parseYaml(yamlNode.value);
  // Body = raw without YAML block
  const body = stripFrontmatter(raw);
  return { frontmatter, body, hasFrontmatter: true };
}

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? raw.slice(match[0].length) : raw;
}
