# AGENTS.md — Molttail

## What This Is

Molttail is an onchain receipt dashboard for AI agents. It aggregates USDC transactions from Base, enriches them with ENS names and address labels, layers in LLM inference costs from the Bankr Gateway, and generates AI-powered spending insights.

**Live:** https://molttail.vercel.app

## Agent Identity

- **Name:** Clawlinker
- **ERC-8004:** #28805 (Base) · #22945 (Ethereum mainnet)
- **ENS:** clawlinker.eth
- **Wallet:** `0x5793BFc1331538C5A8028e71Cc22B43750163af8`
- **Harness:** OpenClaw
- **Primary Model:** claude-opus-4-6
- **Build Models:** bankr/qwen3-coder, bankr/qwen3.5-flash, bankr/gemini-3-flash

## Machine-Readable Endpoints

Judges and agents can query these directly:

| Endpoint | Description |
|----------|-------------|
| `GET /llms.txt` | Project overview in LLM-friendly format |
| `GET /api/judge/summary` | Markdown summary of the project for evaluation |
| `GET /api/judge/costs` | Live LLM cost breakdown from Bankr API |
| `GET /api/judge/log` | Structured agent activity log |
| `GET /api/health` | System health + endpoint directory |
| `GET /api/receipts` | Onchain USDC receipts (supports `?type=onchain`) |
| `GET /api/insights` | AI-generated spending insights via Bankr qwen3.5-flash |
| `GET /api/ens/[name]` | ENS name resolution (e.g. `/api/ens/clawlinker.eth`) |
| `GET /.well-known/agent.json` | Agent identity manifest |
| `GET /api/venice/insights` | Private spending analysis via Venice AI (zero data retention) |
| `GET /api/tempo-receipts` | USDC.e receipts from Tempo chain (MPP payments) |

## Architecture

```
Next.js 16 on Vercel
├── Receipt pipeline: BaseScan API → enrichment (labels + ENS) → grouped feed
├── LLM costs: Bankr Gateway /v1/usage API → live cost breakdown
├── Insights: Bankr qwen3.5-flash generates natural language summaries
├── ENS: Static map + ensdata.net resolution + /api/ens endpoint
└── Cron pipelines (OpenClaw):
    ├── synthesis-autonomous (qwen3-coder) — feature development
    ├── synthesis-judge-review (qwen3-coder) — self-review + fix loop
    ├── synthesis-type-check — tsc --noEmit every 30min
    ├── synthesis-build-guard — build verification
    └── synthesis-git-hygiene — repo cleanup
```

**Multi-chain support:** Receipt pipeline now covers Base (x402/USDC), Ethereum (USDC), and Tempo (MPP/USDC.e)

## Key Files

- `app/page.tsx` — Main receipt feed page
- `app/api/receipts/route.ts` — Receipt aggregation API
- `app/api/insights/route.ts` — Bankr LLM insights endpoint
- `app/api/judge/` — Judge-facing evaluation endpoints
- `components/ReceiptCard.tsx` — Receipt card rendering with ENS
- `components/HeroSection.tsx` — Dashboard header with live stats
- `data/config.ts` — Address labels, ENS names, service mappings
- `agent_log.json` — Structured activity log
- `public/.well-known/agent.json` — Agent identity manifest

## Tracks

- **Agents With Receipts — ERC-8004** ($8,000)
- **Let the Agent Cook** ($8,000)
- **Private Agents / Venice** ($11,500 VVV)
- **Best Bankr LLM Gateway Use** ($5,000)
- **Agent Services on Base** ($5,000)
- **Agents that pay** ($1,500)
- **ENS Identity** ($600)
- **ENS Communication** ($600)
- **ENS Open Integration** ($300)
- **Synthesis Open Track** ($25,000)

## How It Was Built

Human-agent collaboration over 5 days (Mar 13–17). Clawlinker autonomously built features via subagents on cheap Bankr models, with Max (human) providing direction, design review, and architecture decisions. 300+ commits, all through OpenClaw.
