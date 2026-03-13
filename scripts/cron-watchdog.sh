#!/bin/bash
# Watchdog: verify repo health after cron runs
# Run manually or add to daily-cleanup

REPO="/root/synthesis-hackathon"
ERRORS=0

# Check repo exists
if [ ! -d "$REPO/.git" ]; then
  echo "❌ Repo missing at $REPO"
  exit 1
fi

cd "$REPO"

# Check for uncommitted changes (cron forgot to commit)
DIRTY=$(git status --porcelain | wc -l)
if [ "$DIRTY" -gt 0 ]; then
  echo "⚠️ Uncommitted changes found ($DIRTY files) — auto-committing"
  git add -A && git commit -m "🤖 [watchdog] Auto-commit uncommitted changes" && git push
  ERRORS=$((ERRORS + 1))
fi

# Check agent_log.json is valid JSON
if ! jq . "$REPO/agent_log.json" > /dev/null 2>&1; then
  echo "❌ agent_log.json is broken — restoring from last commit"
  git checkout HEAD -- agent_log.json
  ERRORS=$((ERRORS + 1))
fi

# Check for unpushed commits
UNPUSHED=$(git log origin/main..HEAD --oneline | wc -l)
if [ "$UNPUSHED" -gt 0 ]; then
  echo "⚠️ $UNPUSHED unpushed commits — pushing now"
  git push
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -eq 0 ]; then
  echo "✅ Repo healthy"
else
  echo "⚠️ Fixed $ERRORS issues"
fi
