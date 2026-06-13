# ppp-spec-kit Canonical Workflow

This file is the source of truth for skill sequencing. Skills reference it so the workflow is consistent across sessions without depending on a user's CLAUDE.md.

## Sequence

```
1. Create Jira Feature          — manually, or via /create-jira command
2. /grill-me                    — stress-test the plan
3. /to-prd                      — write + publish PRD to Confluence
   (optional) /prototype        — build throwaway prototype to validate design
   (optional) /handoff          — compact context for next agent session
4. /prd-to-ppp                  — create Project Planner Page (PPP) from PRD
5. /milestones                  — build milestones table on the PPP
6. /milestones-to-issues        — create Jira stories for the next unstarted milestone
   (if blocked) /spike          — extract a time-boxed investigation spike
7. /spec                        — write a developer-ready technical spec for a story
```

## Rules

- A single person can act as both PM and Dev.
- Each step produces an artifact (Confluence page, Jira ticket) that the next step consumes.
- If the user appears to be skipping a step, ask: "Looks like you're skipping [step X] — continue anyway, or do that first?"
- Never silently block. Never silently proceed past a potential sequence issue.

## Artifacts produced per step

| Step | Artifact |
|---|---|
| Create Jira Feature | Jira Feature ticket |
| grill-me | Shared understanding (no artifact) |
| to-prd | Confluence PRD page |
| prototype | Running code or UI variations |
| handoff | Handoff doc |
| prd-to-ppp | Confluence PPP page |
| milestones | Milestones table on PPP |
| milestones-to-issues | Jira Story tickets |
| spike | Confluence spec page + Jira spike story + PPP row |
| spec | `ppp_specs/<issue-key>.md` |
