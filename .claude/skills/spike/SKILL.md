---
name: spike
description: Extract a time-boxed investigation when planning or execution is blocked by missing information. Creates a Confluence spec page (child of PPP), a Jira story, and adds the spike as a milestone row in the PPP with the appropriate Blocked By wiring. Use when the user is stuck on a decision, needs research before proceeding, or says "spike".
argument-hint: "PPP Confluence URL"
arguments: "PPP Confluence URL"
---

> **Workflow reference:** See `.claude/skills/WORKFLOW.md` for the full skill sequence and how this step fits.

# Spike

A spike is a **time-boxed learning unit that unblocks a decision**. It can end in (a) a decision, or (b) a PoC summary with throwaway code. Output is always written findings — never shipped code.

## Input

`$ARGUMENTS` — PPP Confluence URL.

---

## Step 1: Detect Context

**If invoked from a grill-me session:** the uncertainty is already identified in conversation — extract the question directly without re-asking. Skip to Step 2.

**If invoked cold:** ask:
- What question needs answering?
- What decision can't be made without it?

---

## Step 2: Identify Blocking Milestone

Fetch the PPP milestones table using `mcp__plugin_nr_atlassian-jira__getConfluencePage`.

**If no milestones exist yet (pre-planning):** note that the spike will be planned alongside the milestones. Proceed — the spike row will be added when milestones are written.

**If milestones exist:** display the current list and ask which milestone this spike blocks:

```
Which milestone does this spike block?
  m1-bundle-shaping   | NOT STARTED | Blocked by: —
  m2-mobile-harvester | NOT STARTED | Blocked by: m1-bundle-shaping
  m3-vega-wiring      | NOT STARTED | Blocked by: m1-bundle-shaping, m2-mobile-harvester
```

Wait for selection.

---

## Step 3: Define the Spike

Interview one question at a time, providing your recommended answer for each:

1. **Question** — distill the uncertainty into a single, answerable question. Confirm with user.
2. **Time-box** — how long? (default: 1 day)
3. **What to investigate** — specific experiments, benchmarks, or doc-dives that answer the question.
4. **Definition of done** — what evidence closes the spike?
5. **Fallback** — if inconclusive after time-box, what's the default decision?
6. **Handoff context** — what code areas, links, or prior art does the investigator need?

---

## Step 4: Assign Spike ID

Scan the PPP milestones table for existing spike rows (IDs starting with `s`). Assign the next available number.

Format: `s{N}-{slug}` — sequential global counter, 1–3 word kebab-case title.
Examples: `s1-auth-token-research`, `s2-mobile-collector-eval`

---

## Step 5: Create Confluence Spec Page

Create a child page under the PPP using `mcp__plugin_nr_atlassian-jira__createConfluencePage`.

- **Title**: `Spike: [question summary]`
- **Parent**: PPP page ID
- **Space**: same spaceId as PPP (get from `getConfluencePage` response)
- **contentFormat**: `markdown`

Template:

```markdown
---
ID: {spike-id}
Blocks: {milestone-id}
Time-box: {duration}
Status: NOT STARTED
---

## Context

{Why this question blocks progress — what decision depends on the answer}

## What to investigate

- {Specific experiment or step}
- {Specific experiment or step}

## Definition of done

- [ ] Evidence that answers the question
- [ ] Decision documented in the Findings section below

## Fallback

If inconclusive after time-box: {fallback approach}

## Handoff context

{Links, relevant code areas, prior art — everything a fresh Claude session needs to pick this up}

## Findings

*(empty — fill in when spike is complete)*
```

---

## Step 6: Create Jira Story

Create a child story under the feature key using:

```bash
node .claude/commands/ppp-spec-kit/scripts/create-jira-ticket.js \
  --title "Spike: {question summary}" \
  --description "{story description}" \
  --project NR \
  --type Story \
  --url https://new-relic.atlassian.net \
  --username ametku@newrelic.com \
  --token "$JIRA_API_TOKEN" \
  --parent "<feature key>" \
  --milestone "<spike-id>"
```

Story description template:

```markdown
## Spike

{spike-id} — {question}

## Why this blocks

{context — what decision can't be made without this}

## Spec

{Confluence page URL}

## Time-box

{duration}

## Fallback

{fallback if inconclusive}
```

---

## Step 7: Update PPP Milestones Table

Use `mcp__plugin_nr_atlassian-jira__updateConfluencePage` to update **only the milestones section**. Two changes:

**1. Insert spike row** — place it immediately before the milestone it blocks (or at end if pre-planning):

| ID | Milestone | Owner | Deadline | Status | Blocked By |
|----|-----------|-------|----------|--------|------------|
| s1-auth-token-research | Spike: Auth Token Research | | | NOT STARTED | — |

**2. Update blocked milestone's Blocked By** — add the spike ID:

| m2-core-impl | Core Implementation | | | NOT STARTED | s1-auth-token-research |

Do not touch any other rows or sections.

---

## Step 8: Confirm

```
✓ Spike created: s1-auth-token-research
  Confluence spec: {page URL}
  Jira story:      NR-XXXXX
  Blocks:          m2-core-impl
  PPP updated:
    s1-auth-token-research → NOT STARTED (inserted before m2-core-impl)
    m2-core-impl           → Blocked By: s1-auth-token-research

Next: complete the spike, fill in Findings on the Confluence page,
close the Jira story, update s1 status to COMPLETED in the PPP,
then run /milestones-to-issues to continue.
```

---

## Rules

- One question per spike. Multiple unknowns → multiple spikes.
- Always time-box. No open-ended investigations.
- Spikes produce a **decision or PoC summary** — not shipped code.
- Never continue planning past a spike — the answer changes the plan.
- Spike rows use `s{N}` IDs. `/milestones-to-issues` skips them.
