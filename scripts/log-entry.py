#!/usr/bin/env python3
import json
import datetime
import sys

if len(sys.argv) < 2:
    print("Usage: log-entry.py <json_file> OR log-entry.py --entry <json_string>")
    sys.exit(1)

if sys.argv[1] == "--entry":
    if len(sys.argv) < 3:
        print("Missing JSON entry string")
        sys.exit(1)
    log_entry = json.loads(sys.argv[2])
else:
    with open(sys.argv[1]) as f:
        log_entry = json.load(f)

f = "/root/synthesis-hackathon/agent_log.json"
d = json.load(open(f))
d.append(log_entry)
open(f, "w").write(json.dumps(d, indent=2))
