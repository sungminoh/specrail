import { useMemo } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { classifyKind } from '@specrail/core';

const ID_REGEX =
  /\b([RFS]\d+(?:\.\d+){0,2}|NFR-[A-Z][A-Z0-9]*-\d+|TC-\d+|AC-R\d+-\d+|INV-\d+|ADR-\d+|RISK-\d+|KPI-\d+|PERSONA-(?:EDGE-)?\d+|SCEN-\d+|JNY-\d+\.\d+|P-CC-\d+|W-CC-[A-Z][A-Z0-9_-]*|FLN-\d+|FLE-\d+|T\d+(?:\.\d+)?)\b/g;

export function MarkdownView({ body, projectId }: { body: string; projectId: string }) {
  // Render via remark to HTML, then linkify IDs by string replace inside text nodes.
  // Sanitization: source is the user's own spec files (trusted local fs); rehype-raw allows embedded
  // HTML which mirrors GitHub preview behavior.
  const html = useMemo(() => renderAndLinkify(body, projectId), [body, projectId]);
  return <div className="markdown-body" {...{ dangerouslySetInnerHTML: { __html: html } }} />;
}

function renderAndLinkify(md: string, projectId: string): string {
  const rendered = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .processSync(md);
  const raw = String(rendered);
  return raw.replace(/>([^<]+)</g, (_full, text: string) => {
    const replaced = text.replace(ID_REGEX, (id: string) => {
      const target = phaseForId(id);
      if (!target) return `<span class="id-chip mono">${id}</span>`;
      return `<a href="/p/${projectId}/phase/${target}#${encodeURIComponent(id)}" class="id-chip mono">${id}</a>`;
    });
    return `>${replaced}<`;
  });
}

function phaseForId(id: string): number | null {
  const kind = classifyKind(id);
  switch (kind) {
    case 'R':
    case 'F':
    case 'S':
    case 'AC':
      return 3;
    case 'NFR':
      return 9;
    case 'TC':
    case 'EDGE':
      return 10;
    case 'INV':
      return 4;
    case 'ADR':
    case 'RISK':
      return 12;
    case 'OPS':
      return 11;
    case 'KPI':
    case 'OQ':
      return 1;
    case 'PERSONA':
    case 'SCEN':
    case 'JNY':
      return 2;
    case 'P-CC':
    case 'W-CC':
    case 'E-CC':
    case 'ZN':
      return 7;
    case 'FLN':
    case 'FLE':
      return 5;
    case 'T':
      return 13;
    case 'ARCH':
    case 'EXT':
      return 8;
    default:
      return null;
  }
}
