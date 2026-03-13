# Bankr LLM Gateway Integration — Notes

_Research notes for the Bankr bounty track ($5K)_

## What Bankr LLM Gateway Is
- OpenAI-compatible proxy to 20+ models (Claude, GPT, Gemini, etc.)
- Endpoint: `https://llm.bankr.bot/v1/chat/completions`
- No markup on provider pricing
- Auth: `X-API-Key` header with Bankr LLM key
- Credits separate from trading wallet — top up at bankr.bot/llm
- Rate limit: 60 req/min

## What the Bounty Wants
"Best Bankr LLM Gateway Use" ($5K: 1st $3K / 2nd $1.5K / 3rd $500)
- Autonomous systems on Bankr LLM Gateway
- Self-sustaining economics
- Real onchain outcomes

## Integration Angle
The verification library + our production agent as a complete Bankr-powered loop:

1. **Verify** — agent receives request, uses erc8004-verify to check counterparty
2. **Reason** — routes LLM call through Bankr gateway to decide what to do
3. **Execute** — uses Bankr wallet for onchain transactions
4. **Sustain** — trading fees from agent token fund LLM credits

This makes Bankr the backbone: identity verification triggers reasoning (gateway) triggers execution (wallet), all funded by token economics.

## Technical Integration
- Already have Bankr wallet + skill installed
- LLM Gateway: just add as a provider in OpenClaw config
- Could route cron jobs through Bankr gateway to show usage
- Key: `BANKR_LLM_KEY` needed (we may already have one)

## What We'd Need to Build
- [ ] Set up Bankr LLM Gateway as a provider
- [ ] Route at least some agent operations through it
- [ ] Document the verify → reason → execute → sustain loop
- [ ] Show real LLM credits usage and onchain outcomes
- [ ] Optional: show self-sustaining economics (token fees → credits)

## Self-Sustaining Economics Story
- Our agent earns USDC from pawr.link profile sales (x402)
- Those earnings could fund LLM credits on Bankr
- Agent uses LLM credits to reason about new requests
- Creates more value → earns more → self-sustaining
- This is a real loop, not hypothetical

## Intel from Bankr Team (via X, Mar 13)
They said most builders focus on simple chat-to-trade. They want **autonomous loops** that exploit:
- **57% creator fee share** — self-funding via token launch fees
- **Bankr skills library** — hydrex, veil, botchan, neynar, endaoment
- **Underutilized integrations:** hydrex (LP management), veil (shielded txs)

Their suggested use cases:
1. Self-funding social scout (neynar + token launch → fees fund LLM)
2. Private alpha vault (veil shielded trades → yield funds inference)
3. **Agent-to-agent service economy (botchan)** ← THIS IS US
4. Yield-bearing charity agent (hydrex + endaoment)

### What applies to us
The **agent-to-agent service economy** is literally our angle:
- Our verification library = the trust layer for agents hiring agents
- Agent A verifies Agent B's ERC-8004 identity before transacting
- Payments flow via x402/Bankr
- Both agents fund their own gateway access from revenue

What DOESN'T apply: token launching, yield farming, shielded trading — that's not our identity, and we'd be competing against teams who actually do that.

### Potential enhancement
Could we add **botchan** (onchain agent messaging) to the verification flow?
- Agent sends message via botchan → recipient verifies sender's 8004 identity → trusts and responds
- That's a concrete "agent-to-agent service economy" demo using Bankr infra

## Open Questions
- Do we already have a Bankr LLM key? Check config.
- What's our current Bankr credit balance?
- Should the verification library itself use Bankr gateway for any LLM-powered checks?
  (e.g., "analyze this agent's registration and give a trust score" — AI-powered verification)
- How prominent should Bankr be in the submission vs. a supporting element?
