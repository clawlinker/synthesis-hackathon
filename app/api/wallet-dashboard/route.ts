import { NextRequest, NextResponse } from 'next/server'
import { parseTransactions, analyzeWallet } from '@/lib/analyzer'
import { AGENT } from '@/app/types'
import { getCachedSummary } from '@/lib/analysis-cache'

const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2'
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const API_TIMEOUT_MS = 8000
const DEFAULT_LIMIT = 100

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

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

async function fetchUsdcTransfers(
  wallet: string,
  limit: number
): Promise<BlockscoutTx[] | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const url = `${BLOCKSCOUT_API}/addresses/${wallet}/token-transfers?type=ERC-20&token=${USDC_CONTRACT}`
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 }, // Cache for 1 min
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null

    const data = (await res.json()) as BlockscoutV2Response
    if (!data.items || !Array.isArray(data.items)) return []

    return data.items.slice(0, limit).map((item) => ({
      hash: item.transaction_hash,
      from: item.from.hash,
      to: item.to.hash,
      value: item.total.value,
      timeStamp: String(Math.floor(new Date(item.timestamp).getTime() / 1000)),
      blockNumber: String(item.block_number),
      tokenSymbol: item.token.symbol,
      tokenDecimal: item.token.decimals,
    }))
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet || !isValidAddress(wallet)) {
    return NextResponse.json(
      { error: 'Invalid or missing wallet address' },
      { status: 400 }
    )
  }

  const txs = await fetchUsdcTransfers(wallet, DEFAULT_LIMIT)
  if (txs === null) {
    return NextResponse.json(
      { error: 'Failed to fetch transaction data' },
      { status: 502 }
    )
  }

  const parsed = parseTransactions(txs, wallet)
  const analysis = analyzeWallet(parsed)

  // Check for cached LLM summary from a previous paid analysis
  const cached = getCachedSummary(wallet)

  return NextResponse.json(
    {
      wallet,
      chain: 'base',
      analysis,
      llmSummary: cached?.summary || null,
      agent: {
        id: AGENT.id,
        name: AGENT.name,
        ens: AGENT.ens,
        erc8004: `https://www.8004scan.io/agents/ethereum/${AGENT.id}`,
      },
      meta: {
        model: cached?.model || null,
        analyzedAt: new Date().toISOString(),
        txsFetched: txs.length,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
