#!/usr/bin/env bash
# Cron runner with auto-append to agent_log.json
# Usage: cron-runner.sh <cron_name> <description> <command>

set -euo pipefail

CRON_NAME="$1"
DESCRIPTION="$2"
 shift 2 || true
COMMAND="$*"

LOG_FILE="/root/synthesis-hackathon/agent_log.json"
WORKSPACE="/root/synthesis-hackathon"

# Get git commit hash
COMMIT=$(cd "$WORKSPACE" && git rev-parse --short HEAD 2>/dev/null || echo "")

# Run the command and capture exit status
set +e
OUTPUT=$(eval "$COMMAND" 2>&1)
EXIT_CODE=$?
set -e

# Determine outcome
if [ $EXIT_CODE -eq 0 ]; then
    OUTCOME="success"
else
    OUTCOME="failed"
fi

# Tools used (hardcoded for each cron - should be updated per cron)
case "$CRON_NAME" in
    "synthesis-autonomous")
        TOOLS='["read", "write", "exec", "edit"]'
        ARTIFACTS='[]'
        MODEL_COST=0.01
        ;;
    "synthesis-build-guard")
        TOOLS='["exec", "read", "edit"]'
        ARTIFACTS='[]'
        MODEL_COST=0.002
        ;;
    "synthesis-code-review")
        TOOLS='["read", "exec"]'
        ARTIFACTS='["REVIEW-LOG.md"]'
        MODEL_COST=0.003
        ;;
    "synthesis-self-review")
        TOOLS='["read", "exec", "edit"]'
        ARTIFACTS='["DECISIONS.md", "AUTONOMOUS-LOOP.md"]'
        MODEL_COST=0.002
        ;;
    "synthesis-daily-summary")
        TOOLS='["read"]'
        ARTIFACTS='[]'
        MODEL_COST=0.001
        ;;
    "synthesis-strategy-check")
        TOOLS='["read", "exec", "edit"]'
        ARTIFACTS='["DECISIONS.md", "AUTONOMOUS-LOOP.md"]'
        MODEL_COST=0.003
        ;;
    *)
        TOOLS='["read", "exec"]'
        ARTIFACTS='[]'
        MODEL_COST=0.002
        ;;
esac

# Log entry
python3 << PYTHON_EOF
import json
import datetime

log_file = "$LOG_FILE"
cron_name = "$CRON_NAME"
description = "$DESCRIPTION"
tools_json = "$TOOLS"
decision = "$DESCRIPTION"
outcome = "$OUTCOME"
artifacts_json = "$ARTIFACTS"
commit = "$COMMIT"
model_cost = $MODEL_COST
exit_code = $EXIT_CODE

# Load existing log
with open(log_file, 'r') as f:
    data = json.load(f)

# Build entry
entry = {
    "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "phase": "cron",
    "cron": cron_name,
    "description": description,
    "tools_used": json.loads(tools_json),
    "model": "bankr/qwen3-coder",
    "model_cost_usd": model_cost,
    "decision": decision,
    "outcome": outcome,
    "artifacts": json.loads(artifacts_json),
    "command_exit_code": exit_code
}

if commit:
    entry["commit"] = commit

# Append and write
data.append(entry)
with open(log_file, 'w') as f:
    json.dump(data, f, indent=2)
PYTHON_EOF

# Output result
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ $CRON_NAME - success"
else
    echo "❌ $CRON_NAME - failed (exit $EXIT_CODE)"
fi

# Exit with original code
exit $EXIT_CODE
