# ppp-spec-kit

A Claude Code plugin that codifies the PM-to-Dev feature delivery workflow as skills and commands. Confluence PPP (Project Planner Page) is the source of truth for project milestones and scope. Jira is the issue tracker.

## Workflow

```
PM Flow:
  /grillme → /to-prd → (/prototype → /handoff) → /review-and-approve-ppp

Dev Flow:
  /prd-to-ppp → /milestones (refine) → /milestones-to-issues (repeat per milestone)
                                 ↕
                              /spike (when blocked)
```

### PM Persona

1. **`/grillme`** — Start here. Stress-test a feature idea by getting grilled on every branch of the decision tree.
2. **`/to-prd`** — Synthesize the conversation into a formal PRD. No interviewing — just captures what's already known.
3. **`/prototype`** — Build throwaway code to validate a specific aspect (logic or UI) before committing.
4. **`/handoff`** — Compact the session into a portable context doc for the next agent/session to pick up.
5. **`/review-and-approve-ppp`** — Validate the engineering PPP against the PRD. Produces a coverage matrix and flags gaps.

### Dev Persona

6. **`/prd-to-ppp`** — Take a PRD and produce a PPP with validated scope and dev-oriented milestones.
7. **`/milestones`** — Interactively refine milestones by walking the decision tree. Outputs PPP-ready content.
8. **`/milestones-to-issues`** — Read the PPP, pick the first NOT STARTED milestone, break it into vertical-slice Jira stories.
9. **`/spike`** — When a decision is blocked by missing information, file a time-boxed Jira investigation and mark it as a PPP blocker.

### Utility

10. **`/create-jira`** — Low-level command to create a single Jira ticket. Used internally by other skills.
11. **`/setup-check`** — Verify all prerequisites are in place (MCPs, credentials, config). Run this first in a new environment.

## How Skills and Commands Differ

| | Skills | Commands |
|---|---|---|
| Location | `.claude/skills/{name}/SKILL.md` | `.claude/commands/{name}.md` |
| Invocation | Agent-triggered based on context OR user-invoked | User-invoked only via `/name` |
| Has `name:` field | Yes | No |
| Proactive | Yes — agent detects "grill me", "prototype this", etc. | No — must be explicitly called |

## Structure

```
ppp-spec-kit/
├── skills/                              # Agent-triggered
│   ├── grillme/SKILL.md                 # Adversarial Q&A on a plan or design
│   ├── to-prd/SKILL.md                  # Conversation → PRD
│   ├── prototype/                       # Throwaway code to answer a question
│   │   ├── SKILL.md                     #   Router (logic vs UI)
│   │   ├── LOGIC.md                     #   Terminal TUI for state/logic
│   │   └── UI.md                        #   Multi-variant UI switcher
│   ├── handoff/SKILL.md                 # Session → portable context doc
│   ├── milestones/SKILL.md              # Interview → PPP milestones
│   ├── milestones-to-issues/SKILL.md    # PPP milestone → Jira stories
│   ├── spike/SKILL.md                   # Blocked decision → Jira spike ticket
│   └── setup-check/SKILL.md             # Verify prerequisites (MCPs, creds, config)
├── commands/                            # User-invoked only
│   ├── review-and-approve-ppp.md        # Validate PPP vs PRD
│   ├── prd-to-ppp.md                    # PRD → PPP content
│   └── create-jira.md                   # Create a single Jira ticket
├── scripts/
│   └── create-jira-ticket.js            # Node script for Jira REST API
├── templates/
│   ├── ppp-template.md                  # PPP section reference
│   ├── prd-template.md                  # PRD section reference
│   └── CLAUDE.local.json.template       # Per-project config template
├── CLAUDE.md                            # AI agent behavioral contract
└── README.md
```

## Installation

From your project root:

```bash
# Copy skills (agent-triggered)
cp -r ppp-spec-kit/skills/ .claude/skills/ppp-spec-kit/

# Copy commands (user-invoked)
cp -r ppp-spec-kit/commands/ .claude/commands/ppp-spec-kit/

# Copy scripts (used by create-jira)
mkdir -p .claude/commands/ppp-spec-kit/scripts/
cp ppp-spec-kit/scripts/create-jira-ticket.js .claude/commands/ppp-spec-kit/scripts/

# Create your local config
cp ppp-spec-kit/templates/CLAUDE.local.json.template CLAUDE.local.json
# Edit CLAUDE.local.json and fill in teamId, teamName, jiraProjectKey, confluenceSpaceKey, confluenceParentPageId
```

Commands invoke as `/ppp-spec-kit/review-and-approve-ppp`, `/ppp-spec-kit/prd-to-ppp`, etc.

Skills are triggered proactively by the agent when context matches (e.g. user says "grill me" or "prototype this").

After installing, run `/setup-check` to verify everything is configured correctly.

## Prerequisites

- Claude Code CLI
- **Superpowers plugin** installed: `superpowers@claude-plugins-official` (provides brainstorming, debugging, TDD, and other foundational skills that this plugin builds on)
- MCP tools configured:
  - `atlassian-mcp` (Confluence + Jira access)
- Environment variable: `$JIRA_API_TOKEN`
- Node.js >= 14 (for Jira ticket creation script)
- `CLAUDE.local.json` in your project root (copy from `templates/CLAUDE.local.json.template`)

## Typical Session Examples

### PM starting a new feature
```
> "I have an idea for custom widgets support. Grill me."
  → agent invokes /grillme, interviews relentlessly
> "/to-prd"
  → synthesizes into PRD, publishes to issue tracker
> "/prototype"
  → builds throwaway UI variants to validate the design
> "/handoff prototyping results for engineering"
  → compacts session for next agent
```

### Dev planning implementation
```
> "/ppp-spec-kit/prd-to-ppp ./temp/prd-custom-widgets.md"
  → produces PPP with scope + milestones
> "refine milestones"
  → agent invokes /milestones, interviews for better phasing
> "create issues for the next milestone"
  → agent invokes /milestones-to-issues, reads PPP, creates Jira stories
> "I'm not sure if NerdStorage can handle this payload size"
  → agent invokes /spike, files time-boxed investigation
```

### PM reviewing engineering plan
```
> "/ppp-spec-kit/review-and-approve-ppp https://confluence.../PPP https://confluence.../PRD"
  → coverage matrix, gaps, verdict
```
