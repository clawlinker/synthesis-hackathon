import { NextResponse } from 'next/server'
import { AGENT, USDC_CONTRACT, type Receipt } from '@/app/types'
import sampleReceipts from '@/data/sample-receipts.json'

const BASESCAN_API = 'https://api.basescan.org/api'

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

    const receipts: Receipt[] = data.result.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      amount: (parseInt(tx.value) / 1e6).toFixed(2),
      timestamp: parseInt(tx.timeStamp),
      blockNumber: tx.blockNumber,
      direction: tx.from.toLowerCase() === AGENT.wallet.toLowerCase() ? 'sent' : 'received',
      status: 'confirmed' as const,
      tokenSymbol: tx.tokenSymbol,
      tokenDecimal: tx.tokenDecimal,
      agentId: '22945',
    }))

    return NextResponse.json({ receipts, source: 'live' })
  } catch (error) {
    console.error('Failed to fetch receipts:', error)
    return NextResponse.json({ receipts: sampleReceipts, source: 'sample' })
  }
}
