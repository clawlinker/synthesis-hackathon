#!/usr/bin/env bash
# Cron runner with auto-append to agent_log.json
# Usage: cron-runner.sh <cron_name> <description> <command>

set -euo pipefail

CRON_NAME="$1"
DESCRIPTION="$2"
shift 2 || true
COMMAND="$*"

# Track Bankr LLM credits at start
python3 /root/synthesis-hackathon/scripts/bankr-cost-tracker.py start 2>/dev/null || true

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
        TOOLS_JSON='["read","write","exec","edit"]'
        ARTIFACTS_JSON='[]'
        MODEL_COST=0.01
        ;;
    "synthesis-build-guard")
        TOOLS_JSON='["exec","read","edit"]'
        ARTIFACTS_JSON='[]'
        MODEL_COST=0.002
        ;;
    "synthesis-code-review")
        TOOLS_JSON='["read","exec"]'
        ARTIFACTS_JSON='["REVIEW-LOG.md"]'
        MODEL_COST=0.003
        ;;
    "synthesis-self-review")
        TOOLS_JSON='["read","exec","edit"]'
        ARTIFACTS_JSON='["DECISIONS.md","AUTONOMOUS-LOOP.md"]'
        MODEL_COST=0.002
        ;;
    "synthesis-daily-summary")
        TOOLS_JSON='["read"]'
        ARTIFACTS_JSON='[]'
        MODEL_COST=0.001
        ;;
    "synthesis-strategy-check")
        TOOLS_JSON='["read","exec","edit"]'
        ARTIFACTS_JSON='["DECISIONS.md","AUTONOMOUS-LOOP.md"]'
        MODEL_COST=0.003
        ;;
    *)
        TOOLS_JSON='["read","exec"]'
        ARTIFACTS_JSON='[]'
        MODEL_COST=0.002
        ;;
esac

# Log entry
python3 - "$LOG_FILE" "$CRON_NAME" "$DESCRIPTION" "$TOOLS_JSON" "$OUTCOME" "$ARTIFACTS_JSON" "$COMMIT" "$MODEL_COST" "$EXIT_CODE" << 'PYTHON_EOF'
import json
import sys
import datetime

log_file = sys.argv[1]
cron_name = sys.argv[2]
description = sys.argv[3]
tools_json = sys.argv[4]
outcome = sys.argv[5]
artifacts_json = sys.argv[6]
commit = sys.argv[7]
model_cost = float(sys.argv[8])
exit_code = int(sys.argv[9])

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
    "decision": description,
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

print(f"Logged entry: {cron_name} - {outcome}")
PYTHON_EOF

# Output result
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ $CRON_NAME - success"
else
    echo "❌ $CRON_NAME - failed (exit $EXIT_CODE)"
fi

# Record Bankr LLM cost at end
python3 /root/synthesis-hackathon/scripts/bankr-cost-tracker.py end 2>/dev/null || true

# Exit with original code
exit $EXIT_CODE
