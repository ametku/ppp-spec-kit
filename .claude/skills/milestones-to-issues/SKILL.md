---
name: milestones-to-issues
description: Create Jira stories for the next unstarted milestone from a PPP. Fetches completed-milestone stories as context, grills you on the right story decomposition, then creates stories with the milestone custom field set. Use when user wants to create issues for the next milestone, or says "milestones to issues".
argument-hint: "PPP Confluence URL"
arguments: "PPP Confluence URL"
---

> **Workflow reference:** See `.claude/skills/WORKFLOW.md` for the full skill sequence and how this step fits.

# Milestones to Issues

Create Jira stories for the next unstarted PPP milestone.

## Input

`$ARGUMENTS` — PPP Confluence URL.

---

## Step 1: Fetch & Parse PPP

Extract the Confluence page ID from the URL. Fetch the page with `mcp__plugin_nr_atlassian-jira__getConfluencePage`.

Extract and hold:
- **Feature Jira key** — from the "Feature Jira Link" field in the Summary table. If absent, ask the user for it.
- **Milestones table** — each row's ID (e.g. `m1-spike`), name, status (`NOT STARTED` / `IN PROGRESS` / `COMPLETED`), and Blocked By list.
- **Scope** — Must Have / Nice to Have / Not in Scope items.
- **PRD link** — from Related Links or Project Context section. Fetch it if present.

---

## Step 2: Review Completed Milestones

For each milestone with status `COMPLETED`:

Query Jira using `mcp__plugin_nr_atlassian-jira__searchJiraIssuesUsingJql`:

```
parent = {feature-key} AND cf[15348] = "{milestone-id}" ORDER BY created ASC
```

Fields to fetch: `summary`, `status`, `customfield_15348`.

Show a brief summary inline:

```
Completed milestone context:
• m1-spike (3 stories): "Set up spike repo", "Evaluate SDK options", "Document findings"
• m2-core-impl (5 stories): "Implement ingestion pipeline", "Wire up auth", ...
```

If a completed milestone has no stories in Jira (cf[15348] not set on old tickets), note it with: `⚠ No stories found — may predate milestone tracking.`

---

## Step 3: Select Next Milestone

Find all milestones where:
- ID starts with `m` (skip spike rows — IDs starting with `s` are handled by `/spike`)
- Status is `NOT STARTED`
- Every milestone ID listed in their "Blocked By" column has status `COMPLETED`

**If none found:**
- If all are `COMPLETED` → tell the user: "All milestones are complete." Stop.
- If some are `IN PROGRESS` but none are ready to start → tell the user which milestones are blocked and why. Stop.

**If exactly one unblocked milestone:** proceed with it.

**If multiple unblocked milestones:** present the candidates and ask the user to choose:

```
Multiple milestones are ready to start:
1. m3-integration — Integration layer
2. m4-mobile-sdk — Mobile SDK support

Which milestone should we create stories for?
```

---

## Step 4: Grill-Me Story Decomposition

Use the following context to propose an initial story set for the target milestone:
- The target milestone's implied scope (from Must Have items and PPP context)
- PRD user stories (if PRD was fetched)
- Stories from completed milestones (to avoid re-describing already-built work)

Each story should be a **vertical slice** — thin end-to-end behavior, not a horizontal layer (no "set up DB schema" stories, no "write tests for X" stories).

**Then interview the user one question at a time** (grill-me style), providing your recommended answer for each:

1. Does the proposed story list cover the full milestone scope, or are there gaps?
2. Is the granularity right, or should any stories be split / merged?
3. Are the dependencies between stories correct?
4. Which stories are HITL (require human decisions) vs AFK (agent can do independently)?
5. Is there anything already built in a previous milestone that these stories should build on rather than re-implement?

Iterate until the user approves the full story set.

---

## Step 5: Final Summary

Before creating anything, display a clean summary table:

```
Creating N stories under {feature-key} for milestone "{milestone-name}" ({milestone-id}):

| # | Title | Type | Blocked by |
|---|-------|------|------------|
| 1 | ... | AFK | — |
| 2 | ... | HITL | Story 1 |

Proceed?
```

Wait for confirmation before creating.

---

## Step 6: Create Stories

Create stories in dependency order (blockers first) using:

```bash
node .claude/commands/ppp-spec-kit/scripts/create-jira-ticket.js \
  --title "<title>" \
  --description "<description>" \
  --project NR \
  --type Story \
  --url https://new-relic.atlassian.net \
  --username ametku@newrelic.com \
  --token "$JIRA_API_TOKEN" \
  --parent "<feature key>" \
  --milestone "<milestone-id>"
```

Each story description follows this template:

```markdown
## Milestone

{milestone-id} — {milestone name}

## What to build

Concise end-to-end description of this vertical slice.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- Reference to blocking ticket, or "None — can start immediately"
```

### Report

After all stories are created:

```
Created N stories under {feature-key} for milestone "{milestone-name}":
- NR-XXXXX: {title} (AFK)
- NR-XXXXX: {title} (HITL)
```

---

## Rules

- Never create stories for milestones beyond the selected target
- Never modify milestones marked `COMPLETED`
- Set `--milestone` on every created story so future runs can find them
- Use project domain vocabulary from the PRD
