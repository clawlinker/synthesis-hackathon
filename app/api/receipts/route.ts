import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { AGENT, BANKR_AGENT, type Receipt, CHAINS, type ChainKey } from '@/app/types'
import sampleReceipts from '@/data/sample-receipts.json'
import { ADDRESS_LABELS, CONTRACTS, RATE_LIMIT, SERVICE_LABELS } from '@/data/config'
import { AGENT_REGISTRY, resolveAgent } from '@/data/erc8004-resolver'
import { sampleInferenceReceipts } from '@/data/inference-receipts'
import type { BasescanApiResponse } from '@/data/types'
// Import agent_log.json as a module — bundled at build time, no fs.readFileSync on serverless
import agentLogRaw from '@/agent_log.json'

// Basescan V1 deprecated — use Blockscout's etherscan-compatible API (free, no key needed)
const BASESCAN_API = 'https://api.basescan.org/api'
const ETH_BLOCKSCOUT_API = 'https://api.etherscan.io/api'

// API fetch timeout per-request
const API_TIMEOUT_MS = 3000

// Overall route timeout — return sample data if everything takes too long
const ROUTE_TIMEOUT_MS = 8000

// Rate limiting helpers
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}

const rateLimitCache = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitCache.get(ip)
  
  if (!entry || now > entry.reset) {
    rateLimitCache.set(ip, { count: 0, reset: now + RATE_LIMIT.windowMs })
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 }
  }
  
  if (entry.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - entry.count }
}

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

function getServiceFromTx(tx: { to: string; from: string }, wallet: string): string | undefined {
  const to = tx.to.toLowerCase()
  const from = tx.from.toLowerCase()
  const other = from === wallet.toLowerCase() ? to : from
  
  // Check against hardcoded contract addresses first
  if (other === CONTRACTS.X402_FACILITATOR.toLowerCase()) return SERVICE_LABELS[CONTRACTS.X402_FACILITATOR.toLowerCase()]
  if (other === CONTRACTS.VIRTUALS_ACP.toLowerCase()) return SERVICE_LABELS[CONTRACTS.VIRTUALS_ACP.toLowerCase()]
  
  return labelAddress(other)
}

interface EnrichedReceipt {
  hash: string
  from: string
  to: string
  value: string
  amount: string
  timestamp: number
  blockNumber: string
  direction: 'sent' | 'received'
  status: 'confirmed'
  tokenSymbol: string
  tokenDecimal: string
  agentId: string
  service?: string
  fromLabel?: string
  toLabel?: string
  fromAgent?: { id: number; name: string; ens?: string; avatar?: string }
  toAgent?: { id: number; name: string; ens?: string; avatar?: string }
}

function enrichReceiptWithAgentData(tx: { from: string; to: string }): Partial<EnrichedReceipt> {
  const fromAgent = resolveAgent(tx.from)
  const toAgent = resolveAgent(tx.to)
  
  return {
    fromAgent: fromAgent ? {
      id: fromAgent.id,
      name: fromAgent.name,
      ens: fromAgent.ens,
      avatar: fromAgent.avatar,
    } : undefined,
    toAgent: toAgent ? {
      id: toAgent.id,
      name: toAgent.name,
      ens: toAgent.ens,
      avatar: toAgent.avatar,
    } : undefined,
  }
}

// Load inference receipts from bundled agent_log.json (no fs I/O at runtime)
function loadInferenceReceiptsFromLog(): Receipt[] {
  try {
    const logs = agentLogRaw as Array<{
      timestamp: string
      model: string
      model_cost_usd: number
      action?: string
      description?: string
      phase?: string
    }>
    
    // Filter for LLM-powered entries and convert to inference receipts
    const inferenceReceipts: Receipt[] = logs
      .filter((entry) => entry.model && entry.model_cost_usd && entry.model_cost_usd > 0)
      .map((entry, index) => {
        const timestamp = Date.parse(entry.timestamp) / 1000
        return {
          hash: `inference-${index}-${entry.timestamp}`,
          from: '0x0000000000000000000000000000000000000000',
          to: AGENT.wallet,
          value: Math.round(entry.model_cost_usd * 1e6).toString(),
          amount: entry.model_cost_usd.toFixed(6),
          timestamp: Math.floor(timestamp),
          blockNumber: '0',
          direction: 'received' as const,
          status: 'confirmed' as const,
          tokenSymbol: 'USD',
          tokenDecimal: '6',
          service: `Bankr LLM — ${entry.action || entry.phase || 'inference'} (${entry.model.split('/')[1] || 'unknown'})`,
          agentId: AGENT.id.toString(),
          notes: entry.description || 'LLM-powered autonomous operation',
        }
      })
    
    return inferenceReceipts
  } catch (e) {
    console.warn('Failed to parse inference receipts from agent_log.json:', e)
    return []
  }
}

async function fetchReceipts(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request)
  const { allowed, remaining } = checkRateLimit(clientIp)
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  try {
    const url = new URL(request.url)
    const walletParam = url.searchParams.get('wallet')
    const chainParam = url.searchParams.get('chain') as ChainKey | null
    const includeInference = url.searchParams.get('inference') !== 'false' // default to true
    
    // Determine which chain to use
    const chain: ChainKey = chainParam || 'base'
    const useBase = chain === 'base'
    
    // Determine which wallet(s) to fetch
    let walletsToFetch: { wallet: string; name: string; agentId: string }[] = []
    
    if (walletParam) {
      // Single wallet specified
      const lowerWallet = walletParam.toLowerCase()
      if (lowerWallet === AGENT.wallet.toLowerCase()) {
        walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      } else if (lowerWallet === BANKR_AGENT.wallet.toLowerCase()) {
        walletsToFetch.push({ wallet: BANKR_AGENT.wallet, name: 'Bankr', agentId: BANKR_AGENT.id.toString() })
      } else {
        // Default to Clawlinker if unknown wallet
        walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      }
    } else {
      // No wallet specified - fetch both
      walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      walletsToFetch.push({ wallet: BANKR_AGENT.wallet, name: 'Bankr', agentId: BANKR_AGENT.id.toString() })
    }
    
    const contractAddress = useBase ? CONTRACTS.USDC_CONTRACT : CONTRACTS.ETH_USDC_CONTRACT
    const apiBase = useBase ? BASESCAN_API : ETH_BLOCKSCOUT_API

    // Fetch all wallets in parallel with Promise.allSettled
    const fetchPromises = walletsToFetch.map(async ({ wallet, agentId }) => {
      const params = new URLSearchParams({
        module: 'account',
        action: 'tokentx',
        address: wallet,
        contractaddress: contractAddress,
        sort: 'desc',
        page: '1',
        offset: '50',
      })

      if (process.env.BASESCAN_API_KEY) {
        params.set('apikey', process.env.BASESCAN_API_KEY)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

      try {
        const res = await fetch(`${apiBase}?${params}`, {
          next: { revalidate: 60 },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          console.warn(`Blockscout API error for ${wallet}: ${res.status}`)
          return []
        }

        const data = await res.json() as BasescanApiResponse

        if (data.status !== '1' || !Array.isArray(data.result)) {
          console.warn(`No results for ${wallet}`)
          return []
        }

        return data.result.map((tx) => {
          const direction = tx.from.toLowerCase() === wallet.toLowerCase() ? 'sent' : 'received'
          const agentData = enrichReceiptWithAgentData(tx)
          
          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            amount: (parseInt(tx.value) / 1e6).toFixed(2),
            timestamp: parseInt(tx.timeStamp),
            blockNumber: tx.blockNumber,
            direction,
            status: 'confirmed' as const,
            tokenSymbol: tx.tokenSymbol,
            tokenDecimal: tx.tokenDecimal,
            agentId: agentId,
            service: getServiceFromTx(tx, wallet),
            fromLabel: labelAddress(tx.from),
            toLabel: labelAddress(tx.to),
            fromAgent: agentData.fromAgent,
            toAgent: agentData.toAgent,
          } as Receipt
        })
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        console.warn(`Blockscout fetch failed/timed out for ${wallet}:`, fetchErr)
        return []
      }
    })

    // Wait for all parallel fetches
    const results = await Promise.allSettled(fetchPromises)
    const allReceipts: Receipt[] = results.flatMap((r) =>
      r.status === 'fulfilled' ? r.value : []
    )

    // Sort USDC receipts by timestamp (newest first)
    allReceipts.sort((a, b) => b.timestamp - a.timestamp)
    
    // Load inference receipts from bundled agent_log.json (no fs I/O)
    let inferenceReceipts: Receipt[] = []
    if (includeInference) {
      inferenceReceipts = loadInferenceReceiptsFromLog()
      
      // Fallback to sample inference receipts if agent_log.json parsed empty
      if (inferenceReceipts.length === 0) {
        inferenceReceipts = sampleInferenceReceipts
      }
    }
    
    // Combine and sort all receipts
    const combinedReceipts = [...allReceipts, ...inferenceReceipts]
    combinedReceipts.sort((a, b) => b.timestamp - a.timestamp)
    
    if (combinedReceipts.length > 0) {
      return NextResponse.json({ 
        receipts: combinedReceipts, 
        source: allReceipts.length > 0 ? 'live+inference' : 'sample+inference',
        hasInferenceReceipts: includeInference && inferenceReceipts.length > 0,
      }, { 
        headers: { 
          'Cache-Control': 'public, max-age=30, s-maxage=60',
          'X-RateLimit-Remaining': remaining.toString() 
        } 
      })
    }
    
    // Fall back to sample data if live fetch failed
    const enrichedReceipts = sampleReceipts.map(r => {
      const fromAgent = resolveAgent(r.from)
      const toAgent = resolveAgent(r.to)
      return {
        ...r,
        fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
        toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
      }
    })
    
    return NextResponse.json({ 
      receipts: enrichedReceipts, 
      source: 'sample+inference',
      hasInferenceReceipts: false,
    }, { 
      headers: { 
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'X-RateLimit-Remaining': remaining.toString() 
      } 
    })
  } catch (error) {
    console.warn('Failed to fetch receipts:', error)
    // Load inference receipts from bundled log in error fallback
    let inferenceReceipts: Receipt[] = []
    try {
      inferenceReceipts = loadInferenceReceiptsFromLog()
    } catch { /* ignore */ }
    if (inferenceReceipts.length === 0) {
      inferenceReceipts = sampleInferenceReceipts
    }
    
    const enrichedReceipts = [...sampleReceipts, ...inferenceReceipts].map(r => {
      const fromAgent = resolveAgent(r.from)
      const toAgent = resolveAgent(r.to)
      return {
        ...r,
        fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
        toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
      }
    })
    return NextResponse.json({ 
      receipts: enrichedReceipts, 
      source: inferenceReceipts.length > 0 ? 'sample+inference' : 'sample',
      hasInferenceReceipts: inferenceReceipts.length > 0,
    }, { 
      headers: { 
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'X-RateLimit-Remaining': remaining.toString() 
      } 
    })
  }
}

// Fallback response used when overall timeout fires
function timeoutFallback(): NextResponse {
  const inferenceReceipts = sampleInferenceReceipts
  const enrichedReceipts = [...sampleReceipts, ...inferenceReceipts].map(r => {
    const fromAgent = resolveAgent(r.from)
    const toAgent = resolveAgent(r.to)
    return {
      ...r,
      fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
      toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
    }
  })
  return NextResponse.json({
    receipts: enrichedReceipts,
    source: 'sample+inference',
    hasInferenceReceipts: inferenceReceipts.length > 0,
  }, {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' }
  })
}

export async function GET(request: Request) {
  // Wrap entire handler in a race against an 8s timeout
  const timeoutPromise = new Promise<NextResponse>((resolve) =>
    setTimeout(() => resolve(timeoutFallback()), ROUTE_TIMEOUT_MS)
  )
  return Promise.race([fetchReceipts(request), timeoutPromise])
}
