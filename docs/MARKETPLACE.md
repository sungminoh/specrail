# Claude Code Plugin Marketplace Registration

> Status (as of 2026-05-13): Official marketplace submission is available via Anthropic-hosted forms. The self-hosted marketplace system (distributing your own `marketplace.json` via GitHub) is fully documented. The Anthropic-curated `claude-plugins-official` directory accepts third-party submissions via a submission form. Review criteria and timelines are not published; verify directly with Anthropic.

Sources consulted: [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins), [code.claude.com/docs/en/plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official).

---

## Plugin Manifest

A Claude Code plugin requires a `.claude-plugin/plugin.json` file at the plugin root. The full schema:

```json
{
  "name": "my-plugin",          // required — kebab-case, becomes skill namespace prefix
  "description": "...",         // shown in plugin manager
  "version": "1.0.0",           // optional — if omitted, git commit SHA is used
  "author": {
    "name": "...",              // optional
    "email": "..."              // optional
  },
  "homepage": "...",            // optional URL
  "repository": "...",          // optional source URL
  "license": "MIT"              // optional SPDX identifier
}
```

Component locations (all relative to plugin root, **not** inside `.claude-plugin/`):

| Path | Purpose |
|------|---------|
| `skills/<name>/SKILL.md` | Agent skills — namespaced as `/<plugin-name>:<skill-name>` |
| `commands/` | Flat Markdown skill files (legacy; prefer `skills/`) |
| `agents/` | Subagent definitions (Markdown with YAML frontmatter) |
| `hooks/hooks.json` | Event handlers |
| `.mcp.json` | MCP server configurations |
| `.lsp.json` | LSP server configurations |
| `monitors/monitors.json` | Background monitors |
| `bin/` | Executables added to Bash tool's `PATH` |
| `settings.json` | Default settings applied when plugin is enabled |
| `README.md` | Plugin documentation (required for marketplace submission) |

Supported hook events include `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`, and others. See [hooks reference](https://code.claude.com/docs/en/plugins-reference#hooks) for the full list.

---

## Required Files in This Plugin

This repo (`specrail`) is **not yet structured as a Claude Code plugin**. It uses a custom `skills/manifest.json` format, not the official `.claude-plugin/plugin.json` convention.

Current state:

| File/Directory | Present | Notes |
|----------------|---------|-------|
| `.claude-plugin/plugin.json` | No | Not yet created |
| `skills/<name>/SKILL.md` | Yes (14 skills) | Correct location and format |
| `agents/` | No | Not present |
| `hooks/hooks.json` | No | Not present |
| `.mcp.json` | No | Not present |
| `README.md` | Yes | Present at repo root |
| `skills/manifest.json` | Yes | Custom format — not part of CC plugin spec |

To become a conformant CC plugin, the repo needs `.claude-plugin/plugin.json` created. The `skills/manifest.json` is a project-internal artifact; the official plugin system discovers skills by directory layout, not by a manifest index.

---

## Submission Process

### Self-hosted marketplace (no Anthropic review required)

Anyone can create and host their own marketplace by:

1. Creating `.claude-plugin/marketplace.json` in a GitHub (or any git) repository.
2. Listing plugin entries with `source` pointing to plugin directories or external repos.
3. Sharing the marketplace with users via:

```bash
# Add from GitHub owner/repo shorthand
claude plugin marketplace add <owner>/<repo>

# Add from full git URL
claude plugin marketplace add https://gitlab.example.com/team/plugins.git

# Add locally for testing
claude plugin marketplace add ./my-marketplace

# Scope to project (writes to .claude/settings.json, shared with team)
claude plugin marketplace add <owner>/<repo> --scope project
```

Users then install individual plugins:

```bash
/plugin install <plugin-name>@<marketplace-name>
```

### Anthropic-curated official marketplace (`claude-plugins-official`)

To appear in the Anthropic-managed directory that ships with Claude Code:

1. Submit via one of these in-app forms:
   - Claude.ai: `https://claude.ai/settings/plugins/submit`
   - Anthropic Console: `https://platform.claude.com/plugins/submit`

2. Alternatively, open a PR against [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — the repository accepts third-party submissions; external plugins must meet Anthropic's quality and security standards.

3. The submission form for the directory is also available at: `https://clau.de/plugin-directory-submission`

> Specific acceptance criteria, review checklist, and rejection reasons are not documented publicly. The most common versioning rejection: `plugin.json` version does not match CHANGELOG or git tags.

---

## Permissions Requested

The Claude Code plugin system does not use a declarative permissions schema in `plugin.json` (as of the docs available at the time of this research). Plugins gain access implicitly through the components they bundle:

| Component | Implicit access granted |
|-----------|------------------------|
| `hooks/hooks.json` | Shell command execution on hook events (file system, network — scope determined by the hook command itself) |
| `.mcp.json` | Whatever the MCP server process accesses |
| `bin/` executables | Added to Bash tool PATH; can run arbitrary code |
| `skills/`, `agents/` | Read-only access to prompt context; no additional system permissions |

For **this plugin** (`specrail`), once converted to the official format:
- Skills only: no system-level permissions beyond what Claude Code already has.
- No hooks, MCP servers, or executables are currently defined.
- If git-based hooks are added in future (e.g., `pre-commit-lint.sh`), those would require file system write access to staged files.

> There is no `permissions` field in `plugin.json`. Users are warned at install time that Anthropic cannot verify plugin behavior.

---

## Review Timeline

Unknown — verify directly with the Anthropic plugin team.

The official submission forms (`claude.ai/settings/plugins/submit` and `platform.claude.com/plugins/submit`) do not publish SLA or review timelines. The `claude-plugins-official` GitHub repository does not include a CONTRIBUTING.md with timeline expectations.

---

## Alternative: GitHub Direct Install (until or instead of marketplace)

Users can install this plugin directly from GitHub without going through any marketplace:

```bash
# Add this repo as a marketplace source
claude plugin marketplace add sungminoh/myharness

# Then install the plugin by name (once .claude-plugin/plugin.json exists)
/plugin install <plugin-name>@myharness
```

Or for one-session local testing during development:

```bash
claude --plugin-dir ./path/to/plugin-root
```

To wire the marketplace into a project automatically so teammates get prompted on first open, add to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "specrail": {
      "source": {
        "source": "github",
        "repo": "<owner>/<repo>"
      }
    }
  }
}
```

---

## Prerequisite: Convert This Repo to Plugin Format

Before any marketplace step, `.claude-plugin/plugin.json` must exist. Minimum viable file:

```json
{
  "name": "specrail",
  "description": "13-phase spec discipline for Claude Code",
  "version": "0.0.1",
  "author": {
    "name": "specrail contributors"
  },
  "repository": "https://github.com/<owner>/myharness"
}
```

Validate after creation:

```bash
claude plugin validate .
```

---

## Reserved Marketplace Names

The following names are reserved by Anthropic and cannot be used in `marketplace.json`:
`claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `knowledge-work-plugins`, `life-sciences`.

Names that impersonate official marketplaces are also blocked.

---

## References

- Plugin creation docs: https://code.claude.com/docs/en/plugins
- Marketplace distribution docs: https://code.claude.com/docs/en/plugin-marketplaces
- Full plugin reference: https://code.claude.com/docs/en/plugins-reference
- Official plugin directory: https://github.com/anthropics/claude-plugins-official
- Submission form (Claude.ai): https://claude.ai/settings/plugins/submit
- Submission form (Console): https://platform.claude.com/plugins/submit
- Directory submission: https://clau.de/plugin-directory-submission
