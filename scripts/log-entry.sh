#!/bin/bash
# Safely append an entry to agent_log.json
# Usage: ./log-entry.sh '{"timestamp":"...","action":"..."}'
LOGFILE="/root/synthesis-hackathon/agent_log.json"
ENTRY="$1"
if [ -z "$ENTRY" ]; then echo "Usage: log-entry.sh '<json>'" && exit 1; fi
echo "$ENTRY" | jq . > /dev/null 2>&1 || { echo "ERROR: Invalid JSON"; exit 1; }
jq --argjson entry "$ENTRY" '.entries += [$entry]' "$LOGFILE" > "${LOGFILE}.tmp" && mv "${LOGFILE}.tmp" "$LOGFILE"
echo "Logged: $(echo "$ENTRY" | jq -r '.action // "unknown"')"
