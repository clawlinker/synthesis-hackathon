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

### Open questions
- How to hook into x402 payment flow? Middleware? Event listener? Skill wrapper?
- How does the skill learn which skill triggered the payment? (runtime context)
- Sync protocol to pawr.link — push on each receipt? Batch?
- Privacy: which receipts are public vs. private?
- Can we make individual receipts verifiable/shareable? (signed by agent?)

### What makes it special
- Not just a block explorer — it understands agent intent (which service, why)
- Tied to identity — you verify the agent AND see its spending behavior
- The verification library we already built becomes a component, not the whole thing

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
