---
name: prd-to-ppp
description: Create a Project Planner Page (PPP) from a PRD. Extracts scope, generates milestones with dependency tracking, and publishes to Confluence. Use when the user explicitly provides a PRD and asks to create a PPP from it.
---

# PRD to PPP

Convert a PRD into a Project Planner Page published to Confluence.

`$ARGUMENTS` — PRD file path or Confluence URL.

## Step 1: Read PRD

If `$ARGUMENTS` is a Confluence URL, extract the page ID and fetch with `mcp__atlassian-mcp__confluence_get_page`. Otherwise read the local file.

Extract and hold for later:
- All open questions listed in the PRD
- All related links, research docs, and references mentioned

## Step 2: Extract and Confirm Scope

From the PRD, pull out every requirement or feature mentioned. Present them as a **raw list** to the user — do not pre-categorize them yourself.

Ask the user to place each item into one of:
- **Must Have** — cannot ship without it
- **Nice to Have** — desirable but not blocking
- **Not in Scope** — explicitly excluded for this version

If the PRD already contains explicit categorization, present it as a draft and ask the user to confirm or move items. Do not accept the PRD's categorization as final — the user must explicitly sign off on all three lists before you proceed.

Do not proceed to Step 3 until the user approves the full scope.

## Step 3: Spike Check

Scan the PRD and confirmed scope for **technical unknowns or blockers** — unverified assumptions, unproven performance claims, unclear API behaviors, or architectural decisions that can't be made without evidence. Ignore basic detail gaps (missing dates, owner names, etc.).

For each technical unknown found, name it clearly and say:
> "This looks like a spike — consider using the `spike` skill to create a time-boxed investigation for: [question]"

If any spikes are identified, ask:
> "Can all milestones be finalized without completing this spike first?"

- **No** → follow the [Draft PPP path](#draft-ppp-path) and stop
- **Yes** (or no spikes found) → continue to Step 4

### Draft PPP path

Ask for the parent Confluence page URL.

Get the `cloudId` and `spaceId` by calling `mcp__plugin_nr_atlassian-jira__getAccessibleAtlassianResources`. Extract the parent page ID from the URL.

Create a draft Confluence child page under the parent with title `[Project Plan] {Feature Title} — DRAFT` using `mcp__plugin_nr_atlassian-jira__createConfluencePage`. Fill in:
- Scope section (from Step 2)
- Milestones section: empty table with note "⚠ Pending spike resolution before milestones can be finalized."
- Open Questions table: include spike reference — "Spike: [question] — blocks milestone planning"
- Related Links: PRD link

Tell the user:
> Draft PPP created: [URL]. Once your spike is resolved, return with the PPP URL and spike outcome to continue milestone planning.

Stop here.

## Step 4: Generate Milestones

Interview the user to produce milestones. Ask **one question at a time**, providing your recommended answer.

Questions to resolve (in order):
1. What is the minimum demoable first increment?
2. What are the natural dependency boundaries?
3. Which parts carry the most risk or uncertainty? (front-load these as early milestones)
4. What can be deferred without blocking other work?
5. How many milestones feel right for this scope?

If a question can be answered by reading the PRD, do that instead of asking.

### Milestone format

Each milestone gets an ID: `M{N}-{slug}` where slug is a 1–3 word kebab-case summary. Examples: `M1-spike`, `M2-core-impl`, `M3-integration`, `M4-qa`.

Draft the milestones as a table:

| ID | Milestone | Owner | Deadline | Status | Blocked By |
|----|-----------|-------|----------|--------|------------|
| M1-spike | Spike: [title] | | | NOT STARTED | |
| M2-core-impl | Core Implementation | | | NOT STARTED | M1-spike |
| M3-integration | Integration | | | NOT STARTED | |
| M4-qa | Testing / QA | | | NOT STARTED | M2-core-impl, M3-integration |

Rules:
- **Blocked By**: list milestone IDs that must complete before this one starts. Comma-separated if multiple.
- Leave **Blocked By empty** if the milestone can run in parallel with others (no prerequisite).
- Each milestone must be independently demoable when complete.
- Owner and Deadline are left blank — user fills these in after page creation.

Present the draft and ask:
- Does the sequencing make sense?
- Is each milestone independently demoable?
- Are the scopes clear enough to create Jira issues from later?

Iterate until approved.

## Step 5: Gather PPP Metadata

Ask for the **parent Confluence page URL** (the PPP will be created as a child page here).

All other fields (driver, priority, size, due date, risks, Jira link, etc.) are left blank — the user fills them in on the Confluence page after creation.

## Step 6: Assemble and Publish

Get `cloudId` and `spaceId` from `mcp__plugin_nr_atlassian-jira__getAccessibleAtlassianResources`. Extract parent page ID from the URL the user provided.

Create the Confluence page using `mcp__plugin_nr_atlassian-jira__createConfluencePage` with:
- `title`: `[Project Plan] {Feature Title}`
- `parentId`: extracted from user-provided URL
- `contentFormat`: `markdown`

Page content:

```
## Summary

| **Driver** | |
| --- | --- |
| **Feature Jira Link** | |
| **Status** | not started |
| **Project size (t-shirt size)** | |
| **Priority** | |
| **Requirements Clarity** | |
| **Due Date** | |
| **Risks** | |
| **Latest Comment** | |

| **CDD/ IDD** | |
| --- | --- |
| **Figma** | |
| **PM requirements (confluence/ Jira/ slack)** | |
| **Related projects** | |
| **Prerequisite projects** | |
| **Release checklist** | |

## Scope

PM Approval status: Not approved yet

| | |
|--|--|
| **Must have:** | {bullet list from Step 2} |
| **Nice to have:** | {bullet list from Step 2} |
| **Not in scope:** | {bullet list from Step 2} |

## Milestones

Milestones are high level work items. Empty "Blocked By" = can run in parallel.

| ID | Milestone | Owner | Deadline | Status | Blocked By |
|----|-----------|-------|----------|--------|------------|
{rows from Step 4}

## Open Questions

| Question | Answer |
|----------|--------|
{rows extracted from PRD open questions}

## Related Links

- PRD: {link}
{any other links from the PRD}
```

After creating the page, share the URL with the user.
