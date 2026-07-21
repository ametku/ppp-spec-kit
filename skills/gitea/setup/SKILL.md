---
name: gitea-setup
description: Set up the current git repo for local Gitea review workflow. Checks Gitea is running, creates the remote repo on Gitea, adds `local` remote, configures tea CLI, and syncs default + current branches. Safe to re-run.
argument-hint: "[clean]"
---

Set up the current working directory's git repo for local Gitea review. All steps are idempotent — safe to re-run.

## Arguments

If `$ARGUMENTS` is `clean`: run the **Clean & Resetup** flow before the normal steps.

## Config
- Gitea URL: `http://localhost:4000`
- Gitea user: `ametku`
- Gitea password: `gitea123`
- API token: `3a28ca146ab73541632ffb9f28378792b3d8b675`

---

## Clean & Resetup Flow (only when `$ARGUMENTS` is `clean`)

### C1. Confirm deletion
Ask the user:

> "This will permanently delete the Gitea repo `ametku/<REPO_NAME>` and all its PRs/comments. Type **yes** to delete."

If the user does not confirm, abort with "Cancelled."

### C2. Delete repo from Gitea
```bash
curl -s -X DELETE \
  -H "Authorization: token 3a28ca146ab73541632ffb9f28378792b3d8b675" \
  "http://localhost:4000/api/v1/repos/ametku/$REPO_NAME"
echo "Deleted Gitea repo: ametku/$REPO_NAME"
```

### C3. Remove `local` remote
```bash
git remote remove local 2>/dev/null && echo "Removed remote 'local'" || true
```

### C4. Confirm re-setup
Ask the user separately:

> "Repo deleted. Re-setup Gitea for this repo now? Type **yes** to continue."

If the user does not confirm, stop here with "Done. Run `/gitea-setup` when you're ready to re-setup."

If confirmed, continue with the normal setup steps below.

---

## Steps

### 1. Check Gitea is running
```bash
curl -sf http://localhost:4000/api/v1/version > /dev/null \
  || { echo "ERROR: Gitea not running. Start with: rdctl shell -- docker start gitea"; exit 1; }
```

### 2. Ensure required users exist

For each user in `["developer", "reviewer"]`, check if they exist and create if not:

```bash
for USERNAME in developer reviewer; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token 3a28ca146ab73541632ffb9f28378792b3d8b675" \
    "http://localhost:4000/api/v1/users/$USERNAME")

  if [ "$STATUS" = "200" ]; then
    echo "User '$USERNAME' already exists"
  else
    curl -s -X POST "http://localhost:4000/api/v1/admin/users" \
      -H "Authorization: token 3a28ca146ab73541632ffb9f28378792b3d8b675" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"$USERNAME\",\"email\":\"$USERNAME@localhost\",\"password\":\"gitea123\",\"must_change_password\":false}" > /dev/null \
      && echo "Created user '$USERNAME'" \
      || echo "ERROR: failed to create user '$USERNAME'"
  fi
done
```

### 3. Resolve repo info
```bash
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
  | sed 's@^refs/remotes/origin/@@' \
  || git branch --show-current)
CURRENT_BRANCH=$(git branch --show-current)
```

### 4. Create repo on Gitea if it doesn't exist
Check first:
```bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token 3a28ca146ab73541632ffb9f28378792b3d8b675" \
  "http://localhost:4000/api/v1/repos/ametku/$REPO_NAME")
```

If STATUS is 404, create it:
```bash
curl -s -X POST "http://localhost:4000/api/v1/user/repos" \
  -H "Authorization: token 3a28ca146ab73541632ffb9f28378792b3d8b675" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"auto_init\":false}" > /dev/null
echo "Created repo: http://localhost:4000/ametku/$REPO_NAME"
```

Otherwise print "Repo already exists".

### 5. Add `local` remote if missing
```bash
git remote get-url local 2>/dev/null \
  && echo "Remote 'local' already exists" \
  || { git remote add local "http://ametku:gitea123@localhost:4000/ametku/$REPO_NAME.git"
       echo "Added remote 'local'"; }
```

### 6. Configure tea login if not present
```bash
tea login list 2>/dev/null | grep -q "local-gitea" \
  && echo "tea login already configured" \
  || tea login add \
       --name local-gitea \
       --url http://localhost:4000 \
       --token 3a28ca146ab73541632ffb9f28378792b3d8b675
```

Set this repo to use local-gitea by default for `tea` commands:
```bash
git config tea.serverURL http://localhost:4000
git config tea.token 3a28ca146ab73541632ffb9f28378792b3d8b675
```

### 7. Push default branch + current branch
```bash
git push local "$DEFAULT_BRANCH" 2>&1 | tail -1
```
If current branch differs from default:
```bash
[ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ] \
  && git push local "$CURRENT_BRANCH" 2>&1 | tail -1
```

### 8. Report summary
Print a clear status table: what already existed vs what was just created/pushed.
