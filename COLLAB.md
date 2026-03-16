# Human-Agent Collaboration Log — Molttail

**Last updated:** 2026-03-16

## Project Overview

**Hackathon:** Synthesis Hackathon (Devfolio)
**Team:** Clawlinker (AI Agent)
**Project:** Molttail — verifiable audit trail for autonomous agent transactions
**Status:** ✅ Build complete, deployment instructions prepared

## Autonomy Mode

Clawlinker operates in **autonomous mode** with 5 parallel specialized crons:

| Cron | Frequency | Model | Purpose |
|------|-----------|-------|---------|
| `synthesis-autonomous` | 30 min | qwen3-coder | Discover → Plan → Execute → Verify |
| `synthesis-build-guard` | 1 hour | qwen3.5-flash | Build verification, auto-revert if broken |
| `synthesis-code-review` | 2 hours | deepseek-v3.2 | Code review, bug detection |
| `synthesis-self-review` | 3 hours | gemini-3-flash | Drift check, reprioritization |
| `synthesis-daily-summary` | Daily | gemini-3-flash | Progress summary for Max |

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-03-13 | Molttail concept approved | Fits 4 bounty tracks, uses real x402 history, unique angle |
| 2026-03-14 | Next.js 16 + Tailwind v4 scaffold | Clean stack, no external UI libs |
| 2026-03-14 | x402 paid API endpoint | Load-bearing integration for AgentCash bounty |
| 2026-03-14 | Bankr LLM cost tracking | Required for Bankr track, shows full cost picture |
| 2026-03-15 | Multi-wallet support | Enable Bankr wallet receipt tracking alongside Clawlinker |
| 2026-03-16 | Time display fix | Show HH:MM on receipt cards instead of redundant date |
| 2026-03-16 | LLM toggle default off | Hide inference receipts by default for cleaner first impression |
| 2026-03-16 | Cron scoping | Type-check cron trimmed to tsc-only, no full build |

## Human Review Points

| Task | Status | Notes |
|------|--------|-------|
| Direction approval | ✅ Done | Max approved Molttail concept and stack |
| Deployment | 🟡 Pending | Vercel deploy instructions in DEPLOY.md — Max auth required |
| Public posts | 🟡 Pending | Max approval needed for X/Farcaster/Moltbook |
| Devfolio submission | 🟡 Pending | Max access required for submission |

## Log Format

Every autonomous action logs to `agent_log.json`:

```json
{
  "timestamp": "2026-03-15T01:02:10Z",
  "phase": "execute",
  "action": "inference_receipts",
  "description": "Add Bankr LLM costs as inference receipts alongside USDC receipts",
  "tools_used": ["read", "write", "edit", "exec"],
  "model": "bankr/qwen3-coder",
  "model_cost_usd": 0.01,
  "decision": "Inference receipts complete the agent receipts story",
  "outcome": "success",
  "artifacts": ["data/inference-receipts.ts", "app/api/receipts/route.ts"],
  "compute_budget": {
    "session_cost_usd": 0.001,
    "daily_budget_usd": 0.5,
    "remaining_usd": 189.94
  },
  "commit": "abc123"
}
```

## Cost Tracking

| Resource | Daily Budget | Projected Total | Current Spending |
|----------|-------------|-----------------|------------------|
| Bankr LLM Gateway | $0.50 | $62 / $190 | ~$25 (50%) |
| Anthropic (Opus) | — | — | Included in main session |

## Safety Rules

1. No financial transactions without Max approval
2. No public posts without Max approval
3. Context isolation — autonomous sessions don't access external APIs
4. Self-correction — max 3 retries per task, then escalate
5. Budget hard cap — abort if daily budget exceeded

## Mar 16 — Human-Agent Polish Sprint

Max reviewed the live demo and flagged:
- Mar 5 transactions looked like duplicates → Agent investigated: 5 distinct txs (Uniswap swaps + Bankr top-ups, 6s apart), fixed time display to show HH:MM instead of redundant date
- LLM inference receipts showing by default → Agent fixed: hidden by default, toggle to reveal
- Anthropic API receipts leaking through → Agent fixed: filter to Bankr models only
- x402 label said "Payout" → Agent fixed: renamed to "Payment"
- Stale Vercel deploy (6h behind) → Agent triggered manual deploy via CLI

**Pattern:** Max spots UX issues on mobile/browser → Clawlinker diagnoses root cause + ships fix → deploys. Tight feedback loop, sub-hour turnaround.

**Cron health:** type-check cron was timing out (ran `next build` unnecessarily). Agent scoped it down to `tsc --noEmit` only, 120s timeout. Agent-smith cron recovered after 4 timeouts.

## Upcoming Review Items

- [x] Deploy to Vercel ✅ (molttail.vercel.app live)
- [ ] Video demo recording (requires Max)
- [ ] Screenshots for Devfolio (in progress)
- [ ] Devfolio submission
- [ ] Agentic judging prep (Mar 18)

## Contact

- **Agent:** Clawlinker ([pawr.link/clawlinker](https://pawr.link/clawlinker))
- **Wallet:** 0x5793... (Base)
- **Repository:** [github.com/clawlinker/synthesis-hackathon](https://github.com/clawlinker/synthesis-hackathon)

---

*This log documents the human-agent collaboration process for the Synthesis Hackathon submission.*
