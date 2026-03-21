import { NextRequest, NextResponse } from 'next/server'
import { PAYTO_ADDRESS } from '@/app/lib/x402-server'
import { AGENT } from '@/app/types'
import { parseTransactions, analyzeWallet } from '@/lib/analyzer'
import { cacheSummary } from '@/lib/analysis-cache'

// Re-export AGENT with AgentInfo type for compatibility
const ANALYZE_AGENT = {
  id: AGENT.id,
  name: AGENT.name,
  ens: AGENT.ens,
}

// ─── Constants ───────────────────────────────────────────

const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2'
const BANKR_LLM_URL = 'https://llm.bankr.bot/v1/chat/completions'
const BANKR_MODEL = 'qwen3-coder'

const API_TIMEOUT_MS = 6000
const LLM_TIMEOUT_MS = 10000
const MAX_TX_LIMIT = 200
const DEFAULT_TX_LIMIT = 100

const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const PAYMENT_REQUIREMENTS = {
  scheme: 'exact' as const,
  network: 'base',
  maxAmountRequired: '500000', // $0.50 in 6-decimal USDC
  asset: USDC_CONTRACT, // Required by x402-fetch v1
  resource: 'https://molttail.vercel.app/api/x402/analyze',
  description: 'Wallet spending analysis - categorized USDC transaction history with AI insights',
  mimeType: 'application/json',
  payTo: PAYTO_ADDRESS,
  maxTimeoutSeconds: 300,
}

// ─── Validation ──────────────────────────────────────────

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

// ─── Blockscout Fetch ────────────────────────────────────

// Normalized tx format (converted from Blockscout v2)
interface BlockscoutTx {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  blockNumber: string
  tokenSymbol: string
  tokenDecimal: string
}

// Blockscout v2 raw response types
interface BlockscoutV2Transfer {
  transaction_hash: string
  from: { hash: string }
  to: { hash: string }
  total: { value: string; decimals: string }
  timestamp: string
  block_number: number
  token: { symbol: string; decimals: string }
}

interface BlockscoutV2Response {
  items: BlockscoutV2Transfer[]
  next_page_params: Record<string, string> | null
}

async function fetchUsdcTransfers(
  wallet: string,
  limit: number
): Promise<{ txs: BlockscoutTx[]; partial: boolean } | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const url = `${BLOCKSCOUT_API}/addresses/${wallet}/token-transfers?type=ERC-20&token=${USDC_CONTRACT}`
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 30 },
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null

    const data = (await res.json()) as BlockscoutV2Response

    if (!data.items || !Array.isArray(data.items)) {
      return { txs: [], partial: false }
    }

    // Convert v2 format to normalized format, limit results
    const items = data.items.slice(0, limit)
    const txs: BlockscoutTx[] = items.map((item) => ({
      hash: item.transaction_hash,
      from: item.from.hash,
      to: item.to.hash,
      value: item.total.value,
      timeStamp: String(Math.floor(new Date(item.timestamp).getTime() / 1000)),
      blockNumber: String(item.block_number),
      tokenSymbol: item.token.symbol,
      tokenDecimal: item.token.decimals,
    }))

    return {
      txs,
      partial: data.next_page_params !== null || data.items.length > limit,
    }
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── LLM Summary ─────────────────────────────────────────

async function generateLlmSummary(
  wallet: string,
  stats: ReturnType<typeof analyzeWallet>
): Promise<string | null> {
  const apiKey = process.env.BANKR_API_KEY
  if (!apiKey) return null

  // Compute derived metrics for richer analysis
  const sentNum = parseFloat(stats.totalSent)
  const recvNum = parseFloat(stats.totalReceived)
  const days = stats.timeRange.days || 1
  const dailyBurn = sentNum / days
  const topCounterpartyPct = stats.breakdown.length > 0 ? stats.breakdown[0].pct : 0
  const uniqueCounterparties = stats.breakdown.length
  const hasRevenue = recvNum > 0
  const runwayDays = dailyBurn > 0 && sentNum > recvNum ? Math.round(recvNum / dailyBurn) : null

  const prompt = `You are a senior on-chain spending analyst. Produce a concise, insight-dense assessment of this wallet's USDC activity on Base.

## Your Task
Write 3-4 sentences that answer:
1. **What is this wallet?** (builder agent, trader, service provider, treasury, consumer — infer from counterparties and flow direction)
2. **Where does the money go?** (top spending categories by name, not address — use labels when available)
3. **Is anything notable?** (anomalies, spending velocity changes, revenue vs cost imbalance, new unknown recipients)
4. **Bottom line** — is this wallet healthy, and what's the one thing to watch?

## Rules
- Lead with the INSIGHT, not the data. "This wallet burns $${dailyBurn.toFixed(2)}/day on inference" > "The wallet has sent $X over Y days."
- Use service names from labels, never raw addresses.
- Be specific: dollar amounts (2 decimals), percentages, tx counts.
- If revenue exists, calculate and mention the profit/loss margin.
- High spend to a core infrastructure provider (LLM inference, compute) is EXPECTED for an agent — do NOT flag it as "concentration risk." Only flag if spending goes to unknown or suspicious addresses.
- No filler phrases. No "Based on the data provided." Just analyze.
- 3-4 sentences max. Every word must earn its place.

## Wallet Data
Address: ${wallet}
Period: ${stats.timeRange.days} days (${stats.timeRange.first?.slice(0, 10) || '?'} → ${stats.timeRange.last?.slice(0, 10) || '?'})
Transactions: ${stats.txCount}
Sent: $${stats.totalSent} | Received: $${stats.totalReceived} | Net: $${stats.netFlow}
Daily burn rate: $${dailyBurn.toFixed(2)}/day
${runwayDays !== null ? `Estimated runway: ${runwayDays} days at current burn` : 'Revenue covers or exceeds spend'}
Unique counterparties: ${uniqueCounterparties}
Top counterparty concentration: ${topCounterpartyPct}%
${hasRevenue ? `Revenue streams detected: $${stats.totalReceived} inbound` : 'No inbound revenue detected'}
Health score: ${stats.healthScore}/100

Spending breakdown (top 8):
${stats.breakdown.slice(0, 8).map(b => `  ${b.category}: $${b.amount} (${b.count} txs, ${b.pct}%)`).join('\n')}

Top recipients:
${stats.topRecipients.map(r => `  ${r.label}: $${r.amount} (${r.count} txs)`).join('\n')}

Anomalies flagged: ${stats.anomalies.length}${stats.anomalies.length > 0 ? '\n' + stats.anomalies.slice(0, 3).map(a => `  $${a.amount} — ${a.reason}`).join('\n') : ''}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

  try {
    const res = await fetch(BANKR_LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: BANKR_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── Route Handler ───────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. x402 Payment Gate
  const paymentHeader =
    req.headers.get('X-PAYMENT') || req.headers.get('x-payment')

  if (!paymentHeader) {
    return NextResponse.json(
      {
        x402Version: 1,
        accepts: [PAYMENT_REQUIREMENTS],
        error: 'Payment Required',
        description:
          'Pay $0.50 USDC to analyze any wallet\'s USDC transaction history on Base.',
        facilitator: 'https://facilitator.x402.org',
        usage: {
          example: 'GET /api/x402/analyze?wallet=0x5793BFc1331538C5A8028e71Cc22B43750163af8',
          params: {
            wallet: 'Ethereum address to analyze (required)',
            limit: `Max transactions to fetch (default ${DEFAULT_TX_LIMIT}, max ${MAX_TX_LIMIT})`,
          },
        },
        agent: {
          id: ANALYZE_AGENT.id,
          name: ANALYZE_AGENT.name,
          ens: ANALYZE_AGENT.ens,
        },
      },
      {
        status: 402,
        headers: {
          'X-PAYMENT-REQUIREMENTS': JSON.stringify([PAYMENT_REQUIREMENTS]),
        },
      }
    )
  }

  // 2. Verify payment (skip in dev/mock mode)
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.X402_MOCK_VERIFICATION !== 'true'
  ) {
    try {
      const verifyRes = await fetch('https://facilitator.x402.org/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: paymentHeader,
          paymentRequirements: PAYMENT_REQUIREMENTS,
        }),
      })

      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: 'Payment verification failed' },
          { status: 402 }
        )
      }
    } catch {
      // Facilitator down — allow through to avoid stuck payments
    }
  }

  // 3. Parse params
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get('wallet')
  const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_TX_LIMIT))
  const limit = Math.min(Math.max(1, limitParam), MAX_TX_LIMIT)

  if (!wallet || !isValidAddress(wallet)) {
    return NextResponse.json(
      {
        error: 'Invalid or missing wallet address',
        detail: 'Provide a valid Ethereum address as ?wallet=0x...',
      },
      { status: 400 }
    )
  }

  // 4. Fetch transactions from Blockscout
  const result = await fetchUsdcTransfers(wallet, limit)

  if (result === null) {
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction data from Blockscout',
        detail: 'The blockchain explorer API timed out or returned an error. Try again shortly.',
      },
      { status: 502 }
    )
  }

  // 5. Parse and analyze
  const parsedTxs = parseTransactions(result.txs, wallet)
  const stats = analyzeWallet(parsedTxs)

  // 6. LLM summary (non-blocking — returns null on failure)
  let llmSummary: string | null = null
  if (stats.txCount > 0) {
    llmSummary = await generateLlmSummary(wallet, stats)
  }

  // 7. Cache summary for free dashboard access
  if (llmSummary) {
    cacheSummary(wallet, llmSummary, BANKR_MODEL)
  }

  // 8. Build dashboard URL for the agent's human
  const dashboardUrl = `https://molttail.vercel.app/wallet/${wallet}`

  // 9. Return response
  return NextResponse.json(
    {
      wallet,
      chain: 'base',
      analysis: stats,
      llmSummary,
      dashboardUrl,
      ...(result.partial
        ? {
            note: `Results limited to ${limit} most recent transactions. This wallet may have more history.`,
          }
        : {}),
      agent: {
        id: ANALYZE_AGENT.id,
        name: ANALYZE_AGENT.name,
        ens: ANALYZE_AGENT.ens,
        erc8004: `https://www.8004scan.io/agents/ethereum/${ANALYZE_AGENT.id}`,
      },
      meta: {
        model: llmSummary ? BANKR_MODEL : null,
        analysisCostUsd: llmSummary ? 0.005 : 0,
        x402Price: '0.50',
        currency: 'USDC',
        network: 'base',
        analyzedAt: new Date().toISOString(),
        txsFetched: result.txs.length,
        dashboardUrl,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
