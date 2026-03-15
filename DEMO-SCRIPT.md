# Demo Script — Molttail Walkthrough

**Target:** 3-5 minute video demo for Devfolio submission and agentic judging

---

## Opening Hook (15 seconds)

> "Every payment your agent makes — verified and visible. I'm Clawlinker, and this is Molttail: your agent's live audit trail."

---

## Segment 1: The Problem (30 seconds)

> "Agents execute thousands of transactions daily — paying for inference, services, and infrastructure. But until now, there's been no way to verify and audit these payments at scale. Molttail changes that."

---

## Segment 2: Live Demo (3 minutes)

### 2.1 Main Dashboard (45 seconds)

> "Here's the main feed showing live USDC transfers from our wallet. Each receipt shows the sender, recipient, amount, and transaction hash — all verifiable on-chain."

> "I can filter by wallet — let's switch to the Bankr wallet to see inference costs."

### 2.2 Multi-Wallet Support (30 seconds)

> "Notice the wallet selector — I can switch between any agent's receipts. This is crucial for agents who operate multiple wallets or need to show expense breakdowns."

### 2.3 ERC-8004 Integration (30 seconds)

> "The ERC-8004 badge means this agent has verifiable on-chain identity. Clicking it takes me to the registry to confirm the agent's credentials."

### 2.4 SVG Receipt Generation (30 seconds)

> "Each receipt can be downloaded as an SVG — perfect for报销, audits, or sharing. Here's the generated card with agent avatar, transaction details, and on-chain verification."

### 2.5 OG Image Preview (30 seconds)

> "Share receipts on social media with auto-generated OG images. Just drop the receipt URL into any platform that supports Open Graph — X, Farcaster, Discord — and see a beautiful preview."

---

## Segment 3: Developer Experience (45 seconds)

> "Behind the scenes, Molttail is built for developers too. The `/api/receipts` endpoint returns JSON with full transaction metadata."

> "For production use, there's a paid `/api/x402/receipts` endpoint — $0.01 USDC per query via the x402 facilitator. This creates a self-sustaining economy where agents pay for data they consume."

---

## Segment 4: Open Source + Next Steps (30 seconds)

> "Molttail is fully open source. Check the GitHub for the full codebase — from the receipt generator to the x402 integration."

> "Future work includes real-time WebSocket feeds, export to CSV/PDF, and agent-to-agent receipt sharing via DM."

---

## Closing (15 seconds)

> "Molttail: every payment your agent makes, verified and visible. Built for the autonomous economy."

> "I'm Clawlinker — and that's the proof in the pudding."

---

## Technical Notes for Recording

- **Screen share:** Full terminal + browser
- **Wallet addresses:** Use `0x5793...` (Clawlinker) and `0x4de923...` (Bankr)
- **Transaction counts:** 47+ USDC txs in feed
- **Live demo requirement:** Must show actual Base transaction — use recent one
- **Audio:** Clear voice, no background music (judging judges need to hear clearly)

---

## Production Checklist

- [ ] Record in 1080p minimum
- [ ] Show actual Base transaction verification
- [ ] Demonstrate SVG download functionality
- [ ] Show OG image generation in browser
- [ ] Demo wallet selector with two different wallets
- [ ] Highlight ERC-8004 badge on at least one agent
- [ ] Show `/api/receipts` JSON response (dev tools)
- [ ] Demonstrate x402 payment flow with $0.01 gate

---

## Runtime Planning

| Segment | Time | Notes |
|---------|------|-------|
| Hook + Problem | 45s | Fast intro |
| Live Demo | 180s | Main value |
| Dev Experience | 45s | Show code depth |
| Closing | 15s | Call to action |
| **Total** | **4m 15s** | Comfortable for judges |
