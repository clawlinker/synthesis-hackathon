# Synthesis Hackathon Rubric — Detailed Scoring Criteria

## 🤖 Let the Agent Cook ($8,000)
- **Autonomous Execution (High weight):** Loop: discover → plan → execute → verify → submit. Must show task decomposition and self-correction.
- **Agent Identity:** Register unique ERC-8004 identity linked to operator wallet. Include TX.
- **Agent Capability Manifest:** `agent.json` with name, wallet, identity, tools, stacks, constraints, categories.
- **Structured Execution Logs:** `agent_log.json` showing decisions, tool calls, retries, failures, final outputs.
- **Tool Use:** Multi-tool orchestration (code, GitHub, blockchain, APIs, deployment).
- **Safety and Guardrails:** Safeguards for transactions, API outputs, unsafe operations, aborting/retrying.
- **Compute Budget Awareness:** Efficient resource usage, tracking session/daily costs, avoiding runaway loops.
- **Bonus:** ERC-8004 trust signals, multi-agent specialized swarms.

## 📜 Agents With Receipts — ERC-8004 ($8,004)
- **ERC-8004 Integration:** Interact with identity/reputation/validation registries via onchain TXs. Multiple registries score higher.
- **Autonomous Agent Architecture:** Planning, execution, verification, and decision loops. Multi-agent coordination encouraged.
- **Agent Identity + Operator Model:** Register 8004 identity linked to operator wallet for reputation history.
- **Onchain Verifiability:** Transactions for registration, reputation updates, and validation credentials viewable on explorer.
- **DevSpot Agent Compatibility:** Implement DevSpot Agent Manifest (agent.json + agent_log.json).

## 💰 Best Bankr LLM Gateway Use ($5,000)
- **Model Usage:** Real execution and onchain outcomes using Bankr LLM Gateway (Claude, Gemini, GPT).
- **Self-sustaining Economics:** Routing revenue (token launch fees, trading, protocol fees) to fund inference.
- **Integration:** Meaningful use of Bankr wallets and tools.

## 💰 Agents that pay ($1,500)
- **x402 Payment Production:** Expose x402-protected API endpoints that charge $0.01 USDC per request for services
- **x402 Payment Consumption:** Actually pay for external data/services via x402 (checkr API, DexScreener, etc.)
- **End-to-End Payment Loop:** Demonstrate agent both earns (produces) AND pays (consumes) via x402
- **Load-bearing Integration:** x402 must be core to functionality, not decorative (e.g., payment is required for access)
- **Real Onchain Proof:** USDC transactions visible on Base/Ethereum block explorer linked to API calls

## 🛠️ Build with AgentCash ($1,750)
- **x402 Consumption/Production:** Use AgentCash (MCP server) to consume x402 endpoints or produce new ones.
- **Load-bearing Integration:** x402 payment layer must be core to the project, not decorative.

## 🏁 Summary Rubric Score (Self-Assessment)
| Criteria | Implementation Status | Rubric Fit |
|----------|-----------------------|------------|
| Autonomous Loop | `agent_log.json` + cron | 10/10 (Core) |
| ERC-8004 Identity | #22945 (Ethereum) | 10/10 (Core) |
| Agent Manifest | `agent.json` (Phase 6) | 10/10 (Core) |
| Multi-tool Use | web, git, shell, api | 10/10 (Core) |
| Safety/Guardrails | SOUL.md + LOG | 10/10 (Core) |
| Budget Awareness | `agent_log.json` tracking | 10/10 (Core) |
| Self-sustaining Econ | Phase 5 (Bankr) | 8/10 (Bonus) |
