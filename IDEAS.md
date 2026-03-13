# Ideas — Brainstorm Log

## 💡 IDEA: Agent Receipts (Mar 13, from Max)

### One-liner
Live receipt feed for autonomous agents — see what your agent spent, verified onchain.

### The problem
You give an agent a wallet and autonomy. It starts spending. You have zero visibility unless you manually check Etherscan. That's terrifying for operators.

### What it does
- Every x402 payment → receipt (service, amount, timestamp, tx hash)
- Every onchain transaction → receipt
- Combined receipts for batched operations ("your agent made 14 API calls today")
- All tied to the agent's ERC-8004 identity
- Live web app that shows receipts as they hit

### For whom
Agent operators who need to know: what is my agent spending, on what, and is it behaving?

### Why it's good for the hackathon
- Bounty is literally called "Agents With Receipts"
- Visual — judges can see a live dashboard
- We can demo with our own agent's real spending data
- Ties ERC-8004 + x402 together naturally
- Simple to explain in one sentence

### Track fit
| Track | Fit |
|-------|-----|
| ERC-8004 "Agents With Receipts" ($8K) | 🎯 PERFECT — it's the name |
| Let the Agent Cook ($8K) | ✅ Shows autonomous agent with audit trail |
| AgentCash/x402 ($1.75K) | ✅ x402 payments = automatic receipts |
| Open Track ($14K) | ✅ Auto-qualify |

### How it could work technically
- Index transactions from agent's wallet address(es)
- Parse x402 payment headers for service info
- Match wallet → ERC-8004 identity via registry
- Web app: real-time feed, filters by service/type/amount
- Optional: receipt aggregation ("weekly spend report")
- Optional: alerts ("agent spent > $X in last hour")

### Distribution: Agent Skill (from Max, Mar 13)
- Ships as an installable skill — `clawhub install agent-receipts`
- Hooks into agent's x402/onchain operations at runtime
- Captures receipts locally (JSON log)
- Optionally syncs to pawr.link server for public receipt page
- Light footprint — doesn't interfere with agent operations

### Failed Transactions (from Max, Mar 13)
- **Failed tx receipts may be MORE valuable than successes**
- x402 payment rejected? Insufficient balance? Contract reverted? Timeout?
- Currently failures just disappear into logs — no structured record
- Receipt with error details + agent context = debugging gold
- Example: "FAILED: tried to pay $0.10 USDC to profile API, reason: 402 insufficient funds, skill: pawr-tasks-api"

### Architecture Sketch
```
Agent Runtime (OpenClaw)
  ↓ (skill hooks into x402/onchain calls)
Receipt Capture Layer
  ↓ captures: success/fail, amount, to, service URL, skill, intent, error
Local Receipt Log (JSON)
  ↓ optional sync
pawr.link Receipt Page (public/private)
  ↓ renders
Visual Receipts (SVG cards, feed, aggregates)
```

### What a receipt contains
- Agent identity (ERC-8004 ID, name, wallet)
- Transaction: hash (if success), amount, token, chain
- Counterparty: address, service name/URL (if known)
- Context: skill name, intent/action description
- Status: success / failed + error details
- Timestamp
- Optional: combined receipt (batch of related txs)

### 🔥 PIVOT: x402 Facilitator as the Receipt Layer (Mar 13)

**Key insight:** The x402 FACILITATOR is the perfect interception point.
- It sits between buyer and seller in every x402 payment
- Sees: buyer address, seller address, amount, service URL, success/failure
- Settles onchain — gets the tx hash
- Open standard — anyone can build a facilitator (CDP, Cronos have theirs)

**New framing:** Build an x402 facilitator that generates receipts tied to ERC-8004 identities.
- Seller points to our facilitator instead of CDP's
- Every payment auto-generates a receipt
- If buyer/seller has 8004 identity → resolved and attached
- Failed payments get error receipts with details
- Receipt feed via API or pawr.link profile widget

**Why stronger than skill approach:**
- No agent-side installation needed (server-side only)
- See both sides of every transaction
- Extends x402 infrastructure (not just using it)
- Directly hits ERC-8004 AND AgentCash/x402 tracks
- Technical: fork coinbase/x402 facilitator, add receipt layer

**Technical approach:**
- Fork CDP facilitator from github.com/coinbase/x402
- Add: receipt storage (JSON/SQLite), ERC-8004 resolution, receipt API
- Add: SVG receipt generation, feed endpoint
- Deploy as service (receipts.pawr.link?)
- Point our own pawr.link x402 endpoints to use it — dog-food immediately

**Can ALSO still have the skill approach:**
- Skill captures agent-side context (which skill, intent)
- Posts context to facilitator API to enrich receipts
- Best of both: facilitator sees the payment, skill adds the why

### Open questions
- How complex is the CDP facilitator codebase? Can we fork it cleanly?
- Storage: SQLite? Postgres? Just JSON files for hackathon?
- Privacy: which receipts are public vs. private?
- Can we make individual receipts verifiable/shareable? (signed by facilitator?)
- Does this need its own domain or can it live under pawr.link?

### What makes it special
- Not just a block explorer — it understands agent intent (which service, why)
- Tied to identity — you verify the agent AND see its spending behavior
- The verification library we already built becomes a component, not the whole thing

### Bankr as a data source (Mar 13, from Max)
Bankr transactions are a natural fit — receipts for ALL agent financial activity, not just x402:

| Source | Captures | How |
|--------|----------|-----|
| x402 facilitator | Agent buying/selling services via x402 | We run the facilitator |
| Bankr wallet | Trades, swaps, token launches, transfers | Onchain indexing (Blockscout) |
| Bankr LLM Gateway | LLM inference costs per call | Job API + credit delta |

This brings Bankr back NATURALLY:
- Not "we use Bankr as our LLM provider" (gimmick)
- Instead: "we give visibility into what agents do through Bankr" (genuinely useful)
- Bankr ecosystem benefits — operators can audit their Bankr agents
- Hits Bankr track because we're building infrastructure FOR their ecosystem

---

## Previous ideas (still on table)

### Verification Library (current build)
"Verify any agent in one line of code"
- Built, tested, works. Could be a component of the receipts idea.

### Agent Trust Badge
Embeddable verified badge for agent cards/sites.

### One-Click ERC-8004 Registration
Simplify the painful registration flow.

### Agent Discovery API
Search + verify + connect to agents.

### Autonomous Agent Starter Kit
Template for production agents with identity/payments/safety.
