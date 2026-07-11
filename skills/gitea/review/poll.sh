#!/usr/bin/env bash
# poll.sh — polls a Gitea PR for review status changes
# Usage: ./poll.sh <repo_name> <pr_number>
# Outputs structured event lines; exits when status changes.
set -euo pipefail

REPO=$1
PR_NUMBER=$2
GITEA_TOKEN="3a28ca146ab73541632ffb9f28378792b3d8b675"
GITEA_URL="http://localhost:4000"
POLL_INTERVAL=20

echo "POLLING:PR #$PR_NUMBER on $GITEA_URL/ametku/$REPO/pulls/$PR_NUMBER"

while true; do
  REVIEWS=$(curl -sf \
    -H "Authorization: token $GITEA_TOKEN" \
    "$GITEA_URL/api/v1/repos/ametku/$REPO/pulls/$PR_NUMBER/reviews" 2>/dev/null || echo "[]")

  RESULT=$(echo "$REVIEWS" | python3 -c "
import sys, json
try:
    reviews = json.load(sys.stdin)
except:
    print('ERROR:failed to parse reviews')
    sys.exit(0)
states = [(r.get('id'), r.get('state','')) for r in reviews]
for rid, state in reversed(states):
    if state == 'REQUEST_CHANGES':
        print(f'CHANGES_REQUESTED:{rid}')
        sys.exit(0)
    if state == 'APPROVED':
        print('APPROVED')
        sys.exit(0)
print('PENDING')
" 2>/dev/null || echo "PENDING")

  if [[ "$RESULT" == CHANGES_REQUESTED:* ]]; then
    REVIEW_ID="${RESULT#CHANGES_REQUESTED:}"

    # Fetch inline comments for this review
    INLINE=$(curl -sf \
      -H "Authorization: token $GITEA_TOKEN" \
      "$GITEA_URL/api/v1/repos/ametku/$REPO/pulls/$PR_NUMBER/reviews/$REVIEW_ID/comments" \
      2>/dev/null || echo "[]")

    # Fetch review body
    REVIEW_BODY=$(echo "$REVIEWS" | python3 -c "
import sys, json
reviews = json.load(sys.stdin)
r = next((r for r in reviews if str(r.get('id')) == '$REVIEW_ID'), {})
print(r.get('body','').strip())
" 2>/dev/null || echo "")

    INLINE_COMMENTS=$(echo "$INLINE" | python3 -c "
import sys, json
try:
    comments = json.load(sys.stdin)
except:
    sys.exit(0)
for c in comments:
    path = c.get('path','')
    line = c.get('line','')
    body = c.get('body','').strip()
    if body:
        print(f'FILE:{path}:LINE:{line}')
        print(f'COMMENT:{body}')
        print('---')
" 2>/dev/null || echo "")

    echo "CHANGES_REQUESTED:$REVIEW_ID"
    echo "REVIEW_BODY:$REVIEW_BODY"
    echo "$INLINE_COMMENTS"
    exit 0

  elif [[ "$RESULT" == "APPROVED" ]]; then
    echo "APPROVED"
    exit 0
  fi

  sleep "$POLL_INTERVAL"
done
