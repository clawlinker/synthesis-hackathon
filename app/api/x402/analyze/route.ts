import { NextRequest, NextResponse } from 'next/server'
import { PAYTO_ADDRESS } from '@/app/lib/x402-server'
import { AGENT } from '@/app/types'
import { parseTransactions, analyzeWallet } from '@/lib/analyzer'

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

  const prompt = `You are an onchain analyst. Analyze this wallet's USDC transaction history on Base.
Return a 3-4 sentence summary covering: what this wallet appears to do, its main spending categories, notable patterns, and overall health assessment.
Be specific with dollar amounts and transaction counts. Be concise and direct.

Wallet: ${wallet}
Data: ${JSON.stringify({
    txCount: stats.txCount,
    timeRange: stats.timeRange,
    totalSent: stats.totalSent,
    totalReceived: stats.totalReceived,
    netFlow: stats.netFlow,
    breakdown: stats.breakdown.slice(0, 8),
    topRecipients: stats.topRecipients,
    anomalyCount: stats.anomalies.length,
    healthScore: stats.healthScore,
  })}`

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

  // 7. Return response
  return NextResponse.json(
    {
      wallet,
      chain: 'base',
      analysis: stats,
      llmSummary,
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
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
