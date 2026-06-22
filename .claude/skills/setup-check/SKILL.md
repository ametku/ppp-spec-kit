---
name: setup-check
description: Verify that all required tools, credentials, and configuration are in place to use ppp-spec-kit skills. Use when the user wants to check their setup, says "setup check", or at the start of a first session.
---

# Setup Check

Verify the environment is ready to run ppp-spec-kit skills. Check each item below and report a clear pass/fail table. Stop after reporting — don't auto-fix unless the user asks.

## Checks

### 1. CLAUDE.local.json

Check if `CLAUDE.local.json` exists in the project root.

```bash
ls CLAUDE.local.json
```

If missing, tell the user to copy the template:

```bash
cp .claude/templates/CLAUDE.local.json.template CLAUDE.local.json
```

If it exists, read it and verify all required fields are present and non-empty:

| Field | Required | Description |
|---|---|---|
| `teamId` | yes | UUID of your team in Jira (found in team settings or board URL) |
| `teamName` | yes | Display name of your team (e.g., "NRAI-CS -> Vertical Visualizations") |
| `jiraProjectKey` | yes | Jira project key prefix for issues (e.g., "NR") |
| `confluenceParentPageIdPRD` | yes | Numeric page ID of the Confluence page under which PRDs will be created as children (found in the page URL: `/pages/123456789/...`) |
| `confluenceParentPageIdPPP` | yes | Numeric page ID of the Confluence page under which PPPs will be created as children |
| `confluencePPPTemplatePageId` | yes | Numeric page ID of the PPP template page to copy when creating new PPPs (the "Copy Me" template) |

Report any missing or empty fields by name.

### 2. JIRA_API_TOKEN

```bash
echo ${JIRA_API_TOKEN:+set}
```

If empty: tell the user to generate a token at https://id.atlassian.com/manage-profile/security/api-tokens and add `export JIRA_API_TOKEN=<token>` to their shell profile.

### 3. Node.js >= 14

```bash
node --version
```

If missing or < 14: tell the user to install Node.js from https://nodejs.org.

### 4. atlassian-mcp

Call `mcp__atlassian-mcp__confluence_search` with a trivial query (e.g. `type=page AND title="test"` with `limit: 1`) to confirm the MCP is connected and responding.

If it fails: tell the user to add `atlassian-mcp` to their MCP config and ensure Confluence credentials are valid.

### 5. superpowers plugin

Check if the `superpowers:brainstorming` skill is available by searching for it in the available skills list.

If missing: tell the user to install the superpowers plugin (`superpowers@claude-plugins-official`).

### 6. lavish skill

Check if `.agents/skills/lavish/SKILL.md` exists in the project root.

If missing: tell the user to run:

```sh
npx skills add kunchenguid/lavish-axi --skill lavish
```

## Output Format

```
Setup Check Results
───────────────────────────────────────────
✓ CLAUDE.local.json        — all fields present
✗ JIRA_API_TOKEN           — not set
✓ Node.js                  — v20.11.0
✓ atlassian-mcp            — connected
✗ superpowers plugin       — not found
✓ lavish skill             — installed
───────────────────────────────────────────
2 issues found. Fix the ✗ items above before running skills.
```

If all pass:

```
✓ All checks passed. You're ready to use ppp-spec-kit.
```
