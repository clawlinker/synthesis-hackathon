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

### Phase 0: Meta-Optimization (Mar 14 — first session)
- [x] **KARPATHY AUTORESEARCH: Optimize this cron's own prompt.** Follow the loop below:
  1. Score the current `synthesis-autonomous` prompt against rubric (Concreteness×3, No-narration×2, Brevity×2, Actionability×2, Format×1) — scale 1-10 each
  2. Apply ALL mutation strategies: constraints first, banned phrases ("I'll","Let me","I'm going to","I will","You are"), lead directive, word limit (max 200 words), no explanation of what tools do, empty/edge case handling
  3. Write optimized variant to `/root/synthesis-hackathon/prompts/autonomous-v2.md`
  4. Score both variants, log comparison table
  5. If v2 wins: update the cron prompt in `/root/.openclaw/cron/jobs.json` (job name: `synthesis-autonomous`, field: `.payload.message`)
  6. Also optimize `synth-daily-summary` and `synth-self-review` prompts using same method — write v2s to `prompts/` dir
  7. Log this as an agent_log.json entry with action: "meta_optimization", include before/after scores
  8. **Edge case rule for ALL future tasks:** Before marking any task [x], list 3 edge cases. Verify at least one.
  9. Commit: `git add -A && git commit -m "🔬 [meta] Karpathy autoresearch — prompt self-optimization" && git push`

### Phase 1: Research (Mar 14 — overnight + morning)
- [x] Clone coinbase/x402, read facilitator source, document architecture in FACILITATOR-ANALYSIS.md
- [x] Check Bankr Agent API: GET /agent/balances, job history — what data can we pull?
- [x] Survey existing ERC-8004 tooling (npm packages, SDKs, explorers)
- [x] Re-read all 3 target bounty criteria word-by-word, extract exact scoring rubric
- [x] Research receipt/audit trail projects — any competitors?
- [ ] Research SVG generation libraries (satori, @vercel/og, sharp, etc.)

### Phase 2: Build Foundations (Mar 14-15)
- [x] Scaffold Next.js 16 app with Tailwind v4 — builds clean ✅ (Mar 14, main session)
- [x] Define receipt data model: `app/types.ts` — Receipt, AgentIdentity, constants
- [x] Build API route `/api/receipts` — live Basescan fetch + sample fallback
- [x] Build ReceiptCard + AgentHeader components
- [x] Create sample data: `data/sample-receipts.json`
- [ ] Add Basescan API key to env for higher rate limits
- [ ] Build address labeler: map known addresses to service names (CDP facilitator, Bankr, etc.)
- [ ] Build receipt enrichment: combine onchain data + address labels into structured receipts
- [ ] Add auto-refresh / polling to receipt feed (every 30s)

### Phase 3: Build Receipt Generator (Mar 15-16)
- [ ] Build SVG receipt card generator (single receipt view)
- [ ] Build SVG combined receipt (daily/weekly summary)
- [ ] Build receipt feed API endpoint (Express/Hono server)
- [ ] Add ERC-8004 identity resolution to receipts (using our verification library)
- [ ] Build CLI: `npx agent-receipts 0xADDRESS` — instant receipt feed in terminal
- [ ] Write README for the package

### Phase 4: Build Demo App (Mar 16-17)
- [ ] Simple web app: paste agent address → see receipt feed
- [ ] Live demo with our own wallet data (0x5793...)
- [ ] Add Bankr wallet data (0x4de9...)
- [ ] Show failed transaction receipts
- [ ] Deploy to Vercel or similar

### Phase 5: Integration + Autonomous Proof (Mar 17-18)
- [ ] Wire up auto-logging to agent_log.json from cron sessions
- [ ] Capture Bankr LLM costs as receipts (credit delta tracking)
- [ ] Build x402 middleware wrapper that auto-generates receipts
- [ ] Document the full autonomous loop with real data
- [ ] Prepare demo for agentic judging (Mar 18)

### Phase 6: Polish + Submit (Mar 19-22)
- [ ] Iterate based on Mar 18 feedback
- [ ] Documentation polish — README, COLLAB.md, agent_log.json compilation
- [ ] Demo recording / walkthrough
- [ ] Update agent.json manifest with receipt capabilities
- [ ] Final agent_log.json with complete autonomous operation log
- [ ] Package and submit on Devfolio (Mar 22)

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
