import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { AGENT, BANKR_AGENT, type Receipt, CHAINS, type ChainKey } from '@/app/types'
import { sampleReceipts } from '@/data/sample-receipts'
import { ADDRESS_LABELS, CONTRACTS, RATE_LIMIT, SERVICE_LABELS } from '@/data/config'
import { AGENT_REGISTRY, resolveAgent } from '@/data/erc8004-resolver'
import { sampleInferenceReceipts } from '@/data/inference-receipts'

// Tempo chain constants
const TEMPO_RPC = 'https://rpc.tempo.xyz'
const TEMPO_USDC = '0x20c000000000000000000000b9537d11c60e8b50'
const TEMPO_WALLET = '0xf7567C97c882c759E809EaC4772932154F35ab05'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

function tempoToTopic(addr: string): string {
  return '0x000000000000000000000000' + addr.replace(/^0x/, '').toLowerCase()
}

async function getTempoFromBlock(): Promise<string> {
  try {
    const res = await fetch(TEMPO_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 0 }),
    })
    const data = await res.json() as { result?: string }
    const latest = parseInt(data.result || '0x0', 16)
    return '0x' + Math.max(0, latest - 99000).toString(16)
  } catch { return '0x97b44a' }
}

async function fetchTempoLogs(fromTopic: string | null, toTopic: string | null, timeoutMs: number): Promise<Array<{ transactionHash: string; blockNumber: string; topics: string[]; data: string }>> {
  const fromBlock = await getTempoFromBlock()
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(TEMPO_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'eth_getLogs',
        params: [{ fromBlock, toBlock: 'latest', address: TEMPO_USDC, topics: [TRANSFER_TOPIC, fromTopic, toTopic] }],
        id: 1,
      }),
      signal: controller.signal,
    })
    clearTimeout(tid)
    if (!res.ok) return []
    const json = await res.json() as { result?: Array<{ transactionHash: string; blockNumber: string; topics: string[]; data: string }> }
    return json.result || []
  } catch { clearTimeout(tid); return [] }
}

async function fetchTempoBlockTs(blockNumber: string): Promise<number> {
  try {
    const res = await fetch(TEMPO_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: [blockNumber, false], id: 1 }),
    })
    const json = await res.json() as { result?: { timestamp?: string } }
    if (json.result?.timestamp) return parseInt(json.result.timestamp, 16)
  } catch { /* ignore */ }
  return Math.floor(Date.now() / 1000)
}

async function fetchTempoReceipts(timeoutMs: number): Promise<Receipt[]> {
  const walletTopic = tempoToTopic(TEMPO_WALLET)
  const [receivedLogs, sentLogs] = await Promise.all([
    fetchTempoLogs(null, walletTopic, timeoutMs),
    fetchTempoLogs(walletTopic, null, timeoutMs),
  ])
  const seen = new Set<string>()
  const unique: { log: typeof receivedLogs[0]; direction: 'sent' | 'received' }[] = []
  for (const log of receivedLogs) {
    const key = log.transactionHash + ':received'
    if (!seen.has(key)) { seen.add(key); unique.push({ log, direction: 'received' }) }
  }
  for (const log of sentLogs) {
    const key = log.transactionHash + ':sent'
    if (!seen.has(key)) { seen.add(key); unique.push({ log, direction: 'sent' }) }
  }
  if (unique.length === 0) return []
  const blockNumbers = [...new Set(unique.map(({ log }) => log.blockNumber))]
  const tsMap = new Map<string, number>()
  await Promise.all(blockNumbers.map(async (bn) => { tsMap.set(bn, await fetchTempoBlockTs(bn)) }))
  return unique.map(({ log, direction }) => {
    const from = '0x' + log.topics[1].slice(-40)
    const to = '0x' + log.topics[2].slice(-40)
    const rawValue = BigInt(log.data).toString()
    const amount = (Number(BigInt(log.data)) / 1e6).toFixed(2)
    const ts = tsMap.get(log.blockNumber) ?? Math.floor(Date.now() / 1000)
    const counterpart = direction === 'sent' ? to : from
    const service = labelAddress(counterpart)
    return {
      hash: log.transactionHash,
      from, to, value: rawValue, amount, timestamp: ts,
      blockNumber: parseInt(log.blockNumber, 16).toString(),
      direction, status: 'confirmed' as const,
      tokenSymbol: 'USDC.e', tokenDecimal: '6',
      chain: 'tempo' as const, service,
      fromLabel: labelAddress(from), toLabel: labelAddress(to),
      receiptType: 'onchain' as const,
      agentId: AGENT.id.toString(),
    } as Receipt
  })
}
// Import agent_log.json as a module — bundled at build time, no fs.readFileSync on serverless
import agentLogRaw from '@/agent_log.json'
// Build-time cached receipts (populated by scripts/fetch-receipts.js during prebuild)
import cachedReceiptsData from '@/data/cached-receipts.json'

// Use Blockscout REST API v2 for live fetches
const BLOCKSCOUT_REST_API = 'https://base.blockscout.com/api/v2'
// Etherscan V2 as fallback (requires paid plan for Base — kept for reference)
const BASESCAN_API = 'https://api.basescan.org/v2/api'
const ETH_BLOCKSCOUT_API = 'https://api.etherscan.io/v2/api'

// API fetch timeout per-request
const API_TIMEOUT_MS = 6000

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

// Add receiptType field to distinguish on-chain from inference receipts
type ReceiptWithMetadata = Receipt & { receiptType?: 'onchain' | 'inference' }

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
    
    // Filter for Bankr LLM entries only (Anthropic API calls are direct, not via Bankr)
    const inferenceReceipts: Receipt[] = logs
      .filter((entry) => entry.model && entry.model.startsWith('bankr/') && entry.model_cost_usd && entry.model_cost_usd > 0)
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
          chain: 'inference' as const,
          service: `Bankr LLM — ${entry.action || entry.phase || 'inference'} (${entry.model.split('/')[1] || 'unknown'})`,
          agentId: AGENT.id.toString(),
          notes: `phase:${entry.phase || 'unknown'}|${entry.description || 'LLM-powered autonomous operation'}`,
          receiptType: 'inference' as const,
        }
      })
    
    return inferenceReceipts
  } catch (e) {
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
    const receiptTypeFilter = url.searchParams.get('type') as 'onchain' | 'inference' | null
    
    // Determine which chain to use
    const chain = chainParam || 'all'
    const useAll = chain === 'all'
    const useBase = chain === 'base' || useAll
    const useTempo = chain === 'tempo' || useAll

    // Handle Tempo-only chain
    if (useTempo && !useAll) {
      const tempoReceipts = await fetchTempoReceipts(API_TIMEOUT_MS)
      tempoReceipts.sort((a, b) => b.timestamp - a.timestamp)
      return NextResponse.json({
        receipts: tempoReceipts,
        source: tempoReceipts.length > 0 ? 'tempo-live' : 'tempo-empty',
        hasInferenceReceipts: false,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-RateLimit-Remaining': remaining.toString(),
        },
      })
    }

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
    const blockscoutBase = chain === 'ethereum' ? 'https://eth.blockscout.com/api/v2' : BLOCKSCOUT_REST_API

    // Helper to fetch via Blockscout REST API v2 (per-wallet)
    const fetchFromBlockscout = async (wallet: string, agentId: string): Promise<Receipt[]> => {
      const url = `${blockscoutBase}/addresses/${wallet}/token-transfers?token=${contractAddress}&type=ERC-20`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

      try {
        const res = await fetch(url, {
          next: { revalidate: 60 },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          return []
        }

        const data = await res.json() as {
          items: Array<{
            transaction_hash: string
            from: { hash: string }
            to: { hash: string }
            total: { value: string; decimals: string }
            timestamp: string
            block_number: number
          }>
        }

        const items = data.items || []
        if (items.length === 0) return []

        return items.map((item) => {
          const from = item.from?.hash || ''
          const to = item.to?.hash || ''
          const rawValue = item.total?.value || '0'
          const decimals = item.total?.decimals || '6'
          const direction = from.toLowerCase() === wallet.toLowerCase() ? 'sent' : 'received'
          const agentData = enrichReceiptWithAgentData({ from, to })

          return {
            hash: item.transaction_hash,
            from,
            to,
            value: rawValue,
            amount: (parseInt(rawValue) / Math.pow(10, parseInt(decimals))).toFixed(2),
            timestamp: Math.floor(Date.parse(item.timestamp) / 1000),
            blockNumber: item.block_number?.toString() || '0',
            direction,
            status: 'confirmed' as const,
            tokenSymbol: 'USDC',
            tokenDecimal: decimals,
            chain: (useAll ? 'base' : chain) as 'base' | 'ethereum',
            agentId,
            service: getServiceFromTx({ from, to }, wallet),
            fromLabel: labelAddress(from),
            toLabel: labelAddress(to),
            fromAgent: agentData.fromAgent,
            toAgent: agentData.toAgent,
            receiptType: 'onchain' as const,
          } as Receipt
        })
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        return []
      }
    }

    // Fetch all wallets in parallel with Promise.allSettled
    const fetchPromises = walletsToFetch.map(({ wallet, agentId }) =>
      fetchFromBlockscout(wallet, agentId)
    )

    // Wait for all parallel fetches
    const results = await Promise.allSettled(fetchPromises)
    const liveReceipts: Receipt[] = results.flatMap((r) =>
      r.status === 'fulfilled' ? r.value : []
    )

    // If live fetch returned nothing, try the build-time cache
    let allReceipts: Receipt[]
    let dataSource: 'live' | 'cached' | 'sample'

    if (liveReceipts.length > 0) {
      allReceipts = liveReceipts
      dataSource = 'live'
    } else {
      // Fall back to cached receipts from build time
      let cachedRaw = (cachedReceiptsData as { receipts: Receipt[] }).receipts || []
      // Filter by requested wallet(s) if specified
      if (walletParam && cachedRaw.length > 0) {
        const lowerWallet = walletParam.toLowerCase()
        cachedRaw = cachedRaw.filter(
          r => r.from?.toLowerCase() === lowerWallet || r.to?.toLowerCase() === lowerWallet
        )
      }
      // Filter by chain — don't leak Base data when Ethereum or Tempo is requested
      if (!useAll && chain !== 'base') {
        cachedRaw = cachedRaw.filter(r => r.chain === chain)
      }
      allReceipts = cachedRaw

      if (allReceipts.length > 0) {
        dataSource = 'cached'
        // Re-enrich with agent data + service labels (not stored in cache)
        allReceipts = allReceipts.map(r => {
          const agentData = enrichReceiptWithAgentData(r)
          const wallet = walletParam || AGENT.wallet
          const service = r.service || getServiceFromTx({ from: r.from, to: r.to }, wallet)
          const fromLabel = r.fromLabel || labelAddress(r.from.toLowerCase())
          const toLabel = r.toLabel || labelAddress(r.to.toLowerCase())
          return { ...r, fromAgent: agentData.fromAgent, toAgent: agentData.toAgent, service, fromLabel, toLabel, receiptType: 'onchain' }
        })
      } else {
        dataSource = 'sample'
      }
    }

    // Merge Tempo receipts when showing all chains
    if (useTempo) {
      try {
        const tempoReceipts = await fetchTempoReceipts(API_TIMEOUT_MS)
        allReceipts = [...allReceipts, ...tempoReceipts]
      } catch { /* Tempo fetch failed, continue with Base only */ }
    }

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
      
      // Add receiptType and chain to sample inference receipts if missing
      inferenceReceipts.forEach(r => {
        if (!r.receiptType) {
          r.receiptType = 'inference'
        }
        if (!r.chain) {
          r.chain = 'inference'
        }
      })
    }
    
    // Combine and sort all receipts
    const combinedReceipts = [...allReceipts, ...inferenceReceipts]
    combinedReceipts.sort((a, b) => b.timestamp - a.timestamp)
    
    // Filter by receipt type if requested
    let filteredReceipts: Receipt[] = []
    let onchainReceipts = allReceipts
    let inferenceReceiptsFiltered = inferenceReceipts
    
    if (receiptTypeFilter === 'onchain') {
      onchainReceipts = allReceipts.filter(r => r.receiptType === 'onchain')
      inferenceReceiptsFiltered = []
    } else if (receiptTypeFilter === 'inference') {
      onchainReceipts = []
      inferenceReceiptsFiltered = inferenceReceipts.filter(r => r.receiptType === 'inference')
    }
    
    // Re-combine after filtering
    filteredReceipts = [...onchainReceipts, ...inferenceReceiptsFiltered]
    
    if (filteredReceipts.length > 0) {
      const sourceLabel = dataSource === 'live' ? 'live+inference'
        : dataSource === 'cached' ? 'cached+inference'
        : 'sample+inference'
      return NextResponse.json({ 
        receipts: filteredReceipts, 
        source: sourceLabel,
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
        receiptType: 'onchain' as const,
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
    // Load inference receipts from bundled log in error fallback
    let inferenceReceipts: Receipt[] = []
    try {
      inferenceReceipts = loadInferenceReceiptsFromLog()
    } catch { /* ignore */ }
    if (inferenceReceipts.length === 0) {
      inferenceReceipts = sampleInferenceReceipts
    }
    
    // Add receiptType and chain if missing
    inferenceReceipts.forEach(r => {
      if (!r.receiptType) {
        r.receiptType = 'inference'
      }
      if (!r.chain) {
        r.chain = 'inference'
      }
    })
    
    const enrichedReceipts = [...sampleReceipts, ...inferenceReceipts].map(r => {
      const fromAgent = resolveAgent(r.from)
      const toAgent = resolveAgent(r.to)
      return {
        ...r,
        fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
        toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
        receiptType: r.receiptType || (r.tokenSymbol === 'USDC' ? 'onchain' : 'inference'),
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
  const inferenceReceipts = sampleInferenceReceipts.map(r => {
    const enriched = { ...r, chain: r.chain || 'inference' as const }
    if (!enriched.receiptType) {
      enriched.receiptType = 'inference' as const
    }
    return enriched
  })
  const enrichedReceipts = [...sampleReceipts, ...inferenceReceipts].map(r => {
    const fromAgent = resolveAgent(r.from)
    const toAgent = resolveAgent(r.to)
    const enriched = {
      ...r,
      fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
      toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
      receiptType: r.tokenSymbol === 'USDC' ? 'onchain' : 'inference',
    }
    if (!enriched.chain) {
      enriched.chain = 'inference'
    }
    return enriched
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
