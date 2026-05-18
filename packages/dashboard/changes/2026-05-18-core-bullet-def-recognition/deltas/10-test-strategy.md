# Delta — Phase 10 (Test Strategy)

**Base:** post-M9 `docs/spec/10-test-strategy.md`
**Proposal:** [../proposal.md](../proposal.md)

## ADD — TC

```markdown
### TC-CORE-BULLET-DEF: bullet-style ID definitions

<!-- specrail:attrs id=TC-CORE-BULLET-DEF -->
\`\`\`yaml
status: proposed
covers-ac: [AC-CORE-1, AC-CORE-3]
linked-features: [F2.5]
\`\`\`
<!-- /specrail:attrs -->

**Setup:** body markdown with mixed definition styles:
- `## R1: heading definition`
- `<!-- specrail:attrs id=NFR-PERF-1 -->`
- `- **AC-R1-1:** GIVEN ... THEN ...`
- `  - **F1.2:** indented bullet`

**Act:** `extractDefinedIds(body)`.

**Assert:**
- Output array contains R1, NFR-PERF-1, AC-R1-1, F1.2
- Order = first-occurrence document order
- Dedupe — repeated occurrences only appear once
```
