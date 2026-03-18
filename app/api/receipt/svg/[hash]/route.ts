import { NextResponse } from 'next/server'
import { AGENT, type Receipt, type TokenTransferApiResponse } from '@/app/types'
import { sampleReceipts } from '@/data/sample-receipts'
import { ADDRESS_LABELS, CONTRACTS, RATE_LIMIT, SERVICE_LABELS } from '@/data/config'
import { createHash } from 'crypto'

const BASESCAN_API = 'https://api.basescan.org/api'

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

function getServiceFromTx(tx: { to: string; from: string }): string | undefined {
  const to = tx.to.toLowerCase()
  const from = tx.from.toLowerCase()
  const other = from === AGENT.wallet.toLowerCase() ? to : from
  
  // Check against hardcoded contract addresses first
  if (other === CONTRACTS.X402_FACILITATOR.toLowerCase()) return SERVICE_LABELS[CONTRACTS.X402_FACILITATOR.toLowerCase()]
  if (other === CONTRACTS.VIRTUALS_ACP.toLowerCase()) return SERVICE_LABELS[CONTRACTS.VIRTUALS_ACP.toLowerCase()]
  
  return labelAddress(other)
}

const BLOCKSCOUT_REST_API = 'https://base.blockscout.com/api/v2'

/** Primary lookup: Blockscout direct-by-hash (works for any tx, not just last 50) */
async function fetchReceiptByHashBlockscout(hash: string): Promise<Receipt | null> {
  try {
    // Correct Blockscout v2 endpoint: fetch transaction which embeds token_transfers
    const res = await fetch(
      `${BLOCKSCOUT_REST_API}/transactions/${hash}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) throw new Error(`Blockscout error: ${res.status}`)
    const data = await res.json()

    // token_transfers is embedded in the transaction response
    const transfers: Array<Record<string, unknown>> = Array.isArray(data.token_transfers) ? data.token_transfers : []
    // Find the USDC transfer (token address matches)
    const t = transfers.find((tf: Record<string, unknown>) => {
      const token = tf.token as Record<string, unknown> | undefined
      return token?.address?.toString().toLowerCase() === CONTRACTS.USDC_CONTRACT.toLowerCase()
    }) ?? transfers[0]

    if (!t) return null

    const rawValue = (t.total as Record<string, unknown>)?.value?.toString() ?? '0'
    const fromObj = t.from as Record<string, unknown> | undefined
    const toObj = t.to as Record<string, unknown> | undefined
    const fromHash = (fromObj?.hash as string) ?? ''
    const toHash = (toObj?.hash as string) ?? ''
    const from = fromHash.toLowerCase()
    const to = toHash.toLowerCase()
    const ts = data.timestamp ? Math.floor(new Date(data.timestamp as string).getTime() / 1000) : 0
    const block = (t.block_number ?? data.block)?.toString() ?? ''
    const direction: 'sent' | 'received' = from === AGENT.wallet.toLowerCase() ? 'sent' : 'received'

    return {
      hash,
      from: fromHash,
      to: toHash,
      value: rawValue,
      amount: (parseInt(rawValue) / 1e6).toFixed(2),
      timestamp: ts,
      blockNumber: block,
      direction,
      status: 'confirmed' as const,
      tokenSymbol: 'USDC',
      tokenDecimal: '6',
      agentId: AGENT.id?.toString() ?? '22945',
      service: labelAddress(direction === 'sent' ? to : from),
      fromLabel: labelAddress(from),
      toLabel: labelAddress(to),
    }
  } catch {
    return null
  }
}

/** Fallback: Basescan scan (last 50 txns) */
async function fetchReceiptByHash(hash: string): Promise<Receipt | null> {
  // Try Blockscout first (exact hash lookup, works for any historical tx)
  const blockscout = await fetchReceiptByHashBlockscout(hash)
  if (blockscout) return blockscout

  // Fallback: Basescan recent scan
  try {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: AGENT.wallet,
      contractaddress: CONTRACTS.USDC_CONTRACT,
      sort: 'desc',
      page: '1',
      offset: '50',
    })

    if (process.env.BASESCAN_API_KEY) {
      params.set('apikey', process.env.BASESCAN_API_KEY)
    }

    const res = await fetch(`${BASESCAN_API}?${params}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error(`Basescan API error: ${res.status}`)

    const data = await res.json() as TokenTransferApiResponse

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return null
    }

    const tx = data.result.find((t) => t.hash === hash)
    if (!tx) return null

    const direction = tx.from.toLowerCase() === AGENT.wallet.toLowerCase() ? 'sent' : 'received'
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
      agentId: '22945',
      service: getServiceFromTx(tx),
      fromLabel: labelAddress(tx.from),
      toLabel: labelAddress(tx.to),
    }
  } catch (error) {
    return null
  }
}

function findSampleReceipt(hash: string): Receipt | null {
  const receipt = sampleReceipts.find((r) => r.hash === hash)
  return receipt || null
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// Custom SVG generator without satori
function generateReceiptSVG(receipt: Receipt): string {
  const isSent = receipt.direction === 'sent'
  
  const colors = {
    background: '#1a1d23',
    border: '#2a2d35',
    muted: '#6b7280',
    primary: '#e5e7eb',
    green: '#4ade80',
    red: '#ef4444',
    blue: '#60a5fa',
    usdc: '#26a17b',
  }

  const receiptDate = formatTime(receipt.timestamp)
  const receiptTime = new Date(receipt.timestamp * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  // Calculate height based on content (roughly 280-300px)
  const height = 260
  const padding = 24
  const width = 440

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" rx="12" fill="${colors.background}" stroke="${colors.border}" stroke-width="1"/>
  
  <!-- Header -->
  <text x="${padding}" y="32" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="16" font-weight="700" fill="${colors.primary}">MOLTTAIL</text>
  
  <text x="${width - padding}" y="22" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.green}" text-anchor="end">Block: ${receipt.blockNumber}</text>
  <text x="${width - padding}" y="38" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.primary}" text-anchor="end">${receiptDate}</text>
  <text x="${width - padding}" y="52" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.primary}" text-anchor="end">${receiptTime} UTC</text>
  
  <!-- Divider -->
  <line x1="${padding}" y1="68" x2="${width - padding}" y2="68" stroke="${colors.border}" stroke-width="1"/>
  
  <!-- Transaction Direction -->
  <rect x="${padding}" y="78" width="${isSent ? 48 : 70}" height="22" rx="11" fill="${isSent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)'}"/>
  <text x="${padding + (isSent ? 48 : 70) / 2}" y="93" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" font-weight="600" fill="${isSent ? colors.red : colors.green}" text-anchor="middle">${isSent ? '↑ Sent' : '↓ Received'}</text>
  
  <text x="${padding + 84}" y="89" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="18" font-weight="700" fill="${colors.primary}">${isSent ? '-' : '+'}${receipt.amount}</text>
  <text x="${padding + 84}" y="106" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="13" fill="${colors.usdc}">${receipt.tokenSymbol}</text>
  
  <!-- Dollar value right-aligned -->
  <text x="${width - padding}" y="92" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.muted}" text-anchor="end">≈ $${(parseFloat(receipt.amount) * 1).toFixed(2)}</text>
  
  <!-- From / To rows -->
  <text x="${padding}" y="132" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.muted}">From</text>
  <text x="${padding + 44}" y="132" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="13" fill="${colors.blue}">${receipt.fromLabel || shortenAddress(receipt.from)}</text>
  
  <text x="${padding}" y="152" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.muted}">To</text>
  <text x="${padding + 44}" y="152" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="13" fill="${colors.blue}">${receipt.toLabel || shortenAddress(receipt.to)}</text>
  
  <!-- Divider -->
  <line x1="${padding}" y1="172" x2="${width - padding}" y2="172" stroke="${colors.border}" stroke-width="1"/>
  
  <!-- Footer -->
  <text x="${padding}" y="192" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.muted}">ERC-8004 #${receipt.agentId}</text>
  <text x="${width - padding}" y="192" font-family="'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" font-size="11" fill="${colors.muted}" text-anchor="end">Molttail · Clawlinker</text>
  
</svg>
`
}

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET(
  req: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params

  // Rate limiting
  const clientIp = getClientIp(req)
  const { allowed, remaining } = checkRateLimit(clientIp)
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  let receipt = await fetchReceiptByHash(hash)
  if (!receipt) {
    receipt = findSampleReceipt(hash)
  }

  if (!receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  }

  try {
    const svg = generateReceiptSVG(receipt)

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-Request-ID': createHash('sha256').update(hash + Date.now()).digest('hex').slice(0, 16),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'SVG generation failed' }, { status: 500 })
  }
}
