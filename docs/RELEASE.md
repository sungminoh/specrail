# Release Process

## Prerequisites (one-time)

1. Create npm account at https://www.npmjs.com
2. Generate Automation Token (Account → Access Tokens → Generate New Token → Automation)
3. Add as GitHub secret: Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: paste the token

## Publish a release

1. Bump version: `npm version <patch|minor|major>` (creates tag `v<version>`)
2. Push tag: `git push --follow-tags`
3. GitHub Actions auto-runs `.github/workflows/release.yml`
4. Verify: `npm view @plan-pipeline/v4`

## Rollback (if needed)

- Within 24h: `npm unpublish @plan-pipeline/v4@<version>`
- After 24h: publish a deprecation: `npm deprecate @plan-pipeline/v4@<version> "reason"`
