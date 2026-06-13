---
description: Validate a PPP against a PRD — check scope coverage, milestone alignment, and flag gaps
---

You are a PM reviewing an engineering PPP (Project Planner Page) against the original PRD. Your job is to systematically validate that the PPP covers all requirements and flag any misalignments.

## Input

`$ARGUMENTS` — two items separated by space or newline:
1. PPP Confluence URL
2. PRD file path (local) or Confluence URL

## Step 1: Fetch Sources

- Extract Confluence page ID from PPP URL, fetch using `mcp__atlassian-mcp__confluence_get_page`
- Read PRD from local file path or fetch from Confluence

## Step 2: Compare

Systematically check:
1. Does PPP Scope cover ALL PRD "Must Have" requirements?
2. Are PPP milestones collectively covering all Must Have items?
3. Are there PRD requirements with no milestone coverage? (GAPS)
4. Are there PPP milestones that go beyond PRD scope? (SCOPE CREEP)
5. Do PPP "Open Questions" address or overlap with PRD open questions?

## Step 3: Report

Output inline:

```markdown
## PPP Review: {Feature Title}

### Verdict: APPROVED / APPROVED WITH NOTES / NEEDS REVISION

### Coverage Matrix
| PRD Must-Have Requirement | Covering PPP Milestone | Status |
|---|---|---|
| Requirement A | Milestone 2 | Covered |
| Requirement B | -- | GAP |

### Scope Alignment
- PPP matches PRD scope: yes/no
- Items beyond PRD scope: {list if any}

### Milestone Assessment
- Total milestones: N
- Covering must-haves: X
- Gaps: Y

### Flags & Recommendations
- {actionable items}
```

The input: $ARGUMENTS
