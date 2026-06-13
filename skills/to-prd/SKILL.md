---
name: to-prd
description: Turn the current conversation context into a PRD and publish it as a Confluence page under a user-provided parent page. Use when user wants to create a PRD from the current context.
---

This skill takes the current conversation context and codebase understanding and produces a PRD published to Confluence. Do NOT interview the user — just synthesize what you already know.

The user must provide the parent Confluence page URL or ID where the PRD will be created as a child page.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the PRD, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can.

   Check with the user that these seams match their expectations.

3. Derive the feature name from the context. The Confluence page title will be `PRD: <feature name>`.

4. Publish the PRD to Confluence:
   - Call `getAccessibleAtlassianResources` to get the `cloudId`.
   - Call `getConfluencePage` on the user-provided parent page to get the `spaceId`.
   - Search for an existing child page titled `PRD: <feature name>` under the parent using `searchConfluenceUsingCql` (CQL: `title = "PRD: <feature name>" AND parent = <parentId>`).
   - If found: call `updateConfluencePage` with the new content.
   - If not found: call `createConfluencePage` with `parentId` set to the user-provided page ID.
   - Use `contentFormat: "markdown"`.

<prd-template>

---
Title: <derived feature name>
Owner: @Aravind Kumar Metku
Version: 0.1.0
Status: draft
Jira Id: ''
ppp page: 
---

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>
