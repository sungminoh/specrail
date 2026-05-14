# M8 Ship — User Action Checklist

These steps require user credentials, external accounts, or service interactions that the AI cannot perform autonomously. Complete in order.

## 1. NPM_TOKEN GitHub secret (required for publish)

**Action by user — AI cannot do this**

1. Sign in or create npm account: https://www.npmjs.com
2. Account Settings → Access Tokens → Generate New Token → choose **Automation** type
3. Copy the token (shown once)
4. In this GitHub repo: Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Secret: paste the token

## 2. (Optional) Plausible Analytics account

**Action by user — AI cannot do this**

> Note: telemetry is opt-in. With env vars unset, the adapter is no-op (no events sent).

Only if you want telemetry enabled. See `docs/TELEMETRY.md` for full setup.

1. Create account at https://plausible.io (choose **EU region** for GDPR)
2. Add a site for this plugin
3. (Optional) Generate API token (Account → API Keys). Token is only needed for self-hosted setups that require Bearer — Plausible /api/event is unauthenticated by default.
4. Copy `.env.example` → `.env` and fill in `PLAUSIBLE_DOMAIN`, `PLAUSIBLE_ENDPOINT` (required). `PLAUSIBLE_API_TOKEN` is optional.

Skip this section to ship without telemetry.

## 3. (Optional) Claude Code marketplace submission

**Action by user — AI cannot do this**

See `docs/MARKETPLACE.md` for current registration status. If marketplace public submission is not yet open, skip this and rely on GitHub direct install.

## 4. Trigger first release

**Action by user — AI cannot do this** (requires NPM_TOKEN from step 1)

```sh
npm version prerelease --preid alpha
git push --follow-tags
```

This pushes a tag like `v0.0.1-alpha.0` and triggers `.github/workflows/release.yml`.

## 5. Verify publish

**Action by user — AI cannot do this** (requires npm registry access)

```sh
npm view specrail
```

Confirm latest version matches the tag pushed in step 4.

## Rollback (if needed)

- Within 24h of publish: `npm unpublish specrail@<version>`
- After 24h: `npm deprecate specrail@<version> "<reason>"`

## 6. ManualReview sign-off workflow (recurring, every release)

**Action by maintainer — AI cannot do this**

`specrail verify` classifies most IDs automatically, but ADRs and a few
operational items live in the **ManualReview** state until a human signs
off. Run before each release:

```sh
specrail verify --md > /tmp/verify.md
```

For every ADR-{n} / item that shows up as 🔵 ManualReview:

1. Read the ADR body. Confirm the decision still matches the code in
   the cited file.
2. Append a single sign-off line at the end of the ADR section:

   ```markdown
   **Verification:** Manual review by <your-name> <YYYY-MM-DD> sha:<short> path:<rel/path/to/related/file>
   ```

   - `<short>` is the first 7+ chars of `git hash-object <path>` for the
     file you reviewed.
   - When that file changes in a future commit, `specrail verify` will
     detect the SHA mismatch and re-flag the ADR as
     🟠 ManualReview-Stale so you remember to re-sign.

3. Commit the sign-off as part of the release prep.

ManualReview-Stale items must be re-signed before publishing the next
release — that's the contract that keeps the spec honest as the
codebase evolves.
