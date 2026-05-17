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

/**
 * Strip leading HTML block comments (<!-- ... -->) that appear before the YAML
 * frontmatter. Some spec files use an HTML comment on line 1 as a metadata
 * annotation; remark-frontmatter only recognises YAML when '---' is the first
 * line, so we pre-strip these comments before parsing.
 */
function stripLeadingHtmlComments(raw: string): string {
  let s = raw;
  while (s.startsWith('<!--')) {
    const end = s.indexOf('-->');
    if (end === -1) break;
    s = s.slice(end + 3).replace(/^[\r\n]+/, '');
  }
  return s;
}

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const stripped = stripLeadingHtmlComments(raw);
  const tree = processor.parse(stripped);
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
  // Strip optional leading HTML comments then the YAML block
  const stripped = stripLeadingHtmlComments(raw);
  const match = stripped.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? stripped.slice(match[0].length) : raw;
}
