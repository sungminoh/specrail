# Release Process

## Prerequisites (one-time)

1. Create npm account at https://www.npmjs.com
2. Generate Automation Token (Account → Access Tokens → Generate New Token → Automation)
3. Add as GitHub secret: Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: paste the token

## Publish a release

1. Bump version: `npm version <patch|minor|major>` (creates tag `v<version>`)
2. Push branch and the **specific release tag explicitly** (do NOT use `--follow-tags` — it can push unrelated local tags like archive markers):
   ```bash
   git push origin main
   git push origin v<version>
   ```
3. GitHub Actions auto-runs `.github/workflows/release.yml`
4. Verify: `npm view specrail`

## Rollback (if needed)

- Within 24h: `npm unpublish specrail@<version>`
- After 24h: publish a deprecation: `npm deprecate specrail@<version> "reason"`

---

## Release notes — 0.1.0 (2026-05-15)

First published release. See `CHANGELOG.md` for full diff.

### Install
```bash
npm install specrail        # plugin source for inspection / programmatic use
```

The plugin is consumed via Claude Code: drop the `skills/` collection into your `~/.claude/plugins/` cache, or install via Claude Code marketplace listing once the entry is approved.

### Primary capabilities (0.1.0)
- 13-phase spec discipline workflow with HARD-GATE between phases.
- `specrail verify` — auto-derived reality vs intent status per spec ID; baseline classifies 514 IDs.
- Pre-commit hooks: id-consistency, schema-validate, verify-status.
- Lint suite: anti-sycophancy, ac-traceability, INV-5/7 enforcement.
- AST-based dependency graph + downstream extraction with annotation-aware ignore ranges.
- Phase state machine (`Draft → Proposed → Reviewed → Approved → Applied`).
- DELTA mode lifecycle (`changes/{date}-{topic}/proposal.md` → `deltas/phase-NN-*.md` → merge).

### Known limitations
- **Attrs schema migration (M-CSA) deferred to 0.2.0** — per OQ-CSA-7 resolution. See `docs/spec/changes/2026-05-15-core-schema-attrs/` for the Approved spec.
- **Dashboard companion (`specrail/dashboard`)** is a separate repo / cycle (ADR-15). Not part of this release.

### Upgrade path
- From 0.0.1 (unpublished): no migration — 0.1.0 is the first public release.

### Next release (0.2.0 — planned)
M-CSA milestone: attrs YAML per-entity attribute blocks, closed-enum typed edges, codemod (`bin/specrail-migrate`), audit CLI (`bin/specrail-audit`), public schema artifact (`schemas/attrs.schema.json`). Tracked in `docs/spec/changes/2026-05-15-core-schema-attrs/tasks.md`.
