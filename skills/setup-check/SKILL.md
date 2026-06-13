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
cp templates/CLAUDE.local.json.template CLAUDE.local.json
```

If it exists, read it and verify all required fields are present and non-empty:

| Field | Required |
|---|---|
| `teamId` | yes |
| `teamName` | yes |
| `jiraProjectKey` | yes |
| `confluenceSpaceKey` | yes |
| `confluenceParentPageId` | yes |

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

## Output Format

```
Setup Check Results
───────────────────────────────────────────
✓ CLAUDE.local.json        — all fields present
✗ JIRA_API_TOKEN           — not set
✓ Node.js                  — v20.11.0
✓ atlassian-mcp            — connected
✗ superpowers plugin       — not found
───────────────────────────────────────────
2 issues found. Fix the ✗ items above before running skills.
```

If all pass:

```
✓ All checks passed. You're ready to use ppp-spec-kit.
```
