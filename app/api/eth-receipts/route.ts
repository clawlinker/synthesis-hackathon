import { NextResponse } from 'next/server'
import { AGENT, ETH_USDC_CONTRACT, type Receipt, type TokenTransferApiResponse } from '@/app/types'
import { ADDRESS_LABELS, CONTRACTS, RATE_LIMIT, SERVICE_LABELS } from '@/data/config'
import { resolveAgent } from '@/data/erc8004-resolver'
import { sampleReceipts } from '@/data/sample-receipts'

// Blockscout API for Ethereum mainnet
const ETH_BLOCKSCOUT_API = 'https://eth.blockscout.com/api'

// Validate required environment variables
function validateEnv(): void {
  if (!process.env.BASESCAN_API_KEY) {
    throw new Error('BASESCAN_API_KEY environment variable is required')
  }
}

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
  if (other === CONTRACTS.ETH_USDC_CONTRACT.toLowerCase()) return SERVICE_LABELS[CONTRACTS.ETH_USDC_CONTRACT.toLowerCase()]
  
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

export async function GET(request: Request) {
  const clientIp = getClientIp(request)
  const { allowed, remaining } = checkRateLimit(clientIp)
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  try {
    // Validate required environment variables
    validateEnv()
  } catch (error) {
    console.warn('Environment validation failed:', error)
    
    // Fall back to sample Ethereum receipt for demo (ERC-8004 registration)
    const sampleEthReceipts: Receipt[] = [
      {
        hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
        to: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        value: '250000000000000000',
        amount: '0.25',
        timestamp: 1709100000,
        blockNumber: '20123456',
        direction: 'sent',
        status: 'confirmed',
        tokenSymbol: 'ETH',
        tokenDecimal: '18',
        service: 'ERC-8004 Registration Fee',
        agentId: AGENT.id.toString(),
        notes: 'On-chain agent identity registration on Ethereum mainnet',
      },
    ]
    
    return NextResponse.json({ 
      receipts: sampleEthReceipts, 
      source: 'sample',
      chain: 'ethereum',
      warning: 'BASESCAN_API_KEY not configured - showing sample data only',
    }, { status: 200, headers: { 'X-RateLimit-Remaining': remaining.toString() } })
  }

  try {
    const url = new URL(request.url)
    const walletParam = url.searchParams.get('wallet')
    
    // Determine which wallet(s) to fetch
    let walletsToFetch: { wallet: string; name: string; agentId: string }[] = []
    
    if (walletParam) {
      const lowerWallet = walletParam.toLowerCase()
      if (lowerWallet === AGENT.wallet.toLowerCase()) {
        walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      } else {
        walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      }
    } else {
      walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
    }
    
    // Fetch receipts for all wallets on Ethereum
    const allReceipts: Receipt[] = []
    
    for (const { wallet, agentId } of walletsToFetch) {
      const params = new URLSearchParams({
        module: 'account',
        action: 'tokentx',
        address: wallet,
        contractaddress: ETH_USDC_CONTRACT,
        sort: 'desc',
        page: '1',
        offset: '50',
      })

      if (process.env.BASESCAN_API_KEY) {
        params.set('apikey', process.env.BASESCAN_API_KEY)
      }

      const res = await fetch(`${ETH_BLOCKSCOUT_API}?${params}`, {
        next: { revalidate: 60 },
      })

      if (!res.ok) {
        console.warn(`Blockscout API error for Ethereum ${wallet}: ${res.status}`)
        continue
      }

      const data = await res.json() as TokenTransferApiResponse

      if (data.status !== '1' || !Array.isArray(data.result)) {
        console.warn(`No results for Ethereum ${wallet}`)
        continue
      }

      const receipts: Receipt[] = data.result.map((tx) => {
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
        }
      })
      
      allReceipts.push(...receipts)
    }

    // Sort by timestamp (newest first)
    allReceipts.sort((a, b) => b.timestamp - a.timestamp)
    
    if (allReceipts.length > 0) {
      return NextResponse.json({ 
        receipts: allReceipts, 
        source: 'live',
        chain: 'ethereum',
      }, { headers: { 'X-RateLimit-Remaining': remaining.toString() } })
    }
    
    // Fall back to sample data
    const sampleEthReceipts: Receipt[] = [
      {
        hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
        to: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        value: '250000000000000000',
        amount: '0.25',
        timestamp: 1709100000,
        blockNumber: '20123456',
        direction: 'sent',
        status: 'confirmed',
        tokenSymbol: 'ETH',
        tokenDecimal: '18',
        service: 'ERC-8004 Registration Fee',
        agentId: AGENT.id.toString(),
        notes: 'On-chain agent identity registration on Ethereum mainnet',
      },
    ]
    
    return NextResponse.json({ 
      receipts: sampleEthReceipts, 
      source: 'sample',
      chain: 'ethereum',
    }, { headers: { 'X-RateLimit-Remaining': remaining.toString() } })
  } catch (error) {
    console.warn('Failed to fetch Ethereum receipts:', error)
    
    const sampleEthReceipts: Receipt[] = [
      {
        hash: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
        to: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        value: '250000000000000000',
        amount: '0.25',
        timestamp: 1709100000,
        blockNumber: '20123456',
        direction: 'sent',
        status: 'confirmed',
        tokenSymbol: 'ETH',
        tokenDecimal: '18',
        service: 'ERC-8004 Registration Fee',
        agentId: AGENT.id.toString(),
        notes: 'On-chain agent identity registration on Ethereum mainnet',
      },
    ]
    
    return NextResponse.json({ 
      receipts: sampleEthReceipts, 
      source: 'sample',
      chain: 'ethereum',
    }, { headers: { 'X-RateLimit-Remaining': remaining.toString() } })
  }
}
