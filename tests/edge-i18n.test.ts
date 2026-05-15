// TC-49: EDGE-10 NFC vs NFD normalisation
// TC-46 EDGE-7 mixed Korean/English; TC-47 EDGE-8 emoji/unicode
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';

// US-10.3, M10 — EDGE-7·8·9·10 i18n boundary tests
// NFR-I18N-1 + NFR-SCAL-1

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'edge-i18n-'));
  await mkdir(join(dir, 'docs', 'spec'), { recursive: true });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('EDGE-7·8·9·10 i18n + scale boundary (US-10.3, M10)', () => {
  // EDGE-7: 한자 (CJK) mixed heading and body
  it('EDGE-7: extracts R1 from 한자·中文 mixed heading and body (NFR-I18N-1)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: 韓國語 中文 spec\n### F1.1: 漢字 처리\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-flow.md'),
      '---\nphase: 5\n---\n# Flow\n本文 참조: R1 and F1.1 (Chinese chars 中文 mixed).\n',
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.definedIds.has('F1.1')).toBe(true);
    // Body in 05 cites R1 — edge must exist
    expect(g.edges.find((e) => e.from === '05' && e.to === 'R1')).toBeDefined();
    expect(g.edges.find((e) => e.from === '05' && e.to === 'F1.1')).toBeDefined();
  });

  // EDGE-8: emoji in heading
  it('EDGE-8: extracts R1 when emoji appears in heading title (not ID prefix)', async () => {
    // Case A: emoji in title content after the ID — R1 is the ID, emoji is title text
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: 🚀 launch capability\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-flow.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );

    const g = await buildGraph(dir);

    // Emoji in title text must not prevent ID extraction
    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.edges.find((e) => e.from === '05' && e.to === 'R1')).toBeDefined();
  });

  it('EDGE-8: emoji-prefixed heading (🚀-R1) — documents current behaviour', async () => {
    // Case B: emoji prefixes the ID in the heading — the heading text starts with
    // emoji, so HEADING_DEF (/^([A-Z]...):/) does NOT match (emoji is not [A-Z]).
    // This is a known limitation: IDs cannot be emoji-prefixed.
    // This test documents the behaviour rather than asserting a fix.
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## 🚀-R1: foo\n',
    );
    // R1 is still cited in body — but is it defined?
    await writeFile(
      join(dir, 'docs/spec/05-flow.md'),
      '---\nphase: 5\n---\n# Flow\nRefs R1.\n',
    );

    const g = await buildGraph(dir);

    // KNOWN LIMITATION: emoji-prefixed heading does not define R1.
    // The heading text "🚀-R1: foo" starts with a non-ASCII char, so HEADING_DEF
    // fails to match. R1 citation in body becomes dangling.
    // If this ever becomes false, a fix was applied — update test accordingly.
    expect(g.definedIds.has('R1')).toBe(false);
    expect(g.danglingCitations.find((d) => d.to === 'R1')).toBeDefined();
  });

  // EDGE-9: NFC vs NFD Unicode normalisation
  it('EDGE-9: R1 extracted consistently regardless of NFC/NFD body encoding (NFR-I18N-1)', async () => {
    // Korean "한" in NFC is U+D55C (one codepoint).
    // In NFD it decomposes to U+1112 U+1161 U+11AB (three jamo).
    // The spec ID "R1" is pure ASCII — both forms must produce the same graph.
    const nfcBody = '한글 본문 R1 인용 (NFC)'.normalize('NFC');
    const nfdBody = '한글 본문 R1 인용 (NFD)'.normalize('NFD');

    // Both strings contain ASCII "R1"; normalisation only affects Korean chars.
    // Write one file with NFC body and one with NFD body citing R1.
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: baseline\n',
    );
    await writeFile(
      join(dir, 'docs/spec/05-nfc.md'),
      `---\nphase: 5\n---\n# NFC body\n${nfcBody}\n`,
    );
    await writeFile(
      join(dir, 'docs/spec/06-nfd.md'),
      `---\nphase: 6\n---\n# NFD body\n${nfdBody}\n`,
    );

    const g = await buildGraph(dir);

    // R1 must be defined once
    expect(g.definedIds.has('R1')).toBe(true);

    // Both NFC and NFD files must produce an R1 edge
    const nfcEdge = g.edges.find((e) => e.from === '05' && e.to === 'R1');
    const nfdEdge = g.edges.find((e) => e.from === '06' && e.to === 'R1');

    // NOTE: If NFD breaks citation matching, nfdEdge will be undefined.
    // As of M10, ASCII IDs surrounded by NFD-encoded Korean text still match
    // because \b word-boundary works on ASCII–non-word-char transitions.
    expect(nfcEdge).toBeDefined();
    expect(nfdEdge).toBeDefined();
  });

  it('EDGE-9: same ID written in NFC heading is identical to NFD heading — ASCII IDs unaffected', async () => {
    // Heading IDs are ASCII ("R1"), so NFC vs NFD of surrounding text is irrelevant.
    // This sub-test makes the constraint explicit.
    const headingNFC = '---\nphase: 3\n---\n## R1: ' + '한글'.normalize('NFC') + ' spec\n';
    const headingNFD = '---\nphase: 4\n---\n## R2: ' + '한글'.normalize('NFD') + ' spec\n';

    await writeFile(join(dir, 'docs/spec/03.md'), headingNFC);
    await writeFile(join(dir, 'docs/spec/04.md'), headingNFD);

    const g = await buildGraph(dir);

    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.definedIds.has('R2')).toBe(true);
  });

  // EDGE-10: NFR-SCAL-1 — 50 KB single spec file performance
  // Threshold raised from 2000ms when remark-gfm joined the pipeline (required
  // for table AST). Isolated run ≈150-200ms; under full parallel test-suite
  // CPU contention the same call can reach ~2.5s. 3500ms preserves the
  // perf regression guard without flaking on busy machines.
  it('EDGE-10: 50 KB spec file parsed in < 3500ms, R1 extracted (NFR-SCAL-1)', async () => {
    const bodyLine = 'body cites R1 in repeated content for scale test.\n';
    const content =
      '---\nphase: 3\n---\n## R1: bench\n' + bodyLine.repeat(3000);

    await writeFile(join(dir, 'docs/spec/03-bench.md'), content);

    const t0 = performance.now();
    const g = await buildGraph(dir);
    const elapsed = performance.now() - t0;

    expect(g.definedIds.has('R1')).toBe(true);
    expect(g.edges.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(3500);
  });

  // Boundary: zero-width space adjacent to ID — FIXED in M11 US-11.6
  it('Boundary: ​R1 (U+200B adjacent) — ZWS false-positive fixed (NFR-I18N-1, US-11.6)', async () => {
    await writeFile(
      join(dir, 'docs/spec/03-features.md'),
      '---\nphase: 3\n---\n## R1: real id\n',
    );
    // Body uses ZERO WIDTH SPACE (U+200B) immediately before R1.
    // JS \b does not recognise U+200B as a word break, so without the
    // ZWS lookaround fix, CITATION_RE would still match "R1" here even
    // though the token is only present as a ZWS-prefixed decoration, not
    // a genuine spec citation.  US-11.6 (M11) adds negative lookarounds
    // for ZWS chars to CITATION_RE so this is no longer a false positive.
    await writeFile(
      join(dir, 'docs/spec/05-flow.md'),
      '---\nphase: 5\n---\n# Flow\nThis text has ​R1 (ZWS before) — not a real citation.\n',
    );

    const g = await buildGraph(dir);

    expect(g.definedIds.has('R1')).toBe(true);

    // FIXED (US-11.6, M11): CITATION_RE now has a negative lookbehind for
    // ZWS chars, so ​R1 is no longer extracted as a citation edge.
    const edge = g.edges.find((e) => e.from === '05' && e.to === 'R1');
    expect(edge).toBeUndefined();
  });
});
