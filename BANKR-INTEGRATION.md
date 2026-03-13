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

## Open Questions
- Do we already have a Bankr LLM key? Check config.
- What's our current Bankr credit balance?
- Should the verification library itself use Bankr gateway for any LLM-powered checks?
  (e.g., "analyze this agent's registration and give a trust score" — AI-powered verification)
- How prominent should Bankr be in the submission vs. a supporting element?
