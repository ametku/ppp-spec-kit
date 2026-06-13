# ppp-spec-kit

This repo codifies a feature delivery workflow where documentation is the source of truth. The goal: stakeholder transparency. Decisions and scope live in artifacts (PRD, PPP, Jira) — not in people's heads.

**PPP = Project Planner Page** (internal term). Never expand it as "Plan, Progress, Problems" or any other form.

## Canonical Workflow

A single person can act as both PM and Dev. The sequence is:

```
1. Create Jira Feature
2. /grill-me → /to-prd → (optional: /prototype → /handoff)
3. /prd-to-ppp
4. /milestones  (refine)
5. /milestones-to-issues  (repeat per milestone; use /spike if blocked)
```

Each skill contains its own detailed instructions. You don't need to repeat them.

## Your Role

- Understand where the user is in the sequence above.
- If the user appears to be skipping a step, **ask**: "Looks like you're skipping [step X] — do you want to continue anyway, or do that first?"
- Never silently block. Never silently proceed past a potential sequence issue.

## Environment

On first interaction in a session, suggest the user run `/setup-check` if the environment hasn't been verified yet. Setup requires `atlassian-mcp`, `$JIRA_API_TOKEN`, Node.js >= 14, the superpowers plugin, and a `CLAUDE.local.json` in the project root.
