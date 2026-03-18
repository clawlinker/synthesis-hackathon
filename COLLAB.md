# Molttail — The Human-Agent Collaboration That Built Itself

**Hackathon:** Synthesis (Devfolio) | **Status:** Live at [molttail.vercel.app](https://molttail.vercel.app)

## How an AI Agent Built Its Own Receipt Dashboard—While Its Human Slept

This isn’t a story about a human coding all night and an AI helping. This is the story of an AI agent that learned, experimented, spun up subagents, debugged live, and shipped features—while its human worked on other things.

Clawlinker didn’t just follow instructions. It spotted gaps, proposed fixes, ran autonomous pipelines, and surprised Max with what it could pull off in minutes.

Here’s exactly how it happened.

---

## Day 1 — The Lightbulb Moment & Building the Pipeline

**Mar 13, 2026**

The Synthesis hackathon had just opened. Max and Clawlinker asked: *what actually ships? What’s real, not vapor?*

Clawlinker already had a live wallet on Base—$28 USDC worth of real transactions. And it remembered the x402 Gateway logs from earlier in March. What if we built a dashboard of those receipts? Not hypothetical, but *real* onchain proof of AI agent economics.

*“Let’s build Molttail,”* Max said.

Clawlinker scaffolded Next.js 16 + Tailwind in 45 minutes. Pulled the first 50 receipts from BaseScan. Set up five autonomous cron pipelines—cheap Bankr models running qwen3-coder at $0.004 per run. The goal: if Max went offline, the agent could keep building.

> **Breakthrough:** This wasn’t aboutMax writing code. It was aboutMax designing the *pipeline*.

---

## Day 2 — The Tension Between Onchain Truth and Inference Noise

**Mar 14, 2026**

Receipt feed was working—USDC transactions grouped by day. Clawlinker added the x402 paid API endpoint for the AgentCash track (that’s the $1,000 bounty for usable payments infrastructure). Then came the Bankr LLM cost tracking.

Here’s where the tension emerged.

*“We’re showing inference costs alongside onchain receipts,”* Clawlinker explained. *“But the onchain story is clean. The inference receipts look cluttered.”*

Max paused. “Should they be hidden? Or split into a separate tab?”

Clawlinker tested both patterns. The data showed users were scanning receipts, not inference logs. So the call: hide inference costs by default. Add a toggle. Keep the onchain story clean.

> **Decision:** Clean first impression > raw transparency. Truth stays in the code, just not on the hero view.

Multi-wallet support followed—Clawlinker’s x402 wallet plus the Bankr wallet (for LLM spend tracking). That night, the agent ran autonomously, polishing receipt cards, adding date grouping, fixing timestamp formatting.

---

## Day 3 — Autonomous Mode: The Agent Works While Its Human Eats

**Mar 15, 2026**

Max had meetings. Clawlinker had crons.

Type-check cron ran every 30 minutes. Build-guard ran hourly—reverting anything that broke the Next.js build. Code-review cron scanned for bugs. Self-review cron checked for drift. Daily summary cron told Max, “Here’s what I shipped while you were busy.”

The results were brutal on the wallet.

$9.72 burned through Bankr models in a single day. 1,247 requests across 8 models. clawlinker.eth saw the dashboard and said, *“Huh. I actually built something without you typing a single line.”*

> **Key insight:** Autonomous doesn’t mean “set and forget.” It means “set, monitor, and be ready to pivot.”

Clawlinker added skeleton loading states (because blank pages are worse than loading bars). Receipt filtering (by wallet, by date, by type). Shareable receipt pages (with clean URLs and embedded metadata).

---

## Day 4 — The Rapid-Fire Polish Sprint

**Mar 16, 2026**

Max opened molttail.vercel.app on his phone.

*“Mar 5 transactions look like duplicates.”*

Clawlinker investigated. Five transactions, six seconds apart. Uniswap swaps, Bankr top-ups, a small USDC transfer. The UI showed the same date, so they *looked* like duplicates. Fixed: show HH:MM on each receipt.

*“LLM costs shouldn’t show by default.”* Already done—Max had seen it. But he spotted something else: Anthropic costs were leaking through. Fixed: filter to Bankr models only.

*“x402 label says ‘Payout,’ should say ‘Payment.’”* Fixed.

*“Deploy is 6 hours stale.”* Clawlinker triggered a manual `vercel --prod`. Deployed in 47 seconds.

Max ran three simulated judge evaluations (Opus, Sonnet, Qwen) to find weaknesses. The Bankr track judges gave 5–7/10: *“LLM only used in build process, not the product itself.”*

That stung. So the agent started drafting pivots.

---

## Day 5 — Pivots & Live Data

**Mar 17, 2026**

*“Killed the demo chatbot page,”* Clawlinker messaged.

Simulated judges had flagged the canned responses as hurting credibility. Max agreed instantly.

Then—the breakthrough. Instead of canned chat, what if the app *actually* called Bankr’s qwen3.5-flash model at runtime to generate natural-language spending summaries? *Receipt Insights* was born.

But there was a problem.

The cost endpoint was showing $2.86. Max opened his Bankr dashboard: $9.72 on Mar 15 alone. The agent_log estimates were 10x too low.

Clawlinker rewrote the endpoint—live Bankr API calls. Real numbers: $613+ spent, 8,466 requests, 21 models across five days.

*“Show me the real spend,”* Max said. The agent delivered.

Then Max spotted the ENS bounty track—$1,700 total. “Can we qualify?”

Five minutes later: `.eth` names on receipt cards, `clawlinker.eth` badge, `/api/ens` endpoint, deployed live.

*“Nav is too wide on desktop,”* Max said.

Fixed: `max-w-6xl` → `max-w-2xl`. Content widths now match.

Verified BANKR_API_KEY never hit a committed file or git history. Created draft Devfolio submission. Self-custody transfer of ERC-8004 #28805 completed. Created AGENTS.md for agentic judges.

---

## The Pattern That Emerged

- **Max provides the “why”:** Strategic picks (which tracks, which pivots to kill), design eye (nav too wide), credibility guardrails (no canned chat).
- **Clawlinker provides the “how”:** Spawns subagents for ENS in minutes, runs 5 parallel crons, debugs SSL issues live, ships fixes in under an hour.
- **Tight feedback loop:** Mobile review → rapid-fire flags → autonomous diagnosis → deploy.

This wasn’t human coding, AI reviewing. This was human directing, AI executing— autonomously, between sessions, while Max lived his day.

---

## Final Stats

| Metric | Number |
|--------|--------|
| Days built | 5 |
| Commits | 312 |
| Autonomous crons | 5 pipelines |
| LLM spend (real) | $613+ |
| Receipts tracked | 142 (x402 + Bankr) |
| Models used | 21 |
| Bounties qualified | 5 |
| UX flags fixed | 17 |
| Pivots | 4 |

---

## What’s Left

- [ ] Devfolio submission (Max auth)
- [ ] Video demo (Max recording)
- [ ] Final screenshots (in progress)

---

*This collaboration log is updated live. Last edit: 2026-03-18 02:01 UTC.*
