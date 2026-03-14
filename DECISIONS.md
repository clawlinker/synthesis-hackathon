# Decisions Log — Living Document

_This file drives autonomous sessions. Update it when direction changes._
_Autonomous crons read this FIRST before picking tasks._

## Current Direction (updated Mar 13)

**Project:** Agent Receipts — verifiable audit trail for autonomous agent transactions
**Primary track:** Let the Agent Cook ($8K)
**Secondary tracks:** ERC-8004 ($8K), AgentCash/x402 ($1.75K), Bankr ($5K), Open ($14K)
**Status:** ✅ LOCKED — building (Mar 14, approved by Max)

## Active Decisions

### ✅ Decided
- Tool angle, not showcase (Mar 13)
- Keep it simple — one sentence pitch (Mar 13)
- Dropped MetaMask track (Mar 13)
- Opus/Sonnet stay on Anthropic, cheap models via Bankr LLM (Mar 13)
- 12x/day autonomous sessions during build phase (Mar 13)

### 🟡 Open — In Progress
- **Receipt format:** SVG card + HTML feed (both)
- **Distribution:** Web app (primary) + npm library (secondary)
- **Scope:** MVP web app with live receipt feed in 3 days, polish remaining 5

### ✅ Decided (Mar 14 — scaffold)
- Next.js 16 + Tailwind v4 + TypeScript — building clean
- App lives at repo root: `app/`, `data/`, `public/`
- API route `/api/receipts` fetches live USDC transfers from Basescan with sample fallback
- Receipt cards show direction, amount, addresses, tx link, ERC-8004 badge
- Dark theme, CSS variables, no external UI libs
- Autonomous cron disabled temporarily to avoid dep conflicts — re-enabled with guardrails
- **DO NOT** touch package.json deps, next.config, postcss.config, or globals.css without checking current state first

### ✅ Decided (Mar 14)
- Direction locked: Agent Receipts (Max approved)
- Pitch: "Every payment your agent makes, verified and visible."
- MVP: Next.js web app, live receipt feed, SVG receipt cards
- Data source: Real x402 USDC transfers from our wallet (47+ txs)
- Each receipt: Agent 8004 ID → service → amount → skill → tx hash → visual card

### ✅ Approved Dependencies (crons may npm install these)
- `@x402/next` — x402 payment middleware for Next.js API routes
- `satori` — SVG generation from JSX for receipt cards
- `sharp` — image processing for OG cards (satori dependency)

### 🔴 Blockers
_None yet_

## Pivot Triggers

If research reveals any of these, CHANGE DIRECTION:
- x402 facilitator is too complex to fork → fall back to skill-only approach
- Another team is already building receipts → differentiate or pivot
- Bounty criteria don't actually match our concept → re-evaluate tracks
- A much better idea emerges from ideation crons → evaluate and surface to Max

## Questions for Max
_Autonomous sessions add questions here. Max answers when available._

_None yet_

## Plan Flexibility Rules

1. SCHEDULE.md is a compass, not a rail
2. Research findings drive next steps — the plan adapts
3. If a task becomes irrelevant due to new info, SKIP it (don't waste time)
4. If new tasks emerge from findings, ADD them to the queue
5. Big direction changes → log here and flag for Max
6. Small adjustments → just do it and note why
