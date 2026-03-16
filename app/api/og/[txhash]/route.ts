import { NextResponse } from 'next/server'
import { AGENT } from '@/app/types'
import { ADDRESS_LABELS } from '@/data/config'
import { BasescanSingleTxResponse } from '@/data/types'
import sharp from 'sharp'

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

    const tx = data.result.find((t: BasescanSingleTxResponse['result'][0]) => t.hash === hash)
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
interface OGTransaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  tokenSymbol: string
  service?: string
}

function generateOGImage(tx: OGTransaction | null): string {
  const isSent = tx ? tx.from.toLowerCase() === AGENT.wallet.toLowerCase() : false
  const serviceLabel = tx?.service ? tx.service : 'Payment'
  const directionText = isSent ? `↑ Sent · ${serviceLabel}` : `↓ Received · ${serviceLabel}`

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>

  <!-- Subtle grid lines for depth -->
  <line x1="0" y1="314" x2="1200" y2="314" stroke="#1a1a1a" stroke-width="1"/>
  <line x1="600" y1="0" x2="600" y2="630" stroke="#1a1a1a" stroke-width="1"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1200" height="4" fill="#26a17b"/>

  <!-- Logo area -->
  <text x="80" y="90" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="36" font-weight="700" fill="#ffffff">Molttail</text>
  <text x="80" y="118" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17" fill="#505050">Agent transaction receipt</text>

  <!-- ERC-8004 badge -->
  <rect x="930" y="65" width="188" height="32" rx="16" fill="#111111" stroke="#26a17b" stroke-width="1"/>
  <text x="1024" y="86" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" fill="#26a17b" text-anchor="middle">ERC-8004 #${AGENT.id}</text>

  <!-- Main card -->
  <rect x="80" y="160" width="1040" height="290" rx="16" fill="#111111" stroke="#222222" stroke-width="1"/>

  ${tx ? `
  <!-- Direction label -->
  <text x="116" y="205" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="600" fill="${isSent ? '#ef4444' : '#22c55e'}">${directionText}</text>

  <!-- Amount — large -->
  <text x="116" y="290" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="72" font-weight="700" fill="#ffffff">${isSent ? '−' : '+'}${formatAmount(tx.value)}</text>
  <text x="116" y="340" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" font-weight="500" fill="#26a17b">USDC</text>

  <!-- Divider -->
  <line x1="116" y1="368" x2="1104" y2="368" stroke="#222222" stroke-width="1"/>

  <!-- Meta row -->
  <text x="116" y="398" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#606060">TX</text>
  <text x="180" y="398" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#cccccc">${tx.hash.slice(0, 14)}…${tx.hash.slice(-6)}</text>

  <text x="116" y="424" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#606060">TIME</text>
  <text x="180" y="424" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#cccccc">${formatTime(tx.timestamp)} UTC</text>

  <text x="116" y="450" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#606060">AGENT</text>
  <text x="180" y="450" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#cccccc">Clawlinker · ${AGENT.ens || 'clawlinker.eth'}</text>
  ` : `
  <text x="600" y="295" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" fill="#505050" text-anchor="middle">Receipt not found on Base</text>
  <text x="600" y="330" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" fill="#26a17b" text-anchor="middle">Transaction may be on Ethereum or still indexing</text>
  `}

  <!-- Footer -->
  <text x="80" y="590" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#404040">molttail.vercel.app</text>
  <text x="1120" y="590" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#404040" text-anchor="end">Synthesis Hackathon 2026</text>
</svg>`
}

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ txhash: string }> }
) {
  const { txhash } = await params

  const tx = await fetchReceiptInfo(txhash)

  try {
    const svgString = generateOGImage(tx)
    const svgBuffer = Buffer.from(svgString)

    // Convert SVG → PNG so social platforms (Twitter, Discord, etc.) render the preview
    const pngBuffer = await sharp(svgBuffer)
      .png()
      .toBuffer()

    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('OG image generation failed:', error)
    return NextResponse.json({ error: 'OG image generation failed' }, { status: 500 })
  }
}
