#!/usr/bin/env python3
"""Bankr LLM cost tracker for autonomous sessions."""

import subprocess
import json
import os
import re
from datetime import datetime

LOG_FILE = "/root/synthesis-hackathon/agent_log.json"
METADATA_FILE = "/root/synthesis-hackathon/.bankr-cost-cache.json"

def get_credits():
    """Run bankr llm credits and parse output."""
    try:
        result = subprocess.run(
            ["bankr", "llm", "credits"],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            return None, None, "command failed"
        return result.stdout, result.stderr, None
    except Exception as e:
        return None, None, str(e)

def parse_credits_output(output):
    """Parse bankr llm credits output to extract remaining balance."""
    # Look for lines like "Remaining: $182.45"
    match = re.search(r"Remaining:\s*\$?\s*([\d,.]+)", output)
    if match:
        return float(match.group(1).replace(",", ""))
    return None

def get_previous_balance():
    """Get cached previous balance."""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r') as f:
                data = json.load(f)
                return data.get("balance")
        except:
            pass
    return None

def save_balance(balance):
    """Save current balance to cache."""
    with open(METADATA_FILE, 'w') as f:
        json.dump({"balance": balance, "timestamp": datetime.utcnow().isoformat()}, f, indent=2)

def run_cron_with_cost_tracking(cron_name, description, tools_used, artifacts, outcome="success"):
    """Run a cron command with cost tracking, append to log."""
    # Get starting balance
    start_output, start_err, start_error = get_credits()
    if start_error:
        start_balance = None
    else:
        start_balance = parse_credits_output(start_output)
    
    # Run the actual cron command
    cmd = os.environ.get("CRON_CMD", "")
    if not cmd:
        print(f"ERROR: CRON_CMD not set")
        return
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    # Get ending balance
    end_output, end_err, end_error = get_credits()
    if end_error:
        end_balance = None
    else:
        end_balance = parse_credits_output(end_output)
    
    # Calculate cost
    if start_balance is not None and end_balance is not None:
        cost = round(start_balance - end_balance, 4)
    else:
        cost = None
    
    # Build entry
    entry = {
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": "cron",
        "cron": cron_name,
        "description": description,
        "tools_used": tools_used,
        "model": "bankr/qwen3-coder",
        "model_cost_usd": 0.01,
        "bankr_credits_start": start_balance,
        "bankr_credits_end": end_balance,
        "bankr_cost_usd": cost,
        "decision": description,
        "outcome": outcome,
        "artifacts": artifacts,
        "compute_budget": {
            "daily_budget_usd": 7.70,
            "total_budget_usd": 190,
            "days_remaining": 8,
            "projected_total_usd": 62
        }
    }
    
    if result.returncode == 0:
        entry["command_stdout"] = result.stdout[:500] if result.stdout else None
    else:
        entry["command_stderr"] = result.stderr[:500] if result.stderr else None
        entry["outcome"] = "failed"
        entry["returncode"] = result.returncode
    
    # Append to log
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            data = json.load(f)
    else:
        data = []
    
    data.append(entry)
    with open(LOG_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    # Save balance for next time
    save_balance(end_balance)
    
    # Output for cron
    print(f"✅ {cron_name} - outcome: {outcome}")
    if cost is not None:
        print(f"💰 Cost: ${cost:.4f}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 5:
        print("Usage: bankr-cost-tracker.py <cron_name> <description> <tools_json> <artifacts_json> [cmd]")
        sys.exit(1)
    
    cron_name = sys.argv[1]
    description = sys.argv[2]
    tools_json = sys.argv[3]
    artifacts_json = sys.argv[4]
    
    run_cron_with_cost_tracking(
        cron_name=cron_name,
        description=description,
        tools_used=json.loads(tools_json),
        artifacts=json.loads(artifacts_json)
    )
