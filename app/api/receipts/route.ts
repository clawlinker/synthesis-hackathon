import { NextResponse } from 'next/server'
import { AGENT, USDC_CONTRACT, type Receipt } from '@/app/types'
import sampleReceipts from '@/data/sample-receipts.json'
import { ADDRESS_LABELS } from '@/data/address-labels'

const BASESCAN_API = 'https://api.basescan.org/api'

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

function getServiceFromTx(tx: any): string | undefined {
  const to = tx.to.toLowerCase()
  const from = tx.from.toLowerCase()
  const other = from === AGENT.wallet.toLowerCase() ? to : from
  
  // Specific service logic
  if (other === '0x5776d6d49132516709e11e6e3676e43750163af8') return 'x402 Payment'
  if (other === '0x9c9563816900f862356b243750163af850163af8') return 'Virtuals Job'
  
  return labelAddress(other)
}

export async function GET() {
  try {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: AGENT.wallet,
      contractaddress: USDC_CONTRACT,
      sort: 'desc',
      page: '1',
      offset: '50',
    })

    // Add API key if available
    if (process.env.BASESCAN_API_KEY) {
      params.set('apikey', process.env.BASESCAN_API_KEY)
    }

    const res = await fetch(`${BASESCAN_API}?${params}`, {
      next: { revalidate: 60 }, // cache 60s
    })

    if (!res.ok) throw new Error(`Basescan API error: ${res.status}`)

    const data = await res.json()

    if (data.status !== '1' || !Array.isArray(data.result)) {
      // Fall back to sample data
      return NextResponse.json({ receipts: sampleReceipts, source: 'sample' })
    }

    const receipts: Receipt[] = data.result.map((tx: any) => {
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
    })

    return NextResponse.json({ receipts, source: 'live' })
  } catch (error) {
    console.error('Failed to fetch receipts:', error)
    return NextResponse.json({ receipts: sampleReceipts, source: 'sample' })
  }
}
