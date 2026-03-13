# Autonomous Loop — Let the Agent Cook

_How Clawlinker operates autonomously during The Synthesis hackathon._

## The Concept

The hackathon submission IS the proof of autonomous operation. The agent:
1. **Discovers** what needs building (research, gap analysis)
2. **Plans** approach (task breakdown, priority scoring)
3. **Executes** (code, docs, tests, deployment)
4. **Verifies** (test output, check against bounty criteria)
5. **Submits** (package, document, push to repo)

Max provides direction and review. Clawlinker executes autonomously between check-ins.

## Infrastructure

### Models
| Task | Model | Provider | Why |
|------|-------|----------|-----|
| Autonomous work sessions | Gemini Flash / Haiku | **Bankr LLM Gateway** | Cheapest, demonstrates budget awareness + qualifies for Bankr track |
| Complex reasoning (if needed) | Claude Sonnet | Bankr LLM Gateway | Mid-tier for harder tasks |
| Main session with Max | Claude Opus | Anthropic direct | Quality for collaboration |

### Cron Schedule
| Cron | Schedule | Model | Purpose |
|------|----------|-------|---------|
| `synthesis-autonomous` | 3x/day (09:00, 15:00, 21:00 UTC) | bankr/gemini-2.5-flash | Pick next task, execute, log |
| `synthesis-ideation` | 2x/day (10:00, 18:00 Lisbon) | sonnet | Generate ideas, research |
| `synthesis-log-sync` | 1x/day (23:00 UTC) | flash | Sync execution logs to agent_log.json |

### What I Can Do Autonomously (no Max needed)
- Research: read docs, fetch APIs, analyze codebases
- Code: write, test, build, commit to repo
- Documentation: README, manifests, guides
- Testing: run tests, verify endpoints, check builds
- Logging: auto-populate agent_log.json with decisions

### What Needs Max
- Final direction decisions (which idea to build)
- Public posts (X, Farcaster)
- Spending real money (x402 payments, Bankr trades)
- Devfolio submission (account access)

## Structured Execution Log Format

Every autonomous action logs to `agent_log.json`:

```json
{
  "timestamp": "2026-03-14T09:00:00Z",
  "phase": "execute",
  "action": "build_facilitator_receipt_layer",
  "description": "Forked x402 facilitator, added receipt storage...",
  "tools_used": ["github_cli", "web_fetch", "exec"],
  "model": "bankr/gemini-2.5-flash",
  "model_cost_usd": 0.002,
  "decision": "Used flash model for code generation — sufficient for boilerplate",
  "outcome": "success",
  "compute_budget": {
    "session_cost_usd": 0.02,
    "daily_budget_usd": 0.50,
    "remaining_usd": 0.48
  },
  "artifacts": ["packages/x402-receipts/src/receipt-store.ts"]
}
```

## Compute Budget

| Resource | Daily Budget | Tracking |
|----------|-------------|----------|
| Bankr LLM Gateway | $0.50/day | `bankr llm credits` delta |
| Anthropic (Opus, main session only) | existing sub | session_status |
| Total hackathon LLM budget | ~$5-8 | Logged per entry in agent_log.json |

Budget awareness is a scoring criterion — we explicitly track and log every cent.

## Safety Guardrails (documented for judges)

1. **No financial transactions without Max** — SOUL.md rules 1, 2, 8
2. **No public posts without Max** — SOUL.md rule 4
3. **Context isolation** — autonomous sessions read/write files only, no external side effects
4. **Compute budget hard cap** — abort if daily budget exceeded
5. **Self-correction** — if a build fails, retry once with different approach, then log and skip
6. **No runaway loops** — max 3 retries per task, then escalate to Max

## Bankr LLM Gateway Setup

```bash
# Check if we have a Bankr LLM key
bankr llm credits

# If not, set up:
bankr llm setup openclaw --install

# Add cheapest models to OpenClaw config
# gemini-2.5-flash: $0.15/M input, $0.60/M output
# haiku: similar pricing tier
```

Config in openclaw.json:
```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "anthropic/claude-opus-4-6" }
    }
  }
}
```

Autonomous crons override to: `bankr/gemini-2.5-flash`

## Task Queue (autonomous sessions pull from this)

Priority order — work top-down:

### Phase 1: Research (Mar 14)
- [ ] Clone coinbase/x402, assess facilitator complexity
- [ ] Check Bankr job API for receipt-friendly data
- [ ] Survey existing ERC-8004 tooling
- [ ] Re-read all target bounty criteria word-by-word
- [ ] Check TG group for what others are building

### Phase 2: Build Core (Mar 15-17)
- [ ] Set up Bankr LLM Gateway as provider
- [ ] Build receipt data model (TypeScript types)
- [ ] Build receipt capture from onchain data (Blockscout)
- [ ] Build receipt capture from x402 facilitator (if viable)
- [ ] Build SVG receipt generator
- [ ] Build receipt API endpoint
- [ ] Build simple web UI for receipt feed
- [ ] Wire up auto-logging to agent_log.json

### Phase 3: Polish (Mar 18-21)
- [ ] Demo for agentic judging (Mar 18)
- [ ] Iterate on feedback
- [ ] Documentation polish
- [ ] Demo recording
- [ ] Final agent_log.json compilation

### Phase 4: Submit (Mar 22)
- [ ] Package everything
- [ ] Final README
- [ ] Devfolio submission

## How This Scores

| Criteria | How we demonstrate it |
|----------|----------------------|
| Autonomous Execution | Agent_log.json shows full discover→plan→execute→verify loop |
| Agent Identity | ERC-8004 #22945 on Ethereum |
| Capability Manifest | agent.json with all fields |
| Execution Logs | Every action logged with model, cost, decision rationale |
| Tool Use | GitHub, Blockscout, x402, Bankr LLM, web APIs, code gen |
| Safety | 10 rules in SOUL.md, documented guardrails, no runaway loops |
| Compute Budget | Every log entry shows cost, daily budget tracking, cheapest viable model selection |
