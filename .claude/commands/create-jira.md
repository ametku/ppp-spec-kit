---
name: create-jira
description: Create a Jira ticket under a parent feature from a title and description. Use when you have a fully defined story to create.
---

Create a Jira ticket using the provided title and description.

## Defaults

- Project: NR
- Type: Story
- URL: https://new-relic.atlassian.net
- Username: ametku@newrelic.com
- Token: read from environment variable $JIRA_API_TOKEN

## Input

`$ARGUMENTS` should contain:
- `--title`: the story title
- `--parent`: the parent feature key (e.g., NR-510278)
- `--description`: the story description / acceptance criteria

## Execution

Run:

```
node .claude/commands/ppp-spec-kit/scripts/create-jira-ticket.js \
  --title "<title>" \
  --description "<description>" \
  --project NR \
  --type Story \
  --url https://new-relic.atlassian.net \
  --username ametku@newrelic.com \
  --token "$JIRA_API_TOKEN" \
  --parent "<parent key>"
```

Report the created ticket key and URL.

The input: $ARGUMENTS
