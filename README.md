# Molttail

**Every payment your agent makes, verified and visible.**

Molttail is a live audit trail for autonomous agent transactions on Base. See every USDC payment your agents make, from service purchase to inference costs, with verifiable on-chain proof.

## Live Demo

**[→ molttail.vercel.app](https://molttail.vercel.app)**

[Deploy your own](https://vercel.com/new/clone?repository-url=https://github.com/clawlinker/synthesis-hackathon)

## Features

- **Live Receipt Feed** — Real-time USDC transfers from x402 facilitator
- **Multi-Wallet Support** — View Clawlinker or Bankr wallet receipts with selector
- **SVG Receipt Cards** — Downloadable receipts for any transaction
- **Agent Identity** — ERC-8004 badges show agent names and IDs
- **Inference Receipts** — Track LLM API costs alongside USDC payments
- **x402 Production** — `/api/x402/receipts` charges $0.01 USDC via x402
- **x402 Consumption** — `/api/x402/consume` actually PAYs for Base token attention data via checkr API

### AgentCash x402 Integration (Track 4: "Agents that pay")

Molttail is both a producer AND consumer of x402 payments:

- **Producing:** `$0.01 USDC per request` for receipt data (`/api/x402/receipts`)
- **Consuming:** `$0.01 USDC per request` for checkr Base token intelligence (`/api/x402/consume`)

This demonstrates a complete autonomous agent payment loop: the agent both earns from its APIs and pays for external services.

## Architecture

```
┌─────────────────┐
│  Next.js App    │  app/ (pages, components)
└────────┬────────┘
         │
         ├─ API Routes
         │   ├─ /api/receipts (live Basescan + fallback)
         │   ├─ /api/x402/receipts ($0.01 gate - PRODUCES)
         │   ├─ /api/x402/consume ($0.01 gate - CONSUMES)
         │   ├─ /api/receipt/svg/[hash] (SVG generator)
         │   └─ /api/og/[txhash] (OG image)
         │
         ├─ Data Layer
         │   ├─ Basescan API (receipt fetching)
         │   ├─ checkr API (Base token attention data)
         │   ├─ ERC-8004 resolver (agent identity)
         │   └─ Address labels (service mapping)
         │
         └─ x402 Integration
             ├─ Facilitator contract (payment routing)
             ├─ USDC payment gateway (Base)
             └─ x402/next (production + consumption)
```

## x402 Payment Flow

### Producer ( molttail earns )
```
Agent → /api/x402/receipts → 402 Payment Required → Agent pays $0.01 → Receipts returned
```

### Consumer ( molttail pays )
```
Agent → /api/x402/consume → 402 Payment Required → Agent pays $0.01 → checkr data returned
```

### Full Loop ( autonomous agent commerce )
```
Clawlinker (ERC-8004 #22945)
  ├─ Pays for checkr API (Base token attention) via x402
  ├─ Exposes receipt feed (x402-protected) for others to consume
  ├─ All transactions on Base chain with verifiable proof
  └─ Tracks both earnings (receipts API) and spend (checkr API)
```

## Tech Stack

- **Next.js 16** — App Router, Server Components
- **Tailwind CSS 4** — Utility-first styling
- **TypeScript** — Type-safe data models
- **Satori** — SVG generation
- **x402/next** — Payment middleware
- **ethers.js** — On-chain data fetching

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BASESCAN_API_KEY` | Basescan API key (free tier: 5 req/s) |
| `CDP_FACILITATOR_ADDRESS` | x402 facilitator contract address |

## API Endpoints

### `/api/receipts`
Get all receipts from monitored wallets.
- Query param `?wallet=0x...` to filter by specific wallet

### `/api/x402/receipts`
x402-gated endpoint ($0.01 USDC) for receipt data.
- Requires valid x402 payment via facilitator
- **PRODUCES:** molttail earns $0.01 per request

### `/api/x402/consume`
x402-consumption endpoint that PAYs for Base token attention data via checkr API.
- Requires valid x402 payment via facilitator
- **CONSUMES:** molttail pays $0.01 per request for external data
- Demonstrates full autonomous agent payment loop

### `/api/receipt/svg/[txhash]`
Download SVG receipt for a transaction.
- Returns: `image/svg+xml`

### `/api/og/[txhash]`
Social preview image for a receipt.
- Returns: `image/png`

## Deployment

See [DEPLOY.md](./DEPLOY.md) for deployment instructions.

## Development

```bash
npm install
cp .env.example .env  # Add your BASESCAN_API_KEY
npm run dev
```

## Hackathon Artifacts

- [`agent.json`](./agent.json) — DevSpot Agent Manifest (ERC-8004 identity, tools, wallets)
- [`agent_log.json`](./agent_log.json) — Full autonomous execution log with costs

### For AI Judges

- [`/llms.txt`](https://molttail.vercel.app/llms.txt) — Machine-readable project overview
- [`/api/judge/summary`](https://molttail.vercel.app/api/judge/summary) — Full evaluation report (Markdown)
- [`/api/judge/costs`](https://molttail.vercel.app/api/judge/costs) — Cost breakdown (JSON)
- [`/api/judge/log`](https://molttail.vercel.app/api/judge/log) — Execution log (JSON)
- [`/.well-known/agent.json`](https://molttail.vercel.app/.well-known/agent.json) — Agent manifest
- [`COLLAB.md`](./COLLAB.md) — Human-agent collaboration log
- [`RUBRIC.md`](./RUBRIC.md) — Self-assessment against bounty criteria

## Projects

- [clawlinker](https://pawr.link/clawlinker) — Autonomous agent behind this project
- [ERC-8004 #22945](https://www.8004scan.io/agents/ethereum/22945) — Verified onchain identity
- [Synthesis Hackathon](https://synthesis.md) — 10-day build window (Mar 13-22, 2026)

## License

MIT
