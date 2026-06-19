---
name: monitor-pr
description: Monitor one or more PRs for merge readiness. Detects PR URLs/numbers from the conversation if none are provided. Watches CI checks, approvals, and mergeable state — notifies when READY TO MERGE. Use when you want to track a PR after pushing, or to watch several open PRs at once.
---

## Purpose

Monitor PRs for merge readiness. When all checks pass and the PR is approved, announce **READY TO MERGE: <url>**.

## Input

`$ARGUMENTS` may contain:
- One or more PR numbers (e.g. `264`) or full PR URLs
- If empty: scan the conversation for PR URLs from any GitHub host (`source.datanerd.us`, `github.com`, `github.enterprise.host`) and collect all open ones

## Step 1 — Resolve PRs to monitor

**If `$ARGUMENTS` is non-empty:**
Parse each token as either a bare number or a full URL. For bare numbers, infer the repo from the current working directory (`gh repo view --json url`). Build a list of `{number, repo}` pairs.

**If `$ARGUMENTS` is empty:**
Scan the conversation context for PR URLs matching:
```
https://<host>/<org>/<repo>/pull/<number>
```
Extract all unique `{host, org, repo, number}` tuples. For each, check if the PR is still open:
```bash
gh pr view <number> --repo <org>/<repo> --json state --jq '.state'
```
Keep only those where `state == "OPEN"`. If none are found, tell the user no open PRs were detected and stop.

## Step 2 — Check current status for each PR

For each PR run:
```bash
gh pr checks <number> --repo <org>/<repo>
gh pr view <number> --repo <org>/<repo> --json state,mergeable,mergeStateStatus,reviews,labels,url
```

Render a status table per PR:

| Check | Status |
|---|---|
| <check name> | ✅ pass / ⏳ pending / ❌ fail |

Then one of:
- **READY TO MERGE** — all checks pass, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`
- **Blocked: <list what's outstanding>** — pending CI, missing approvals, requested changes, merge conflicts

For already-merged or closed PRs, note that and exclude from monitoring.

## Step 3 — Set up monitoring loop

For each PR that is open but not yet ready:

1. **Arm a persistent Monitor** that polls every 60 seconds:

```bash
while true; do
  labels=$(gh pr view <number> --repo <org>/<repo> --json labels --jq '.labels[].name' 2>/dev/null)
  state=$(gh pr view <number> --repo <org>/<repo> --json state --jq '.state' 2>/dev/null)

  if [ "$state" = "MERGED" ]; then echo "PR_<number>_MERGED"; exit 0; fi
  if [ "$state" = "CLOSED" ]; then echo "PR_<number>_CLOSED"; exit 0; fi

  pending=$(gh pr checks <number> --repo <org>/<repo> 2>&1 | grep -c "pending" || true)
  failing=$(gh pr checks <number> --repo <org>/<repo> 2>&1 | grep -c "fail" || true)

  if [ "$pending" = "0" ] && [ "$failing" = "0" ]; then
    echo "PR_<number>_ALL_CHECKS_DONE"
    exit 0
  fi

  sleep 60
done
```

2. **Self-pace with ScheduleWakeup** — fallback heartbeat 1200s (monitor is the primary wake signal).

3. **On each wakeup or monitor event**, re-run Step 2 for all PRs still open. If a PR transitions to ready, announce:

```
✅ READY TO MERGE: <pr_url>
```

If all monitored PRs are merged/closed/ready, stop the loop (no ScheduleWakeup, TaskStop all monitors).

## Handling multiple PRs

Run checks for all PRs in a single turn before scheduling. Each PR gets its own Monitor task. Use the PR number in the monitor description (e.g. `"PR #264 merge readiness"`) so they're distinguishable in TaskList.

Before arming new monitors, call TaskList to check if monitors are already running for the same PRs (loop re-entries) and skip re-arming those.

## ScheduleWakeup prompt

Always pass the original invocation as the prompt so the loop re-enters this skill:
```
/monitor-pr $ARGUMENTS
```

## Rules

- Never stop watching a PR until it is merged, closed, or explicitly cancelled by the user
- If a check transitions to **failing** (not just pending), immediately surface it: `❌ <check name> failed on PR #<number> — action needed`
- For the `sidekick:approved` check specifically: it requires a human to apply the label — note this clearly so the user knows it's a manual step, not a CI flake
- Use `gh` CLI throughout; do not construct API URLs manually
