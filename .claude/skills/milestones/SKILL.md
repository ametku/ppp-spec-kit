---
name: milestones
description: Interactively build milestones for a PPP by interviewing the user. Writes milestones table (with dependency chain) directly to the PPP Confluence page. Use when user wants to create milestones, break a project into phases, plan incremental delivery, or says "milestones".
argument-hint: "PPP Confluence URL"
arguments: "PPP Confluence URL"
---

> **Workflow reference:** See `.claude/skills/WORKFLOW.md` for the full skill sequence and how this step fits.

# Milestones

Interview the user and write a milestones table directly to the PPP Confluence page — including dependency chain, system state transitions, and parallelism shown as a terminal diagram in chat.

## Input

`$ARGUMENTS` — PPP Confluence URL.

---

## Step 1: Fetch PPP and Existing Milestones

Extract the Confluence page ID from the URL. Fetch the page using `mcp__plugin_nr_atlassian-jira__getConfluencePage`.

Look for an existing milestones table. If found, display it and ask:

```
Found 3 existing milestones:
  m1-bundle-shaping   | NOT STARTED | Blocked by: —
  m2-mobile-harvester | NOT STARTED | Blocked by: m1-bundle-shaping
  m3-vega-wiring      | NOT STARTED | Blocked by: m1-bundle-shaping, m2-mobile-harvester

What would you like to do?
  (a) Keep all and refine
  (b) Start fresh
  (c) Modify specific milestones
```

Wait for the user's choice before proceeding.

If no milestones section exists, proceed directly to the interview.

Also look for a PRD in the conversation context, codebase, or linked from the PPP. Read it if found.

---

## Step 2: Interview

Ask questions **one at a time**, providing your recommended answer for each. Walk down each branch of the decision tree.

Questions to resolve:

1. What is the first natural code checkpoint — where can work be reviewed and the system is in a stable, coherent state?
2. What does the system look like after that checkpoint? What's been unlocked or established? (subjective — let the user define the output state)
3. What are the remaining natural boundaries?
4. For each subsequent milestone: does it depend on the output of a previous one, or can it run in parallel?
5. What's explicitly in scope and out of scope for each milestone?

**Milestone boundaries are art, not science.** Don't require demoability — a milestone is a checkpoint where the code is reviewable and the system is in a coherent intermediate state. Let the user define what that means.

If a question can be answered by reading the PRD or exploring the codebase, do that instead of asking.

---

## Step 3: Show Terminal Diagram

Once milestone structure and dependencies are agreed, render a dependency diagram in the chat:

```
START
  │
  ▼
┌──────────────────────────────┐
│ m1-bundle-shaping            │
│ Starts: [user-defined state] │
│ Ends:   [user-defined state] │
└──────────────┬───────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌────────────┐    ┌────────────┐  ← parallel
│ m2-mobile  │    │ m3-other   │
│ Starts: …  │    │ Starts: …  │
│ Ends:   …  │    │ Ends:   …  │
└─────┬──────┘    └─────┬──────┘
      └────────┬─────────┘
               ▼
        ┌─────────────┐
        │ m4-qoe      │
        └─────────────┘
```

Label parallel branches explicitly with `← parallel`. Show how each milestone's output state feeds the next milestone's input.

Review with the user:
- Is the dependency chain correct?
- Any missed parallelism opportunities?

Iterate until approved.

---

## Step 4: Write to Confluence

Write **only the milestones section** of the PPP page. Do not modify any other section.

### Milestone IDs

`m{N}-{slug}` — sequential number + 1–3 word kebab-case title.
Examples: `m1-bundle-shaping`, `m2-mobile-harvester`, `m3-vega-wiring`

### Milestones table

| ID | Milestone | Owner | Deadline | Status | Blocked By |
|----|-----------|-------|----------|--------|------------|
| m1-bundle-shaping | Bundle Shaping | | | NOT STARTED | — |
| m2-mobile-harvester | Mobile Harvester | | | NOT STARTED | m1-bundle-shaping |

- **Owner** and **Deadline**: leave blank — user fills manually on Confluence
- **Blocked By**: comma-separated milestone IDs, or `—` if none
- **Status values**: `NOT STARTED`, `IN PROGRESS`, `COMPLETED`

### Per-milestone detail sections (below the table)

After the table, write a detail block for each milestone:

```markdown
### m1-bundle-shaping: Bundle Shaping + Public Interface

**Goal:** [one-sentence description of the output state — user-defined]

#### Scope
- bullet points

#### Out of scope
- bullet points
```

### How to update

Use `mcp__plugin_nr_atlassian-jira__updateConfluencePage`.

Replace the entire milestones section — from the `## Milestones` heading through the last per-milestone detail block — with the new content. Leave all other sections (header table, Scope, Open Questions, Related links) completely untouched.

If no milestones section exists, insert it after the Scope section.

After writing, confirm:

```
✓ Milestones written to [PPP URL]
  m1-bundle-shaping → m2-mobile-harvester → m3-vega-wiring
                    ↗
        m4-parallel (parallel with m2)
```
