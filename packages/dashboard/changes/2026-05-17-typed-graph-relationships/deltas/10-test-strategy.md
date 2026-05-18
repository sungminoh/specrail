# Delta — Phase 10 (Test Strategy)

**Base:** `docs/spec/10-test-strategy.md`
**Proposal:** [../proposal.md](../proposal.md)

## ADD — TC entries

```markdown
### TC-TYPED-REFS-1: extractTypedRefs surfaces all 8 edge kinds

<!-- specrail:attrs id=TC-TYPED-REFS-1 -->
\`\`\`yaml
status: proposed
covers-ac: [AC-R2-5]
linked-features: [F2.5]
mitigates: [NFR-COMPAT-1]
\`\`\`
<!-- /specrail:attrs -->

**Setup:** sample body markdown containing one attrs block with all 8 closed-enum
keys (solves, linked-features, parent, tested-by, covers-ac, mitigates, linked-arch, depends-on),
each pointing at distinct sample ids.

**Act:** call `extractTypedRefs(body)`.

**Assert:**
- output length === 8
- each output entry has correct `kind` matching the input yaml key
- `from` matches attrs id, `to` matches the listed ref
- mixed yaml forms: inline list (`linked-arch: [ARCH-4, ARCH-7]`) AND block list
  (`tested-by:\n  - TC-12\n  - TC-13`) both produce one ref per id.

### TC-TYPED-REFS-2: prose-mention refs still produced (fallback)

<!-- specrail:attrs id=TC-TYPED-REFS-2 -->
\`\`\`yaml
status: proposed
covers-ac: [AC-R2-5]
linked-features: [F2.5]
\`\`\`
<!-- /specrail:attrs -->

**Setup:** body markdown with an ID mention in prose (no attrs reference).
**Assert:** extractRefs produces an entry with `kind === undefined`.

### TC-CONN-PANEL-1: panel renders grouped neighbors on focus

<!-- specrail:attrs id=TC-CONN-PANEL-1 -->
\`\`\`yaml
status: proposed
covers-ac: [AC-R2-6]
linked-features: [F2.4]
\`\`\`
<!-- /specrail:attrs -->

**Setup:** mocked graph payload with 1 source id + 8 neighbors, one per kind.
**Act:** render `<ConnectionsPanel focusId="R1" />` with cached query data.
**Assert:**
- 8 grouped sections rendered (one heading per kind)
- in/out direction icon correct
- click on neighbor refocuses to that id

### TC-GRAPH-EDGE-RENDER-1: 8 kinds visually distinguishable

<!-- specrail:attrs id=TC-GRAPH-EDGE-RENDER-1 -->
\`\`\`yaml
status: proposed
covers-ac: [AC-R2-5]
linked-features: [F2.5, F2.6]
\`\`\`
<!-- /specrail:attrs -->

**Setup:** snapshot test — graph with 8 typed edges + 1 prose edge.
**Assert:** rendered SVG `stroke` / `stroke-dasharray` attributes are distinct per kind.
**Manual:** legend overlay shows 9 rows (8 kinds + "prose").
```

## ADD — EDGE entries

```markdown
### EDGE-MALFORMED-ATTRS: malformed yaml in attrs block

<!-- specrail:attrs id=EDGE-MALFORMED-ATTRS -->
\`\`\`yaml
status: proposed
linked-ac: [AC-R2-5]
linked-features: [F2.5]
\`\`\`
<!-- /specrail:attrs -->

**Setup:** attrs block where one yaml key has malformed value (e.g. `linked-arch: [ARCH-`).
**Expected:** parser does NOT throw; the malformed line is dropped; other keys still produce typed-refs.
**Fallback:** prose-mention extractor still operates on full body — IDs mentioned in the malformed line are picked up as untyped refs.
```

## MODIFIED — coverage matrix

기존 표에 column 추가: "typed-refs covered" (Y/N) — F2.5 / F2.4 / F2.6 / AC-R2-5 / AC-R2-6 / NFR-PERF-6 / NFR-COMPAT-1 모두 Y 로 채움.
