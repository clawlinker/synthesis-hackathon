import { NextResponse } from 'next/server'
import { AGENT, type Receipt } from '@/app/types'
import { sampleReceipts } from '@/data/sample-receipts'
import { ADDRESS_LABELS, CONTRACTS, RATE_LIMIT, SERVICE_LABELS } from '@/data/config'
import type { BasescanSingleTxResponse } from '@/data/types'
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

async function fetchReceiptByHash(hash: string): Promise<Receipt | null> {
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

    const data = await res.json() as BasescanSingleTxResponse

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
    console.error('Failed to fetch receipt:', error)
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
    background: '#0a0a0a',
    cardBackground: '#111111',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#606060',
    usdc: '#26a17b',
    sentBg: 'rgba(220, 38, 38, 0.1)',
    sentText: '#ef4444',
    receivedBg: 'rgba(34, 197, 94, 0.1)',
    receivedText: '#22c55e',
    border: '#222222',
  }

  return `
<svg width="600" height="350" viewBox="0 0 600 350" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="350" fill="${colors.background}"/>
  
  <!-- Card -->
  <rect x="0" y="0" width="600" height="350" rx="16" fill="${colors.cardBackground}" stroke="${colors.border}" stroke-width="1"/>
  
  <!-- Direction Badge -->
  <rect x="20" y="16" width="${isSent ? 56 : 66}" height="24" rx="12" fill="${isSent ? colors.sentBg : colors.receivedBg}"/>
  <text x="${isSent ? 28 : 33}" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="${isSent ? colors.sentText : colors.receivedText}">
    ${isSent ? '↑ Sent' : '↓ Received'}
  </text>
  
  ${receipt.service ? `
  <text x="86" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="${colors.textMuted}">
    ${receipt.service}
  </text>` : ''}
  
  <!-- Amount -->
  <text x="460" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="${colors.textPrimary}">
    ${isSent ? '-' : '+'}${receipt.amount}
  </text>
  <text x="${460 + (receipt.amount.length + 1) * 18}" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="${colors.usdc}">
    USDC
  </text>
  
  <!-- Separator -->
  <line x1="20" y1="60" x2="580" y2="60" stroke="${colors.border}" stroke-width="1"/>
  
  <!-- From -->
  <text x="20" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="${colors.textMuted}" text-transform="uppercase" letter-spacing="0.5px">
    FROM
  </text>
  <text x="60" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="${colors.textSecondary}">
    ${receipt.fromLabel || shortenAddress(receipt.from)}
  </text>
  
  <!-- To -->
  <text x="20" y="108" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="${colors.textMuted}" text-transform="uppercase" letter-spacing="0.5px">
    TO
  </text>
  <text x="60" y="108" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="${colors.textSecondary}">
    ${receipt.toLabel || shortenAddress(receipt.to)}
  </text>
  
  <!-- Separator -->
  <line x1="20" y1="128" x2="580" y2="128" stroke="${colors.border}" stroke-width="1"/>
  
  <!-- Footer -->
  <text x="20" y="152" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="${colors.textMuted}">
    ${formatTime(receipt.timestamp)} UTC
  </text>
  
  ${receipt.agentId ? `
  <text x="280" y="152" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="${colors.textMuted}">
    🤖 ERC-8004 #${receipt.agentId}
  </text>` : ''}
  
  <!-- Branding -->
  <text x="300" y="185" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="${colors.textMuted}" text-anchor="middle">
    Agent Receipts — 
    <tspan fill="${colors.usdc}" xml:space="preserve">Clawlinker</tspan>
    | Synthesis Hackathon
  </text>
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

  // Validate required environment variables
  try {
    validateEnv()
  } catch (error) {
    console.warn('Environment validation failed:', error)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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
    console.warn('SVG generation failed:', error)
    return NextResponse.json({ error: 'SVG generation failed' }, { status: 500 })
  }
}
