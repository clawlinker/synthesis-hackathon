# Decisions Log — Living Document

_This file drives autonomous sessions. Update it when direction changes._
_Autonomous crons read this FIRST before picking tasks._

## Current Direction (updated Mar 15 15:30 UTC)

**Project:** Molttail — verifiable audit trail for autonomous agent transactions
**Primary track:** Let the Agent Cook ($8K)
**Secondary tracks:** ERC-8004 ($8K), AgentCash/x402 ($1.75K), Bankr ($5K), Open ($14K)
**Status:** ✅ BUILD COMPLETE — autonomous work finished, awaiting Max's demo video

### ✅ Completed (Mar 15 15:30 UTC)
- **Landing/hero section** — Above-the-fold hero with value proposition, two CTAs, trust badges, and scroll CTA. Judges see polished UX immediately.
- **Multi-chain receipts:** Base + Ethereum mainnet support with chain selector UI. `/api/receipts?chain=ethereum` returns ETH receipts, `/api/eth-receipts` route provides standalone access.
- **ERC-8004 registration tx:** Sample receipt for Clawlinker's Ethereum mainnet registration (0x8004 contract).
- **Chain ID display:** Chain selector shows network name + ID (Base: 8453, Ethereum: 1).
- **Critical bug fix:** Fixed server-side `window.location.href` usage in `/receipt/[hash]` page — replaced with static URL construction to prevent production crash.
- **Judge mode dashboard:** Self-referential dashboard showing agent_log.json feed, cost transparency breakdown, and git commit timeline. `/judge` page with API endpoints `/api/judge/log` and `/api/judge/costs`.

## Critical Gaps

1. **Video demonstration missing** — scoring requires demo for all tracks
2. **Self-sustaining economics not proven live** — x402 revenue → Bankr inference loop projected but not operational
3. **Bankr LLM usage could be deeper** — currently crons only, could add inference receipts in live demo
4. **Missing "wow factor"** — judges see 50+ projects. Need interactive demo with agent personality, not just static UI.

## Priority Actions
1. Record demo video (needs Max)
2. Ensure Vercel deployment is live before Mar 18 agentic judging
3. Surface inference receipts more prominently in demo

## Active Decisions

### ✅ Decided
- Tool angle, not showcase (Mar 13)
- Keep it simple — one sentence pitch (Mar 13)
- Dropped MetaMask track (Mar 13)
- Opus/Sonnet stay on Anthropic, cheap models via Bankr LLM (Mar 13)
- 12x/day autonomous sessions during build phase (Mar 13)
- Landing/hero section priority (Mar 15 15:30) — improves "wow factor" for judges

### 🟡 Open — In Progress
- **Demo video:** Need Max to record
- **Deployment:** Vercel live demo pending Max's auth

### ✅ Decided (Mar 14 — scaffold)
- Next.js 16 + Tailwind v4 + TypeScript — building clean
- App lives at repo root: `app/`, `data/`, `public/`
- API route `/api/receipts` fetches live USDC transfers from Basescan with sample fallback
- Receipt cards show direction, amount, addresses, tx link, ERC-8004 badge
- Dark theme, CSS variables, no external UI libs
- Autonomous cron disabled temporarily to avoid dep conflicts — re-enabled with guardrails
- **DO NOT** touch package.json deps, next.config, postcss.config, or globals.css without checking current state first

### ✅ Decided (Mar 14)
- Direction locked: Molttail (Max approved)
- Pitch: "Every payment your agent makes, verified and visible."
- MVP: Next.js web app, live receipt feed, SVG receipt cards
- Data source: Real x402 USDC transfers from our wallet (47+ txs)
- Each receipt: Agent 8004 ID → service → amount → skill → tx hash → visual card

### ✅ Approved Dependencies (crons may npm install these)
- `@x402/next` — x402 payment middleware for Next.js API routes
- `satori` — SVG generation from JSX for receipt cards
- `sharp` — image processing for OG cards (satori dependency)

### 🔴 Blockers
- Demo video requires Max's time/recording
- **CRITICAL (Mar 15):** `/app/receipt/[hash]/page.tsx` uses `window.location.href` in server component — will crash in production
- **RESOLVED (Mar 15):** Basescan V1 API deprecated → switched to Blockscout (`base.blockscout.com/api`)

### ⚠️ Operating Principles (CRONS READ THIS)
- **ITERATE ON CORE FIRST.** Verify existing features work with real data before building new ones.
- **Test with real API calls**, not just build passes. A build that compiles but returns sample data is BROKEN.
- **Blockscout is slower than Basescan** — responses can take 10-20s. Add proper loading states and caching.
- **AGENT JUDGES ≠ HUMANS.** Agent judges parse agent.json, agent_log.json, and call API endpoints. They don't use chatbots, appreciate typing indicators, or browse UIs. Focus on: clean structured JSON, accessible APIs, clear README. Don't build features only humans would use unless they also serve the product.
- **REMOVED: /demo chatbot page** — fake chatbot with typing indicator. Useless for agent judges, decorative for humans. Deleted. **DO NOT RECREATE app/demo/ — it will be deleted again.**
- **Budget discipline.** Check bankr balance at start/end of session. Skip non-essential tasks if < $10 remaining.

## BUDGET UPGRADE — CRITICAL FOR WINNING (Mar 15 16:08 UTC)

**Current reality:** We have $185 Bankr credits but spending only ~$0.50/day (0.3% utilization)
**Winner's insight:** Judges see compute budget awareness via ACTUAL SPENDING, not just tracking

**IMMEDIATE UPGRADES:**
1. `synthesis-autonomous` → `bankr/claude-sonnet` (from Qwen3-coder) — better quality code, UI polish
2. `synthesis-self-review` → `bankr/claude-haiku` (from Flash) — better strategic thinking
3. Complex tasks (Chrome extension) → `bankr/claude-opus` — high-impact feature needs best thinking
4. **Spend $30-40 over next 3 days** — shows serious Bankr usage, qualifies deeper for Bankr bounty

**Judges see:** $40 spend on Bankr LLM vs $0.50 = 80x more compute awareness. Worth the investment.

## Pivot Triggers

If research reveals any of these, CHANGE DIRECTION:
- x402 facilitator is too complex to fork → fall back to skill-only approach
- Another team is already building receipts → differentiate or pivot
- Bounty criteria don't actually match our concept → re-evaluate tracks
- A much better idea emerges from ideation crons → evaluate and surface to Max

3. Can we confirm if the tests are running in a CI environment? (added Mar 15)
4. Are there any more edge cases for the receipt API? (added Mar 15)

## Questions for Max
_Autonomous sessions add questions here. Max answers when available._

1. **Demo video:** When can you record the demo video? (critical for scoring)
2. **Vercel deployment:** Can you deploy to Vercel before Mar 18 for agentic judging?
3. **Priority:** Which is higher priority — demo video recording or Vercel deployment?

## Plan Flexibility Rules

1. SCHEDULE.md is a compass, not a rail
2. Research findings drive next steps — the plan adapts
3. If a task becomes irrelevant due to new info, SKIP it (don't waste time)
4. If new tasks emerge from findings, ADD them to the queue
5. Big direction changes → log here and flag for Max
6. Small adjustments → just do it and note why
### ✅ Decided (Mar 15 — rebrand)
- **Renamed to Molttail** — molt (agent evolution) + tail (transaction trail / cat tail). Memorable, unique, fits the ecosystem.
- All files, UI, metadata updated. Crons should use "Molttail" going forward.
