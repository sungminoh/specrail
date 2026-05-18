# Delta — Phase 09 (NFR)

**Base:** post-M9 `docs/spec/09-non-functional-requirements.md`
**Proposal:** [../proposal.md](../proposal.md)

## ADD — NFR-PERF-7

```markdown
<!-- specrail:attrs id=NFR-PERF-7 -->
\`\`\`yaml
status: proposed
target: "≤200"
unit: millisecond
measure-method: "performance.now() between toggle click and panel transitionend"
violates-action: "warn (block at 400)"
linked-arch: [ARCH-1]
linked-r: [R2]
linked-features: [F2.4, F4.2]
\`\`\`
<!-- /specrail:attrs -->
```

표 entry:
| NFR-PERF-7 | side-panel toggle animation | ms | ≤ 200 | client perf API | warn (block 400) |
