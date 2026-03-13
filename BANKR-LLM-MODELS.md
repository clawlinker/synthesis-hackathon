# Bankr LLM Gateway — Full Model Pricing

_Source: bankr.bot/llm (Mar 13, 2026). No markup on provider pricing._

## Cheapest First (by input cost)

| Model | In $/M | Out $/M | Cache Read | Context | Provider | Notes |
|-------|--------|---------|------------|---------|----------|-------|
| GPT-5 Nano | $0.05 | $0.40 | $0.005 | 400K | OpenAI | 🏆 Cheapest overall |
| Qwen3.5 Flash | $0.10 | $0.40 | — | 1M | Alibaba | Huge context, dirt cheap |
| Qwen3 Coder | $0.12 | $0.75 | $0.06 | 262K | Alibaba | Code-specialized |
| Grok 4.1 Fast | $0.20 | $0.50 | $0.05 | 2M | xAI | 2M context! |
| GPT-5 Mini | $0.25 | $2.00 | $0.03 | 400K | OpenAI | |
| DeepSeek V3.2 | $0.26 | $0.38 | $0.13 | 164K | DeepSeek | Cheapest output |
| Qwen3.5 Plus | $0.26 | $1.56 | — | 1M | Alibaba | |
| MiniMax M2.5 | $0.27 | $0.95 | $0.03 | 197K | MiniMax | 197K max output! |
| Gemini 2.5 Flash | $0.30 | $2.50 | $0.03 | 1M | Google | |
| Kimi K2.5 | $0.45 | $2.20 | $0.23 | 262K | Moonshot | |
| Gemini 3 Flash | $0.50 | $3.00 | $0.05 | 1M | Google | |
| Claude Haiku 4.5 | $1.00 | $5.00 | $0.10 | 200K | Anthropic | |
| Gemini 2.5 Pro | $1.25 | $10.00 | $0.13 | 1M | Google | |
| GPT-5.2 | $1.75 | $14.00 | $0.17 | 400K | OpenAI | |
| GPT-5.2 Codex | $1.75 | $14.00 | $0.17 | 400K | OpenAI | Code-specialized |
| Gemini 3 Pro | $2.00 | $12.00 | $0.20 | 1M | Google | |
| GPT-5.4 | $2.50 | $15.00 | $0.25 | 1.1M | OpenAI | |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $0.30 | 1M | Anthropic | |
| Claude Sonnet 4.5 | $3.00 | $15.00 | $0.30 | 1M | Anthropic | |
| Claude Opus 4.5 | $5.00 | $25.00 | $0.50 | 200K | Anthropic | |
| Claude Opus 4.6 | $5.00 | $25.00 | $0.50 | 1M | Anthropic | |

## Tiers for Autonomous Work

### 🟢 Ultra-Cheap (< $0.30/M in) — use for bulk/simple tasks
- GPT-5 Nano ($0.05/$0.40) — cheapest, good for simple extraction
- Qwen3.5 Flash ($0.10/$0.40) — 1M context at 10 cents
- Qwen3 Coder ($0.12/$0.75) — code tasks
- Grok 4.1 Fast ($0.20/$0.50) — 2M context, very cheap output
- DeepSeek V3.2 ($0.26/$0.38) — cheapest output of all

### 🟡 Budget (< $1/M in) — good balance
- Gemini 2.5 Flash ($0.30/$2.50)
- Gemini 3 Flash ($0.50/$3.00)
- Kimi K2.5 ($0.45/$2.20)

### 🟠 Mid-Tier — when quality matters
- Claude Haiku 4.5 ($1/$5)
- Gemini 2.5 Pro ($1.25/$10)

### 🔴 Premium — via Anthropic direct, not Bankr
- Sonnet, Opus on Anthropic subscription

## TODO: Benchmark
- [ ] Run same prompt across all 21 models
- [ ] Score: quality (1-10), speed (seconds), cost per run
- [ ] Produce ranked price/performance table
- [ ] Identify best model per task type (code, research, summarization, reasoning)
