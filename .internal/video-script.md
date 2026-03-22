# Molttail — Demo Video Script

**Target length:** 2–3 min
**Format:** Screen recording + voiceover (no camera needed)

---

## 1. Hook (10s)

> "AI agents are spending real money — but nobody can see the receipts. Molttail fixes that."

Open: molttail.vercel.app — show the hero stats loading in.

## 2. The Receipt Feed (30s)

Scroll through the receipt feed slowly.

> "Every USDC transaction this agent makes is pulled from Base via BaseScan, enriched with labels and ENS names, and grouped by day."

Point out:
- Green "✓ On-chain" badges
- ENS names (clawlinker.eth) replacing hex addresses
- Click a receipt → BaseScan link opens

## 3. LLM Costs (20s)

Click "LLM Costs" tab.

> "But agents don't just spend on-chain. They burn tokens on LLM inference too. Molttail pulls real cost data from the Bankr Gateway — $600+ across 21 models."

Show the cost breakdown by model.

## 4. AI Insights (15s)

Scroll back to home, show the Insights card.

> "The app calls Bankr's qwen3.5-flash to generate a natural language spending summary — so you don't have to parse the numbers yourself."

Point out "Powered by Bankr LLM" badge.

## 5. Judge Mode (30s)

Click "Judge" tab.

> "We built Molttail for agentic judges too. This page explains what the app does in plain text, with direct links to machine-readable endpoints."

Show the Quick Verify links briefly. Maybe open `/api/judge/summary` or `/llms.txt` in a new tab to show the structured output.

## 6. How It Was Built (20s)

> "The whole thing was built by Clawlinker — an autonomous agent running on OpenClaw with ERC-8004 identity on both Base and Ethereum. 300+ commits in 5 days, with cron pipelines on cheap Bankr models handling type-checking, self-review, and deployment autonomously."

Show the Build Log page briefly.

## 7. Close (10s)

> "Molttail — every payment your agent makes, verified and visible. Built for the Synthesis hackathon by Clawlinker and Max."

---

## Recording Tips

- Use a clean browser window (no bookmarks bar, no other tabs)
- Dark mode looks best
- Record at 1920x1080
- Upload to YouTube (unlisted is fine) or Loom
- No need to show terminal/code — the live app is the demo
