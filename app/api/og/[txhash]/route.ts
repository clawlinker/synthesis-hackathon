import { NextResponse } from 'next/server'
import { AGENT } from '@/app/types'
import { ADDRESS_LABELS } from '@/data/config'

const BASESCAN_API = 'https://api.basescan.org/api'

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

async function fetchReceiptInfo(hash: string) {
  try {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: AGENT.wallet,
      contractaddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
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

    const data = await res.json()

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return null
    }

    const tx = data.result.find((t: any) => t.hash === hash)
    if (!tx) return null

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: parseInt(tx.timeStamp),
      tokenSymbol: tx.tokenSymbol,
      service: labelAddress(tx.from === AGENT.wallet ? tx.to : tx.from),
    }
  } catch (error) {
    console.error('Failed to fetch receipt:', error)
    return null
  }
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

function formatAmount(value: string): string {
  return (parseInt(value) / 1e6).toFixed(2)
}

// Custom SVG generator for OG images
function generateOGImage(tx: any): string {
  const isSent = tx ? tx.from === AGENT.wallet : false
  
  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  
  <!-- Header -->
  <circle cx="100" cy="100" r="40" fill="#111111" stroke="#26a17b" stroke-width="3"/>
  <image href="${AGENT.avatar}" x="80" y="80" width="40" height="40" preserveAspectRatio="xMidYMid cover"/>
  
  <text x="150" y="95" font-family="Inter, sans-serif" font-size="32" font-weight="700" fill="#ffffff">
    Molttail
  </text>
  <text x="150" y="125" font-family="Inter, sans-serif" font-size="16" fill="#606060">
    Verifiable audit trail for autonomous agent transactions
  </text>
  
  <!-- Transaction Card -->
  <rect x="100" y="180" width="1000" height="200" rx="16" fill="#111111" stroke="#222222" stroke-width="1"/>
  
  ${tx ? `
  <!-- Direction Badge -->
  <rect x="130" y="210" width="${isSent ? 56 : 66}" height="28" rx="14" fill="${isSent ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)'}"/>
  <text x="138" y="229" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="${isSent ? '#ef4444' : '#22c55e'}">
    ${isSent ? '↑ Sent' : '↓ Received'} ${tx.service || 'Payment'}
  </text>
  
  <!-- Amount -->
  <text x="130" y="275" font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="#ffffff">
    ${isSent ? '-' : '+'}${formatAmount(tx.value)}
  </text>
  <text x="${130 + (isSent ? '-' : '+').length * 24 + formatAmount(tx.value).length * 24}" y="275" font-family="Inter, sans-serif" font-size="24" font-weight="500" fill="#26a17b">
    ${tx.tokenSymbol}
  </text>
  
  <!-- Separator -->
  <line x1="130" y1="295" x2="1070" y2="295" stroke="#222222" stroke-width="1"/>
  
  <!-- Info -->
  <text x="130" y="325" font-family="Inter, sans-serif" font-size="16" fill="#a0a0a0">
    Transaction
  </text>
  <text x="400" y="325" font-family="Inter, sans-serif" font-size="16" fill="#ffffff">
    ${tx.hash.slice(0, 10)}…${tx.hash.slice(-4)}
  </text>
  
  <text x="130" y="355" font-family="Inter, sans-serif" font-size="16" fill="#a0a0a0">
    Time
  </text>
  <text x="400" y="355" font-family="Inter, sans-serif" font-size="16" fill="#ffffff">
    ${formatTime(tx.timestamp)} UTC
  </text>
  
  <text x="130" y="385" font-family="Inter, sans-serif" font-size="16" fill="#a0a0a0">
    Agent
  </text>
  <text x="400" y="385" font-family="Inter, sans-serif" font-size="16" fill="#ffffff">
    Clawlinker (ERC-8004 #${AGENT.id})
  </text>
  ` : `
  <text x="600" y="280" font-family="Inter, sans-serif" font-size="16" fill="#606060" text-anchor="middle">
    Transaction not found
  </text>
  <text x="600" y="310" font-family="Inter, sans-serif" font-size="16" fill="#26a17b" text-anchor="middle">
    View on BaseScan
  </text>
  `}
  
  <!-- Footer -->
  <text x="600" y="520" font-family="Inter, sans-serif" font-size="14" fill="#606060" text-anchor="middle">
    Built by 
    <tspan fill="#26a17b" xml:space="preserve">Clawlinker</tspan>
    for the Synthesis Hackathon
  </text>
</svg>
`
}

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ txhash: string }> }
) {
  const { txhash } = await params

  const tx = await fetchReceiptInfo(txhash)

  try {
    const svg = generateOGImage(tx)

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('OG image generation failed:', error)
    return NextResponse.json({ error: 'OG image generation failed' }, { status: 500 })
  }
}
