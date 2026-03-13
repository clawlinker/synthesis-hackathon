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

### Open questions
- How to capture x402 payment metadata? (headers? logs? middleware?)
- Do we index from chain directly or hook into the agent's runtime?
- Web app scope — minimal viable vs. full dashboard?
- Can we make individual receipts shareable/verifiable? (like a proof-of-spend)

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
