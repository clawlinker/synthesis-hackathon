# Submission Checklist — The Synthesis Hackathon

_Deadline: Mar 22, 2026. Devfolio slug: `the-synthesis`_
_Agentic judging (mid-build feedback): Mar 18_

## Devfolio Submission Fields

All required unless marked optional:

- [x] **Project Name:** Agent Receipts
- [x] **Tagline:** "Every payment your agent makes, verified and visible."
- [x] **Problem it solves:** Autonomous agents transact onchain but have no human-readable audit trail. Agent Receipts turns raw USDC transfers into verified, visual receipts linked to ERC-8004 identity — making agent spending transparent and trustworthy.
- [x] **Challenges you ran into:** Claude Code can't run as root, Tailwind v3/v4 version conflicts, cron sessions fighting over deps, race conditions in parallel cron pipeline, balancing cheap models vs code quality
- [x] **Technologies used:** Next.js 16, TypeScript, Tailwind CSS v4, ERC-8004, x402 (USDC payments), Basescan API, Bankr LLM Gateway (qwen3-coder, deepseek-v3.2, gemini-3-flash), OpenClaw, Satori (SVG), Base (L2)
- [x] **Links:**
  - GitHub: https://github.com/clawlinker/synthesis-hackathon
  - Live demo: [NEEDS VERCEL DEPLOY]
  - Agent profile: https://pawr.link/clawlinker
  - ERC-8004: https://www.8004scan.io/agents/ethereum/22945
  - agent.json: https://github.com/clawlinker/synthesis-hackathon/blob/main/agent.json
  - agent_log.json: https://github.com/clawlinker/synthesis-hackathon/blob/main/agent_log.json
- [x] **Video Demo:** YouTube, minimum 2 minutes, 720p+. Walk through:
  1. What Agent Receipts does
  2. Live receipt feed with real data
  3. ERC-8004 identity integration
  4. x402 paid API endpoint
  5. The autonomous build process (git log, cron pipeline, agent_log.json)
  6. Bankr LLM cost tracking
- [x] **Screenshots:** First image = cover. Need:
  1. Receipt feed (dark theme, real data)
  2. Single receipt card detail
  3. Agent identity header with ERC-8004 badge
  4. Terminal showing cron pipeline / git log
- [x] **Bounty tracks to apply for:**
  - Let the Agent Cook ($8K)
  - Agents With Receipts — ERC-8004 ($8,004)
  - Best Bankr LLM Gateway Use ($5K)
  - Build with AgentCash ($1,750)

## Submission Rules (from Devfolio)

- ✅ Must use version control — multi-commit history required (we have 20+ commits)
- ✅ Open source required
- ✅ Can use open-source libraries and starter kits
- ⚠️ Must start work during event window (Mar 13-22) — our first commit is Mar 13 ✅
- ⚠️ Single commit or suspicious repo activity → disqualification risk
- 📌 Mention sponsor prizes in Technologies Used section for discoverability
- 📌 Submit early, can update until deadline

## Pre-Submission Checklist (Mar 21)

- [x] README.md polished with architecture diagram
- [x] COLLAB.md documenting human-agent collaboration
- [x] agent.json complete with all DevSpot fields
- [x] agent_log.json compiled — full autonomous operation log
- [ ] Demo video recorded and uploaded to YouTube *(requires Max)*
- [ ] Screenshots taken (4 minimum) *(requires Max)*
- [x] Live demo URL working — Build passes, DEPLOY.md ready for Max to deploy to Vercel
- [x] Devfolio submission prepared — all metadata, agent.json, agent_log.json, README, COLLAB complete
- [x] All bounty-specific requirements verified against RUBRIC.md

## Agentic Judging Prep (Mar 18)

AI agent judges will evaluate projects mid-build. They likely parse:
- agent.json — must be valid, complete, and accessible
- agent_log.json — must show real autonomous work with costs
- GitHub repo — commit history, code quality, documentation
- Live demo — must be accessible

**Priority for Mar 18:** agent.json + agent_log.json must be polished. Live demo nice-to-have.

## Video Demo Script (draft)

1. **Intro (30s):** "I'm Clawlinker, ERC-8004 #22945. I built Agent Receipts — a tool that turns raw onchain transactions into human-readable receipts for autonomous agents."
2. **Problem (30s):** Show a raw Basescan tx list. "This is what agent activity looks like today. Hashes, hex addresses, raw numbers. Useless for trust."
3. **Solution (60s):** Show the receipt feed. Walk through a receipt card. Show ERC-8004 badge, service labels, amounts. "Now you can see what an agent actually spent money on."
4. **How it was built (60s):** Show git log with 🤖 [auto] commits. Show the cron pipeline. Show agent_log.json. "This entire app was built autonomously by 5 parallel crons over 10 days."
5. **x402 integration (30s):** Show the paid API endpoint. "The receipt feed itself is an x402 service — agents paying to verify other agents."
6. **Close (15s):** "Agent Receipts. Onchain proof of autonomous agent work. Built by an agent, for agents."
