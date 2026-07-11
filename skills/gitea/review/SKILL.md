---
name: gitea-review
description: Push current branch to local Gitea, create or update a PR, open it for review, and wait for feedback. When changes are requested, stops and asks the user whether to address them in this session or a new cmux Claude session.
---

Push agent changes to local Gitea for human review before merging to origin. Handles both first-time PR creation and re-review after addressing comments.

## Prerequisites
Run `/gitea-setup` first if this repo isn't configured yet.

## Config
- Gitea URL: `http://localhost:4000`
- API token: `3a28ca146ab73541632ffb9f28378792b3d8b675`
- Skill dir: `~/.claude/skills/gitea-review/`

---

## Step 1 — Generate session handoff

Run the `/handoff` skill now, focused on "addressing Gitea PR review comments".
Hold the saved file path as `$HANDOFF_FILE`.

**Do not skip this step.** The handoff becomes part of the PR description and seeds future sessions if needed.

---

## Step 2 — Resolve context

```bash
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
CURRENT_BRANCH=$(git branch --show-current)
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
  | sed 's@^refs/remotes/origin/@@' || echo "main")
GITEA_TOKEN="3a28ca146ab73541632ffb9f28378792b3d8b675"
```

---

## Step 3 — Push branch to local Gitea

```bash
git push local "$CURRENT_BRANCH"
```

---

## Step 4 — Create or update PR

Check for existing PR on this branch:
```bash
EXISTING_PR=$(tea pr list \
  --repo "ametku/$REPO_NAME" \
  --login local-gitea \
  --output json 2>/dev/null \
  | python3 -c "
import sys, json
try:
    prs = json.load(sys.stdin)
except: prs = []
branch = '$CURRENT_BRANCH'
pr = next((p for p in prs if p.get('head',{}).get('ref') == branch or p.get('head',{}).get('label','').endswith(branch)), None)
print(pr['number'] if pr else '')
" 2>/dev/null || echo "")
```

**If no existing PR**, create one. Build PR body from git log + handoff:
```bash
TITLE=$(git log -1 --format="%s")
COMMITS=$(git log "${DEFAULT_BRANCH}..HEAD" --oneline 2>/dev/null || git log -5 --oneline)
HANDOFF_CONTENT=$(cat "$HANDOFF_FILE")

PR_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/v1/repos/ametku/$REPO_NAME/pulls" \
  -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json, sys
body = '''## Changes\n''' + '''$COMMITS''' + '''\n\n---\n\n## Session Context\n''' + open('$HANDOFF_FILE').read()
print(json.dumps({'title': '$TITLE', 'body': body, 'head': '$CURRENT_BRANCH', 'base': '$DEFAULT_BRANCH'}))
")")

PR_NUMBER=$(echo "$PR_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('number',''))")
```

**If PR exists**, push a comment and set `PR_NUMBER=$EXISTING_PR`:
```bash
curl -s -X POST "http://localhost:4000/api/v1/repos/ametku/$REPO_NAME/issues/$EXISTING_PR/comments" \
  -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"Changes pushed — ready for re-review."}'
PR_NUMBER=$EXISTING_PR
```

---

## Step 5 — Open PR in browser

```bash
open "http://localhost:4000/ametku/$REPO_NAME/pulls/$PR_NUMBER"
```

---

## Step 6 — Poll for review status using Monitor

Use the **Monitor tool** to run the poll script and watch for status events:

```bash
~/.claude/skills/gitea-review/poll.sh "$REPO_NAME" "$PR_NUMBER"
```

The script emits one of:
- `CHANGES_REQUESTED:<review_id>` followed by comment lines
- `APPROVED`

Keep the Monitor running. Do not exit until one of these events arrives.

---

## Step 7 — Handle review outcome

### On `CHANGES_REQUESTED`:

Collect all output lines from the Monitor until the stream ends.

Parse the comments from poll.sh output:
- `REVIEW_BODY:<text>` — top-level review comment
- `FILE:<path>:LINE:<n>` + `COMMENT:<text>` — inline code comment

**Display the review comments clearly** to the user — formatted as a readable list of files and comments.

Then **ask the user what to do next** using AskUserQuestion with two options:

```
Question: "Review comments received on PR #<N>. How do you want to address them?"

Option 1: "Address in this session"
  description: "I'll work through the comments here and push updates when done."

Option 2: "Open new Claude session"
  description: "Open a fresh Claude terminal via cmux preloaded with the review context."
```

**If user picks Option 1:**
- Stay in the current session
- Present the comments as a task list for the user to direct
- Do not make any code changes automatically — wait for the user's instruction

**If user picks Option 2:**
- Build a handoff file at `/tmp/gitea-re-review-<REPO>-<PR>.md` with:
  ```
  # Gitea Review Handoff — PR #<PR_NUMBER>

  ## Review Comments
  PR: http://localhost:4000/ametku/<REPO>/pulls/<PR_NUMBER>

  ### Reviewer Notes
  <REVIEW_BODY>

  ### Inline Comments
  <FILE + LINE + COMMENT blocks>

  ---

  ## Original Context
  <contents of $HANDOFF_FILE>

  ---

  ## Instructions
  1. Address every comment above
  2. Commit using conventional commit format
  3. Run `/gitea-review` to push updates for re-review
  ```
- Run the open-session script to spawn a new cmux pane:
  ```bash
  WORKSPACE_ID=$(cmux identify --json | python3 -c 'import sys,json; print(json.load(sys.stdin)["workspace"])')
  NEW_SURFACE=$(cmux new-pane --workspace "$WORKSPACE_ID" --type terminal --direction right --focus true | grep -o 'surface:[^ ]*')
  cmux send --surface "$NEW_SURFACE" "cat '/tmp/gitea-re-review-<REPO>-<PR>.md' | claude\n"
  ```
- Print the surface ref and handoff path

### On `APPROVED`:

Print:
```
✓ PR #<N> approved.
Next step: git push origin <branch>
```

Exit cleanly.
