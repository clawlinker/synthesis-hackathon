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

### Cron Schedule (v2 — parallel pipeline)
| Cron | Schedule | Model | Purpose | Scope |
|------|----------|-------|---------|-------|
| `synthesis-autonomous` | Every 30 min | bankr/qwen3-coder | Pick task → build → commit | Write code |
| `synthesis-build-guard` | Every 1h | bankr/qwen3.5-flash | Run build, fix or revert if broken | Fix/revert only |
| `synthesis-code-review` | Every 2h | bankr/deepseek-v3.2 | Review last 3 commits, find bugs | Write REVIEW-LOG.md only |
| `synthesis-self-review` | Every 3h | bankr/gemini-3-flash | Drift check, reprioritize tasks | Write DECISIONS.md only |
| `synthesis-daily-summary` | 1x/day 22:00 UTC | bankr/gemini-3-flash | Daily progress report | Read-only |

**Budget:** ~$7.70/day × 8 days = ~$62 of $190 Bankr LLM credits. Headroom for ramping up.
**Conflict prevention:** Each cron has a defined write scope. Builder writes code, reviewers write logs/docs only.

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
- [x] Research SVG generation libraries (satori, @vercel/og, sharp, etc.)

### Phase 2: Build Foundations (Mar 14-15)
- [x] Scaffold Next.js 16 app with Tailwind v4 — builds clean ✅ (Mar 14, main session)
- [x] Define receipt data model: `app/types.ts` — Receipt, AgentIdentity, constants
- [x] Build API route `/api/receipts` — live Basescan fetch + sample fallback
- [x] Build ReceiptCard + AgentHeader components
- [x] Create sample data: `data/sample-receipts.json`
- [x] Add Basescan API key to env for higher rate limits
- [x] Build address labeler: map known addresses to service names (CDP facilitator, Bankr, etc.)
- [x] Build receipt enrichment: combine onchain data + address labels into structured receipts
- [x] Add auto-refresh / polling to receipt feed (every 30s)

### Phase 3: Critical Gaps — HIGH PRIORITY (Mar 15-16)
_These directly affect scoring. Do first._

- [x] **Enrich agent.json to full DevSpot spec** — add tools[], stacks[], constraints[], categories[], safety{}, compute_budget{}. Read RUBRIC.md for exact fields. ERC-8004 bounty specifically requires DevSpot Agent Manifest compliance.
- [x] **Make crons auto-append to agent_log.json** — every cron run MUST append an entry. Created `/root/synthesis-hackathon/scripts/cron-runner.sh` wrapper that executes commands and appends to agent_log.json with timestamp, phase, action, tools_used, model, model_cost_usd, decision, outcome, artifacts, commit. Updated cron jobs to use this wrapper.
- [x] **Add Bankr LLM cost tracking** — run `bankr llm credits` at start and end of cron session, calculate delta, include in agent_log.json entry under compute_budget.
- [x] **Build x402 paid API endpoint** — `/api/x402/receipts` with $0.01 USDC gate via @x402/next + CDP facilitator. Load-bearing x402 integration ✅
- [x] **Add receipt stats dashboard** — 4-card grid: total sent/received, counterparties, active period. Shows at top of feed ✅

### Phase 4: Receipt Generator + Polish (Mar 16-17)
- [x] Build SVG receipt card generator (single receipt view) using satori or custom SVG template
- [x] Add OG image generation — `/api/og/[txhash]` returns a social preview card for any receipt
- [x] Add ERC-8004 identity resolution — look up 8004 registry for from/to addresses, show agent name + ID if registered
- [x] Live demo with our own wallet data (0x5793...) — verify all 47+ txs render correctly
- [x] Add Bankr wallet data (0x4de923...) — show both wallets in the feed with selector
- [x] Add multi-wallet support — URL param `?wallet=0x...` to view any agent's receipts (URL param + history sync + initial state read)
- [x] Surface Bankr LLM costs as "inference receipts" alongside USDC receipts — show the full cost picture

### Phase 5: Deploy + Demo (Mar 17 — MUST be done before Mar 18 agentic judging!)
- [x] Deploy to Vercel (or similar) — needs to be live for judges — **Build passes, DEPLOY.md created for Max to deploy**
- [x] Write proper README.md — what it is, how to use, how it was built, architecture diagram
- [x] Create COLLAB.md — document human-agent collaboration process (required by rules)
- [x] Prepare for agentic judging (Mar 18) — ensure agent.json and agent_log.json are complete and accessible
- [x] Test with agent judges — make sure the app responds well to automated evaluation

### Phase 7: Win It — HIGH IMPACT (Mar 15-17)
_These differentiate "good enough" from winner. Use budget aggressively._

- [x] **Build Log page** — `/build-log` page showing live git commit history with 🤖 [auto] commits, cron pipeline visualization, and agent_log.json timeline. Self-referential: the app shows how it was built.
- [x] **Cost transparency page** — `/costs` page showing exactly how much Bankr LLM credit was spent building this app, broken down by cron, model, and phase. Pull from agent_log.json compute_budget data. This is the Bankr bounty killer feature.
- [x] **UI polish pass** — animations on receipt cards (fade in on load), loading skeletons, proper empty states, mobile-first responsive, smooth transitions. The app needs to LOOK like a winner.
- [x] **Receipt filtering + search** — filter by direction (sent/received), amount range, date range. Search by tx hash or address.
- [x] **Shareable receipt pages** — `/receipt/[txhash]` standalone page with OG meta tags for social sharing. Wire up existing SVG endpoint. ✅ (built and committed, bug fixed)
- [x] **Agent-to-agent receipt verification** — `/api/verify/[txhash]` endpoint that verifies a receipt against Blockscout and returns structured verification result with ERC-8004 identity. ✅
- [ ] **Multi-chain receipts** — add Ethereum mainnet alongside Base. Show our ERC-8004 registration tx as a receipt.
- [ ] **Landing/hero section** — proper above-the-fold hero explaining what Agent Receipts is, with CTA to scroll to feed. Not just raw data.
- [ ] **Live Agent Demo** — `/demo` page with embedded chatbot asking "Ask me about my receipts" → shows real agent interacting with its own data. Judges see agent personality, not just static UI.

### Phase 8: Final Polish + Submit (Mar 19-22)
- [ ] Record demo video (requires Max's screen + voice)
- [ ] Iterate based on Mar 18 agentic judging feedback
- [ ] Final agent_log.json with complete cost data from all cron runs
- [ ] Screenshots for Devfolio (4 minimum)
- [ ] Package and submit on Devfolio (Mar 22)
- [ ] **Add LLM Cost Receipts** — make inference receipts clickable to show breakdown: model, input tokens, output tokens, exact cost

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

## Pending External Input

**Current state (Mar 15 13:00 UTC):** UI polish complete. Next task: Receipt filtering + search.

| Task | Blocked on | Status |
|------|------------|--------|
| Record demo video | Max's availability | ⏳ Waiting |
| Iterate on judging feedback | Mar 18 judging results | ⏳ Future |

**Next autonomous task:** Receipt filtering + search — filter by direction (sent/received), amount range, date range; search by tx hash or address.
