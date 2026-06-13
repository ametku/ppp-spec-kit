---
name: spec
description: Create a technical spec file for a Jira story. Fetches the story, PPP, PRD, and milestone for context, interviews on gaps, then writes a developer-ready spec to ppp_specs/. Use when starting implementation of a story or when a developer needs technical guidance before touching code.
argument-hint: "Jira issue key (e.g. NR-12345)"
arguments: "Jira issue key"
---

> **Workflow reference:** See `.claude/skills/WORKFLOW.md` for the full skill sequence and how this step fits.

# Spec

Write a technical spec file for a Jira story — a developer-ready document covering architecture decisions, implementation plan, and code references. Target audience: a junior developer picking up the story cold with no prior context.

## Input

`$ARGUMENTS` — Jira issue key (e.g. `NR-12345`).

---

## Step 1: Fetch Context

Gather all context before asking the user anything. Do these in order (each step depends on the previous).

### 1a. Fetch the Jira story

Use `mcp__plugin_nr_atlassian-jira__getJiraIssue` with:
```
fields: ["summary", "description", "status", "parent", "customfield_15348", "issuetype"]
```

Extract:
- **Story title** and **description**
- **Acceptance criteria** (from description)
- **Milestone ID** — `customfield_15348`
- **Parent feature key** — `parent.key`

### 1b. Find the PPP URL

Fetch the parent feature issue using `mcp__plugin_nr_atlassian-jira__getJiraIssue` on the feature key.

Then call `mcp__plugin_nr_atlassian-jira__getJiraIssueRemoteIssueLinks` on the feature key. Look for a remote link whose title contains "PPP".

If not found, scan the feature issue description for a Confluence URL.

If still not found, ask the user: *"What's the PPP Confluence URL for this feature?"*

### 1c. Fetch the PPP

Use `mcp__plugin_nr_atlassian-jira__getConfluencePage` on the PPP URL.

Extract:
- **Milestone row** matching the story's milestone ID — name, status, blocked by
- **PRD link** — from Related Links or Project Context section

### 1d. Fetch the PRD

If a PRD link is present, fetch it with `mcp__plugin_nr_atlassian-jira__getConfluencePage`.

Extract relevant implementation decisions and scope that apply to this story.

### 1e. Explore the codebase

Read files relevant to this story's domain. Look for:
- Existing patterns the implementation should follow
- Interfaces this story touches
- Prior art for testing similar behavior

---

## Step 2: Identify Gaps

With all context gathered, check for missing information that is essential for writing the spec:

- Key architecture choices not captured in the PRD or issue
- Ambiguous acceptance criteria with multiple valid implementations
- Unknown constraints (performance, compatibility, API contracts)

**If gaps exist:** ask one question at a time — grill-me style — providing your recommended answer. Only ask what cannot be inferred from the fetched context or codebase.

**If context is complete:** proceed directly to Step 3.

---

## Step 3: Write the Spec File

### File path

```
ppp_specs/{issue-key}-{slug}.md
```

`{slug}` = 2–4 word kebab-case summary of the story title.

Example: `ppp_specs/NR-12345-auth-token-impl.md`

Create the `ppp_specs/` directory if it doesn't exist.

### Template

```markdown
# {Story title}

**Jira**: {issue-key}
**Milestone**: {milestone-id} — {milestone name}
**Status**: NOT STARTED

---

## Context

{1–2 paragraphs: where this story fits in the feature, why it matters, what
the system looks like before and after. Written for a developer with no prior
context on this codebase.}

---

## Architecture Decisions

{One sub-section per key technical decision. Omit this section if the story
has no significant architectural choices.}

### {Decision title}

**Decision**: {what was decided}
**Why**: {the constraint or principle that drove this choice}
**Alternatives considered**: {what else was on the table and why rejected}
**Consequences**: {trade-offs accepted}

{Include a code snippet here ONLY if prose cannot capture the decision
precisely — e.g. interface shapes, wire formats, state machine transitions.
Trim to the decision-critical parts. No working implementations.}

---

## Implementation Plan

Step-by-step technical guide. Written so a junior developer can follow
without guessing what comes next or why.

1. {First step — module/file to touch, what to do, why}
2. {Next step — with enough context to understand the intent}
...

{Code snippets only for high-importance decisions where precision matters.
For everything else, prose is sufficient — trust the developer to fill in
the details.}

---

## Code References

Files and patterns to read before starting:

- `{path/to/file}` — {why it's relevant}
- `{path/to/test}` — {prior art for this type of test}

---

## Acceptance Criteria (Technical)

Restate the Jira acceptance criteria as concrete, testable technical conditions:

- [ ] {What "done" looks like in code — not a copy-paste from Jira}

---

## Testing

- **What to test**: {external behavior only — not implementation details}
- **Test type**: {unit / integration / e2e}
- **Prior art**: `{path/to/similar/test}` — {what makes it a good model}
- **What NOT to test**: {implementation details to leave alone}

---

## Open Questions

{Remove this section if none.}

- [ ] {Unresolved question} — {who needs to answer it}
```

---

## Step 4: Add Jira Comment

Add a comment to the story using `mcp__plugin_nr_atlassian-jira__addCommentToJiraIssue`:

```
Spec written: ppp_specs/{issue-key}-{slug}.md

Technical decisions, implementation plan, and code references are documented there. Read it before starting.
```

---

## Step 5: Confirm

```
✓ Spec written: ppp_specs/NR-12345-auth-token-impl.md
  Jira: NR-12345 (comment added)
  Milestone: m2-mobile-harvester — Mobile Harvester
  Sections: Context, Architecture Decisions (N), Implementation Plan,
            Code References, Acceptance Criteria, Testing
```

---

## Rules

- Never write the spec without fetching the issue, PPP, and PRD first.
- Ask about gaps before writing — not after.
- Code snippets only where prose cannot capture the decision precisely.
- Write for a junior developer: explain the WHY, not just the WHAT.
- Do not copy-paste from the Jira description — synthesize and add technical depth.
- Trust Claude to fill in implementation details; the spec encodes decisions, not a tutorial.
