import { NextResponse } from 'next/server'
import { resolveAgent, AGENT_REGISTRY } from '@/data/erc8004-resolver'
import { type Receipt } from '@/app/types'
import { sampleReceipts } from '@/data/sample-receipts'
import { ADDRESS_LABELS, CONTRACTS } from '@/data/config'

const BASESCAN_API = 'https://base.blockscout.com/api'

// Simple in-memory cache
const cacheStore = new Map<string, { data: unknown; expiry: number }>()

function getFromCache(key: string): unknown | undefined {
  const entry = cacheStore.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiry) {
    cacheStore.delete(key)
    return undefined
  }
  return entry.data
}

function setInCache(key: string, data: unknown, ttlSeconds: number): void {
  cacheStore.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  })
}

// Validate tx hash format
function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

// Get agent identity from address with enrichment
function getAgentWithIdentity(address: string) {
  const normalized = address.toLowerCase()
  const agent = resolveAgent(normalized)
  
  if (agent) {
    return {
      ...agent,
      label: ADDRESS_LABELS[normalized],
    }
  }
  
  return {
    wallet: address,
    label: ADDRESS_LABELS[normalized],
    id: undefined,
    name: undefined,
    ens: undefined,
    avatar: undefined,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ txhash: string }> }
) {
  try {
    const { txhash } = await params
    
    if (!isValidTxHash(txhash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format. Expected 0x + 64 hex characters.' },
        { status: 400 }
      )
    }

    // Check cache first (short-term cache for verification requests)
    const cacheKey = `verify:${txhash}`
    const cached = getFromCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached, { 
        headers: { 
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300',
        } 
      })
    }

    // Fetch transaction from Blockscout
    const searchParams = new URLSearchParams({
      module: 'transaction',
      action: 'gettxinfo',
      txhash: txhash,
    })

    const res = await fetch(`${BASESCAN_API}?${searchParams}`, {
      next: { revalidate: 300 }, // cache 5 minutes
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch transaction from Blockscout', txhash },
        { status: 502 }
      )
    }

    const data = await res.json() as {
      status: string
      message: string
      result: {
        hash: string
        from: string
        to: string
        value: string
        tokenSymbol?: string
        timeStamp: string
        blockNumber: string
        isError?: string
        input?: string
      }[]
    }

    if (data.status !== '1' || !data.result || data.result.length === 0) {
      // Transaction not found or error
      return NextResponse.json(
        { 
          error: 'Transaction not found or unavailable',
          txhash,
          status: data.status,
          message: data.message,
        },
        { status: 404 }
      )
    }

    const tx = data.result[0]

    // Verify transaction status
    const isConfirmed = tx.blockNumber !== '0' && tx.isError !== '1'
    const isError = tx.isError === '1'

    // Enrich with agent identities
    const fromAgent = getAgentWithIdentity(tx.from)
    const toAgent = getAgentWithIdentity(tx.to)

    // Determine service from contract addresses
    const toLower = tx.to.toLowerCase()
    const fromLower = tx.from.toLowerCase()
    
    let service: string | undefined
    if (toLower === CONTRACTS.X402_FACILITATOR.toLowerCase()) {
      service = ADDRESS_LABELS[CONTRACTS.X402_FACILITATOR.toLowerCase()]
    } else if (toLower === CONTRACTS.VIRTUALS_ACP.toLowerCase()) {
      service = ADDRESS_LABELS[CONTRACTS.VIRTUALS_ACP.toLowerCase()]
    } else if (fromLower === CONTRACTS.X402_FACILITATOR.toLowerCase()) {
      service = 'x402 Facilitator (refund/return)'
    } else if (fromLower === CONTRACTS.VIRTUALS_ACP.toLowerCase()) {
      service = 'Virtuals ACP (refund/return)'
    }

    // Check if it's a USDC transfer
    const isUSDC = 
      tx.tokenSymbol?.toUpperCase() === 'USDC' ||
      toLower === CONTRACTS.USDC_CONTRACT.toLowerCase() ||
      fromLower === CONTRACTS.USDC_CONTRACT.toLowerCase()

    // Build verification result
    const verificationResult: {
      txhash: string
      verified: boolean
      timestamp: string
      data: {
        blockNumber: number
        confirmed: boolean
        error: boolean
        from: typeof fromAgent
        to: typeof toAgent
        value: string
        amountUsd?: number
        service?: string
        isUSDC: boolean
        tokenSymbol?: string
      }
      meta: {
        source: 'Blockscout'
        verifiedBy: 'Clawlinker Molttail'
        erc8004Resolve: boolean
      }
    } = {
      txhash,
      verified: true,
      timestamp: new Date().toISOString(),
      data: {
        blockNumber: parseInt(tx.blockNumber),
        confirmed: isConfirmed,
        error: isError,
        from: fromAgent,
        to: toAgent,
        value: tx.value,
        amountUsd: parseInt(tx.value) / 1e6,
        service,
        isUSDC,
        tokenSymbol: tx.tokenSymbol,
      },
      meta: {
        source: 'Blockscout',
        verifiedBy: 'Clawlinker Molttail',
        erc8004Resolve: !!resolveAgent(tx.from) || !!resolveAgent(tx.to),
      },
    }

    // Cache the result
    setInCache(cacheKey, verificationResult, 300)

    return NextResponse.json(verificationResult, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal verification error', details: String(error) },
      { status: 500 }
    )
  }
}
