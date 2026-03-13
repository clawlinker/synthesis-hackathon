# Cron Status

_Auto-updated by autonomous sessions. Check GitHub commit history for `🤖 [auto]` prefix._

## Active Crons

| Cron | Model | Schedule (UTC) | Purpose |
|------|-------|----------------|---------|
| synthesis-autonomous | bankr/gemini-3-flash | 09:30, 15:30, 21:30 | Pick task, execute, commit |
| synthesis-ideation | bankr/gemini-3-flash | 10:00, 18:00 (Lisbon) | Generate new ideas |
| daily-cleanup | bankr/qwen3-coder | 06:00 | Disk/memory hygiene |
| a2a-tasks-check | bankr/qwen3-coder | every 3h | Customer order checks |
| memory-garden | anthropic/sonnet | 08:00, 20:00 (Lisbon) | Vector index rebuild |

## Run Log

| Time (UTC) | Cron | Status | What it did |
|------------|------|--------|-------------|
| _waiting for first run_ | | | |

## Known Issues / Watchdog Fixes

_None yet_
