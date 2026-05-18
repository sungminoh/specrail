# Delta — Phase 13 (Implementation Plan)

**Base:** post-DELTA-3 `docs/spec/13-implementation-plan.md`
**Proposal:** [../proposal.md](../proposal.md)

## M9 — AMENDED

```markdown
<!-- specrail:attrs id=T9.10 -->
\`\`\`yaml
milestone: M9
status: proposed
red-test: "TC-CORE-BULLET-DEF — extractDefinedIds recognizes bullet pattern; AC-CORE-1/2/3"
commit-msg-stub: "fix(core): extractDefinedIds recognizes bullet-style `- **ID:**` definitions"
depends-on: [T9.1]
linked-ac: [AC-CORE-1, AC-CORE-2, AC-CORE-3]
\`\`\`
<!-- /specrail:attrs -->

**T9.10 — Core extractDefinedIds bullet pattern**
- Files: `packages/core/src/spec/ids.ts` (BULLET_DEF_RE + Pass-3), `packages/core/tests/spec-ids.test.ts` (new bullet definition tests).
- Effect: dashboard Quality mode dangling count drops from 105 → ~67 (AC-* false positives removed). Real dangling refs (PAIN-* family) remain.
```
