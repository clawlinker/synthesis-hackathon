#!/usr/bin/env python3
"""
Bankr LLM cost tracker for autonomous cron sessions.
Records start/end credits and calculates delta for agent_log.json.
"""

import json
import subprocess
import sys
import os
from datetime import datetime

LOG_FILE = "/root/synthesis-hackathon/agent_log.json"


def get_credits():
    """Fetch current Bankr LLM credits via CLI."""
    try:
        result = subprocess.run(
            ["bankr", "llm", "credits"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode != 0:
            return None
        # Parse output - extract credit balance line
        for line in result.stdout.split('\n'):
            if 'Credit Balance:' in line:
                amount_str = line.split('$')[-1].strip()
                return float(amount_str)
        return None
    except Exception as e:
        return None


def load_log():
    """Load agent_log.json."""
    try:
        with open(LOG_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        return []


def save_log(data):
    """Save to agent_log.json."""
    with open(LOG_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def record_start():
    """Record start credits."""
    credits = get_credits()
    if credits is not None:
        data = {"bankr_start_credits": credits, "timestamp": datetime.utcnow().isoformat()}
        with open("/tmp/bankr-credits-start.json", 'w') as f:
            json.dump(data, f, indent=2)
        return credits
    return None


def record_end_and_log():
    """Calculate delta and append to agent_log.json."""
    # Load start credits
    try:
        with open("/tmp/bankr-credits-start.json", 'r') as f:
            start_data = json.load(f)
        start_credits = start_data.get("bankr_start_credits")
    except Exception:
        print("No start credits recorded")
        return None

    # Get end credits
    end_credits = get_credits()
    if end_credits is None:
        print("Could not fetch end credits")
        return None

    delta = start_credits - end_credits if start_credits else None

    # Update last log entry with compute_budget
    data = load_log()
    if data and delta is not None:
        # Find last entry without compute_budget
        for entry in reversed(data):
            if "compute_budget" not in entry:
                entry["compute_budget"] = {
                    "session_cost_usd": round(delta, 4),
                    "daily_budget_usd": 0.50,
                    "remaining_usd": round(end_credits, 2)
                }
                # Remove temp file
                if os.path.exists("/tmp/bankr-credits-start.json"):
                    os.remove("/tmp/bankr-credits-start.json")
                save_log(data)
                print(f"Bankr LLM cost tracked: ${delta:.4f} used, ${end_credits:.2f} remaining")
                return delta

    # Clean up temp file
    if os.path.exists("/tmp/bankr-credits-start.json"):
        os.remove("/tmp/bankr-credits-start.json")

    return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: bankr-cost-tracker.py [start|end]")
        sys.exit(1)

    action = sys.argv[1]
    if action == "start":
        record_start()
    elif action == "end":
        record_end_and_log()
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)
