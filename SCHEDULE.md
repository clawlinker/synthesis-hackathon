# Hackathon Schedule — The Synthesis

_Mar 13-22, 2026 (10 days). Submit by Mar 22. Winners Mar 25._

## Day-by-Day Plan

### Day 1 — Mar 13 (Thu) ✅ DONE
**Focus: Discover + Plan**
- ✅ Bounty research (33 tracks mapped)
- ✅ Repo setup, agent.json, agent_log.json
- ✅ ERC-8004 verification library (built + tested)
- ✅ Bankr LLM benchmark (21 models ranked)
- ✅ Autonomous cron infrastructure set up
- ✅ Ideas: receipts, facilitator, trust badge brainstormed

### Day 2 — Mar 14 (Fri)
**Focus: Research + Lock Direction**
- Research: x402 facilitator codebase analysis
- Research: Bankr Agent API data availability
- Research: ERC-8004 ecosystem gaps
- Research: SVG generation options
- Research: competitor/prior art scan
- Re-read bounty criteria word-by-word
- **Decision point: lock the project concept by end of day**
- Crons: 12x autonomous (research tasks), 3x ideation

### Day 3 — Mar 15 (Sat)
**Focus: Architecture + Start Building**
- Finalize technical architecture based on research
- Set up package structure
- Build data models and types
- Start core: Blockscout indexer, address labeler
- Begin receipt enrichment logic
- Crons: 12x autonomous (building), 3x ideation

### Day 4 — Mar 16 (Sun)
**Focus: Build Core**
- Receipt generator (SVG cards)
- Receipt feed API
- ERC-8004 identity integration
- CLI tool
- Tests
- Crons: 12x autonomous (building)

### Day 5 — Mar 17 (Mon)
**Focus: Build Demo**
- Web app (paste address → see receipts)
- Live data from our wallets
- Failed transaction display
- Deploy demo
- Crons: 12x autonomous (building)

### Day 6 — Mar 18 (Tue) ⚠️ AGENTIC JUDGING
**Focus: Demo-Ready MVP**
- Morning: final MVP polish
- Wire up autonomous execution proof (agent_log.json live)
- Bankr LLM cost tracking as receipts
- **Agentic judging feedback — must be demoable**
- Afternoon: absorb feedback, plan iterations
- Crons: 12x autonomous (polish)

### Day 7 — Mar 19 (Wed)
**Focus: Iterate on Feedback**
- Fix issues raised by AI judges
- Add missing features they want to see
- Strengthen weakest track submission
- Crons: 12x autonomous (iterating)

### Day 8 — Mar 20 (Thu)
**Focus: Polish + Documentation**
- README final version
- COLLAB.md complete collaboration log
- agent_log.json compilation (full autonomous operation proof)
- Code cleanup, comments, tests
- Crons: 12x autonomous (docs + polish)

### Day 9 — Mar 21 (Fri)
**Focus: Demo + Presentation**
- Record demo video/walkthrough
- Write submission text for Devfolio
- Final agent.json manifest update
- Dry run: pretend you're a judge, review everything
- Crons: reduced to 6x (don't break things)

### Day 10 — Mar 22 (Sat) 🚨 DEADLINE
**Focus: Submit**
- Morning: final review, last commits
- Submit on Devfolio
- Post announcement (X, Farcaster)
- Crons: minimal (cleanup only)

---

## Always Running (every day)

| What | When | Model |
|------|------|-------|
| Autonomous work sessions | Every 2h | bankr/gemini-3-flash |
| Ideation | 3x/day | bankr/gemini-3-flash |
| GitHub commits | After every autonomous session | — |
| agent_log.json updates | After every autonomous session | — |
| Daily cleanup | 06:00 UTC | bankr/qwen3-coder |
| Memory garden | 2x/day | anthropic/sonnet |
| A2A customer checks | Every 3h | bankr/qwen3-coder |

## Cron Intensity by Phase

| Phase | Days | Autonomous/day | Ideation/day | Notes |
|-------|------|-----------------|--------------|-------|
| Research | 1-2 | 12 | 3 | Heavy ideation |
| Build | 3-6 | 12 | 1 (reduce) | Focus on execution |
| Polish | 7-8 | 12 | 0 (disable) | Don't generate new ideas |
| Submit | 9-10 | 6 (reduce) | 0 | Don't break things |

## Key Dates
- **Mar 18:** Agentic judging feedback (Day 6)
- **Mar 22:** Submission deadline (Day 10)
- **Mar 25:** Winners announced
