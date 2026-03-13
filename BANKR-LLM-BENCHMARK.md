# Bankr LLM Benchmark Results

_Test: "Build a TypeScript function for Blockscout ERC-20 transfers with types, error handling, JSDoc." Same prompt to all 21 models._

_Date: Mar 13, 2026 | Gateway: llm.bankr.bot_

## Results (sorted by cost, cheapest first)

| Model | $/M in | $/M out | Time | OutTok | Fn | Types | JSDoc | Lines | Verdict |
|-------|--------|---------|------|--------|----|----|-------|-------|---------|
| GPT-5 Nano | $0.05 | $0.40 | 25.7s | — | ❌ | — | — | — | **FAIL** — no response |
| Qwen3.5 Flash | $0.10 | $0.40 | 27.6s | 3680 | ✅ | ✅ | ❌ | 44 | Verbose, missing JSDoc |
| Qwen3 Coder | $0.12 | $0.75 | 3.5s | 505 | ✅ | ✅ | ✅ | 51 | ⭐ **Best value** — fast, complete, cheap |
| Grok 4.1 Fast | $0.20 | $0.50 | 15.2s | 2619 | ✅ | ✅ | ✅ | 52 | Good but verbose output |
| GPT-5 Mini | $0.25 | $2.00 | 25.5s | 1742 | ✅ | ✅ | ✅ | 113 | Solid but slow |
| DeepSeek V3.2 | $0.26 | $0.38 | 12.7s | 584 | ✅ | ✅ | ✅ | 85 | Good, cheapest output |
| Qwen3.5 Plus | $0.26 | $1.56 | 57.1s | 2984 | ✅ | ✅ | ✅ | 63 | ⚠️ Very slow (57s) |
| MiniMax M2.5 | $0.27 | $0.95 | 27.0s | 2837 | ✅ | ✅ | ✅ | 49 | Decent, a bit slow |
| Gemini 2.5 Flash | $0.30 | $2.50 | 11.3s | 80 | ❌ | ✅ | ✅ | 11 | ⚠️ Truncated — too concise |
| Kimi K2.5 | $0.45 | $2.20 | 27.6s | 1284 | ✅ | ✅ | ✅ | 54 | Solid, slow |
| Gemini 3 Flash | $0.50 | $3.00 | 7.3s | 651 | ✅ | ✅ | ✅ | 67 | ⭐ Great balance — fast + complete |
| Claude Haiku 4.5 | $1.00 | $5.00 | 5.3s | 780 | ✅ | ✅ | ✅ | 95 | ⭐ Fast + thorough |
| Gemini 2.5 Pro | $1.25 | $10.00 | 19.5s | 109 | ✅ | ✅ | ✅ | 13 | Very concise but correct |
| GPT-5.2 | $1.75 | $14.00 | 14.5s | 1094 | ✅ | ✅ | ✅ | 102 | Detailed |
| GPT-5.2 Codex | $1.75 | $14.00 | 13.5s | 1049 | ✅ | ✅ | ✅ | 67 | Code-focused, good |
| Gemini 3 Pro | $2.00 | $12.00 | 16.2s | 533 | ✅ | ✅ | ✅ | 67 | Solid |
| GPT-5.4 | $2.50 | $15.00 | 9.1s | 674 | ✅ | ✅ | ✅ | 103 | Premium quality |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 14.7s | 1122 | ✅ | ✅ | ✅ | 128 | Thorough, detailed |
| Claude Sonnet 4.5 | $3.00 | $15.00 | 8.2s | 586 | ✅ | ✅ | ✅ | 73 | Concise + quality |
| Claude Opus 4.5 | $5.00 | $25.00 | 7.2s | 493 | ✅ | ✅ | ✅ | 63 | Premium |
| Claude Opus 4.6 | $5.00 | $25.00 | 15.9s | 1049 | ✅ | ✅ | ✅ | 122 | Premium |

## Recommendations for Autonomous Work

### 🏆 Best Price/Performance
1. **Qwen3 Coder** ($0.12/$0.75) — 3.5s, all checks pass, concise. Best bang for buck.
2. **Gemini 3 Flash** ($0.50/$3.00) — 7.3s, complete, well-structured. Reliable workhorse.
3. **DeepSeek V3.2** ($0.26/$0.38) — cheapest output, solid quality. Good for generation-heavy tasks.

### ⚠️ Avoid
- **GPT-5 Nano** — failed to produce any output on this task
- **Qwen3.5 Plus** — 57 seconds is unacceptable
- **Gemini 2.5 Flash** — over-compressed output, missed the function requirement

### Tiered Strategy
| Task Type | Model | Why |
|-----------|-------|-----|
| Code generation | Qwen3 Coder | Cheapest passing model, code-specialized |
| Research/summarization | DeepSeek V3.2 | Cheap output, good comprehension |
| Complex reasoning | Gemini 3 Flash | Reliable, good context window |
| Quality-critical | Claude Haiku 4.5 (Bankr) | Best cheap Anthropic model |
| Main session | Claude Opus 4.6 (Anthropic direct) | Quality for Max conversations |
| Subagent work | Claude Sonnet 4.6 (Anthropic direct) | Per Max's preference |
