# Product Thinking — Open Questions

_Working doc. Iterate throughout the hack._

## Core Concept
Open-source toolkit for verifying ERC-8004 agent identities.
Plug in an agent ID → get a verified trust report.

## Angle
**Tool-first.** The library is the deliverable. Clawlinker (our production agent) is the reference implementation / proof it works.

## What exists today (Day 1)
- TypeScript library: `@clawlinker/erc8004-verify`
- Takes an agentId, resolves onchain → returns ownership, registration, services, x402 support, endpoint health
- Live-tested against Agent #22945 (us) — 12/13 checks pass

## Open Questions

### Who is the user?
- Developers building agents? (npm install in their code)
- Agent platforms/orchestrators? (middleware that gates requests)
- Agents themselves? (automated trust checks before transacting)
- Judges evaluating hackathon projects? (meta — the tool evaluates agents like theirs)
- All of the above?

### How do they get an agent ID?
- Currently: must already know it (8004scan, agent card, advertising)
- Better: resolve from address (reverse lookup), ENS, or A2A agent card
- Best: automatic — embedded in agent-to-agent handshake

### What form should it take?
- **Library** (current): `npm install`, call in code. Developer-only.
- **CLI**: `npx erc8004-verify 22945` — quick check from terminal
- **API endpoint**: `GET /verify/22945` — any language, any platform
- **Express middleware**: `app.use(erc8004Verify())` — gates incoming A2A requests
- **UI/Dashboard**: paste address or ID, see visual trust report
- **All of the above**: library as core, thin wrappers for each surface

### What's the "aha moment"?
- For a developer: "I can verify any agent's identity in one line"
- For a judge: "This agent built tooling that verifies agents like mine"
- For the ecosystem: "This is the trust layer ERC-8004 was missing"

### Scope for hackathon (10 days)
What's realistic to ship well vs. what's spreading too thin?
- Core library ✅ (done)
- CLI wrapper (easy win, 1-2 hours)
- API endpoint (easy win, 1-2 hours)  
- Express/A2A middleware (medium, 4-6 hours)
- Reverse lookup / address → agentId (needs contract indexing, harder)
- UI dashboard (medium-hard, depends on scope)

### Competitive landscape
- Does anything like this exist already? (Not that we've found)
- 8004scan.io does exploration but not programmatic verification
- No npm library for ERC-8004 verification exists

### How does this connect to our bounty targets?
| Bounty | Connection |
|--------|-----------|
| Protocol Labs — ERC-8004 ($8K) | Direct — we built tooling for the spec |
| Protocol Labs — Autonomous Agent ($8K) | Our agent uses the tooling in production |
| Bankr — LLM Gateway ($5K) | Our agent uses Bankr to operate autonomously |
| Merit Systems — AgentCash/x402 ($1.75K) | Verified agents can pay/get paid via x402 |
| MetaMask — Delegations ($5K) | Stretch — could verify delegated agent permissions |
| Open Track ($14K) | Auto-qualify |

## Name / Tagline Brainstorm
_Working title: "Trusted Agent Commerce" — too generic_

Names to consider:
- Something that signals "verification" or "trust" for agents
- Should be memorable, not corporate
- Could reference ERC-8004 directly or not

Taglines to consider:
- "Verify any agent in one line"
- "The trust layer for autonomous agents"
- "Know who you're dealing with"

## Notes from Max
- Tool angle > showcase angle (Mar 13)
- Think about who plugs in the ID and where they get it
- Iterate on name/tagline throughout
- Don't overbuild — discuss first, then build what matters
- **KEEP IT SIMPLE.** One sentence pitch. Loops and flowcharts lose judges.
- No botchan. XMTP possible but complex.
- No MetaMask (dropped).
- Bankr integration should be one clear thing, not a convoluted economic loop.
- The pitch: "Verify any AI agent's identity in one line of code."
