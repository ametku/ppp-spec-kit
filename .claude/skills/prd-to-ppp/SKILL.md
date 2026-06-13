---
name: prd-to-ppp
description: Create a Project Planner Page (PPP) from a PRD. Extracts scope, copies the team's PPP template, populates it, and publishes to Confluence. Use when the user explicitly provides a PRD and asks to create a PPP from it.
---

> **Workflow reference:** See `.claude/skills/WORKFLOW.md` for the full skill sequence and how this step fits.

# PRD to PPP

Convert a PRD into a Project Planner Page (PPP) published to Confluence.

**PPP = Project Planner Page** (internal term). Never expand it as "Plan, Progress, Problems" or any other form.

`$ARGUMENTS` — PRD file path or Confluence URL.

## Step 1: Read Config

Read `CLAUDE.local.json` from the project root and extract:
- `confluenceParentPageIdPPP` — the parent page under which the new PPP will be created
- `confluencePPPTemplatePageId` — the template page to copy

If either field is missing or empty, stop and tell the user to run `/setup-check`.

## Step 2: Read PRD

If `$ARGUMENTS` is a Confluence URL, extract the page ID and fetch with `mcp__plugin_nr_atlassian-jira__getConfluencePage`. Otherwise read the local file.

Extract and hold for later:
- All open questions listed in the PRD
- All related links, research docs, and references mentioned

## Step 3: Extract and Confirm Scope

From the PRD, pull out every requirement or feature mentioned. Present them as a **raw list** to the user — do not pre-categorize them yourself.

Ask the user to place each item into one of:
- **Must Have** — cannot ship without it
- **Nice to Have** — desirable but not blocking
- **Not in Scope** — explicitly excluded for this version

If the PRD already contains explicit categorization, present it as a draft and ask the user to confirm or move items. Do not accept the PRD's categorization as final — the user must explicitly sign off on all three lists before you proceed.

Do not proceed to Step 4 until the user approves the full scope.

## Step 4: Spike Check

Scan the PRD and confirmed scope for **technical unknowns or blockers** — unverified assumptions, unproven performance claims, unclear API behaviors, or architectural decisions that can't be made without evidence. Ignore basic detail gaps (missing dates, owner names, etc.).

For each technical unknown found, name it clearly and say:
> "This looks like a spike — consider using the `spike` skill to create a time-boxed investigation for: [question]"

If any spikes are identified, ask:
> "Can all milestones be finalized without completing this spike first?"

- **No** → follow the [Draft PPP path](#draft-ppp-path) and stop
- **Yes** (or no spikes found) → continue to Step 5

### Draft PPP path

Get the `cloudId` by calling `mcp__plugin_nr_atlassian-jira__getAccessibleAtlassianResources`.

Copy the PPP template page using `mcp__plugin_nr_atlassian-jira__getConfluencePage` to read the template content (page ID from `confluencePPPTemplatePageId`), then create a new page under `confluenceParentPageIdPPP` with `mcp__plugin_nr_atlassian-jira__createConfluencePage` with title `[Project Plan] {Feature Title} — DRAFT`.

Populate:
- Scope section (from Step 3)
- Milestones section: empty table with note "Pending spike resolution before milestones can be finalized."
- Open Questions table: include spike reference — "Spike: [question] — blocks milestone planning"
- Related Links: PRD link

Tell the user:
> Draft PPP created: [URL]. Once your spike is resolved, return with the PPP URL and spike outcome to continue milestone planning.

Stop here.

## Step 5: Copy Template and Create PPP Page

Get `cloudId` by calling `mcp__plugin_nr_atlassian-jira__getAccessibleAtlassianResources`.

**Always copy the template — never create a PPP from scratch.**

1. Fetch the template page content using `mcp__plugin_nr_atlassian-jira__getConfluencePage` with `pageId` = `confluencePPPTemplatePageId` and `contentFormat: "html"`.
2. Create a new page under `confluenceParentPageIdPPP` using `mcp__plugin_nr_atlassian-jira__createConfluencePage` with:
   - `title`: `[Project Plan] {Feature Title}`
   - `parentId`: value of `confluenceParentPageIdPPP` from config
   - `contentFormat`: `html`
   - `body`: the template page's body content (copied verbatim)

## Step 6: Populate PPP Content

Update the newly created page using `mcp__plugin_nr_atlassian-jira__updateConfluencePage` to fill in:

- **Scope section**: Must Have / Nice to Have / Not in Scope from Step 3
- **Open Questions**: rows extracted from the PRD
- **Related Links**: PRD link + any other links from the PRD
- **Milestones section**: leave empty (will be filled by `/milestones`)

Leave all other template sections (Summary metadata table, CDD/IDD links, etc.) as-is from the template — the user fills those manually.

After updating, share the URL with the user.

## Step 7: Invoke Milestones

Tell the user:
> PPP created: [URL]. Now invoking `/milestones` to build the milestone plan.

Invoke the `/milestones` skill with the newly created PPP page URL as the argument. This keeps milestone refinement in one place and allows it to be re-run independently later.
