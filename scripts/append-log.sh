#!/usr/bin/env bash
# Append an entry to agent_log.json safely
# Usage: append-log.sh <phase> <action> <description> <tools_json> <decision> <outcome> <artifacts_json> [commit_hash]

set -euo pipefail

LOG_FILE="/root/synthesis-hackathon/agent_log.json"
PHASE="${1:-execute}"
ACTION="${2:-unknown}"
DESCRIPTION="${3:-no description}"
TOOLS_JSON="${4:-[]}"
DECISION="${5:-no decision}"
OUTCOME="${6:-success}"
ARTIFACTS_JSON="${7:-[]}"
COMMIT="${8:-}"

if [[ ! -f "$LOG_FILE" ]]; then
    echo "[] > $LOG_FILE"
    echo "[]" > "$LOG_FILE"
fi

python3 << PYTHON_EOF
import json
import datetime

log_file = "$LOG_FILE"
phase = "$PHASE"
action = "$ACTION"
description = "$DESCRIPTION"
tools_json = "$TOOLS_JSON"
decision = "$DECISION"
outcome = "$OUTCOME"
artifacts_json = "$ARTIFACTS_JSON"
commit = "$COMMIT"

# Load existing log
with open(log_file, 'r') as f:
    data = json.load(f)

# Build entry
entry = {
    "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "phase": phase,
    "action": action,
    "description": description,
    "tools_used": json.loads(tools_json),
    "model": "bankr/qwen3-coder",
    "model_cost_usd": 0.01,
    "decision": decision,
    "outcome": outcome,
    "artifacts": json.loads(artifacts_json)
}

if commit:
    entry["commit"] = commit

# Append and write
data.append(entry)
with open(log_file, 'w') as f:
    json.dump(data, f, indent=2)
PYTHON_EOF
