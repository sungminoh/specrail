import matter from 'gray-matter';

/** Round-trip a frontmatter object + body back into a markdown document. */
export function serializePhaseMarkdown(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  // gray-matter.stringify produces: ---\n<yaml>---\n<body>
  return matter.stringify(body, frontmatter);
}
