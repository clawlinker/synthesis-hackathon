import { NextResponse } from 'next/server'
import { type Receipt } from '@/app/types'
import { ADDRESS_LABELS } from '@/data/config'

const TEMPO_RPC = 'https://rpc.tempo.xyz'
const TEMPO_USDC = '0x20c000000000000000000000b9537d11c60e8b50'
const TEMPO_WALLET = '0xf7567C97c882c759E809EaC4772932154F35ab05'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const DECIMALS = 6

// Pad address to 32-byte topic
function toTopic(addr: string): string {
  return '0x000000000000000000000000' + addr.replace(/^0x/, '').toLowerCase()
}

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

interface RpcLog {
  transactionHash: string
  blockNumber: string
  topics: string[]
  data: string
  address: string
}

async function queryLogs(fromTopic: string | null, toTopic: string | null): Promise<RpcLog[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(TEMPO_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          address: TEMPO_USDC,
          topics: [TRANSFER_TOPIC, fromTopic, toTopic],
        }],
        id: 1,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return []
    const json = await res.json() as { result?: RpcLog[]; error?: unknown }
    if (json.error) {
      console.warn('Tempo RPC error:', json.error)
      return []
    }
    return json.result || []
  } catch (e) {
    clearTimeout(timeoutId)
    console.warn('Tempo RPC fetch failed:', e)
    return []
  }
}

async function getBlockTimestamp(blockNumber: string): Promise<number> {
  try {
    const res = await fetch(TEMPO_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, false],
        id: 1,
      }),
    })
    const json = await res.json() as { result?: { timestamp?: string } }
    if (json.result?.timestamp) {
      return parseInt(json.result.timestamp, 16)
    }
  } catch { /* ignore */ }
  return Math.floor(Date.now() / 1000)
}

function logToReceipt(log: RpcLog, direction: 'sent' | 'received', ts: number): Receipt {
  // topic[1] = from (padded), topic[2] = to (padded)
  const from = '0x' + log.topics[1].slice(-40)
  const to = '0x' + log.topics[2].slice(-40)
  const rawValue = BigInt(log.data).toString()
  const amount = (Number(BigInt(log.data)) / Math.pow(10, DECIMALS)).toFixed(2)

  const fromLabel = labelAddress(from)
  const toLabel = labelAddress(to)
  const counterpart = direction === 'sent' ? to : from
  const service = labelAddress(counterpart)

  return {
    hash: log.transactionHash,
    from,
    to,
    value: rawValue,
    amount,
    timestamp: ts,
    blockNumber: parseInt(log.blockNumber, 16).toString(),
    direction,
    status: 'confirmed',
    tokenSymbol: 'USDC.e',
    tokenDecimal: DECIMALS.toString(),
    chain: 'tempo',
    service,
    fromLabel,
    toLabel,
    receiptType: 'onchain',
  }
}

export async function GET() {
  try {
    const walletTopic = toTopic(TEMPO_WALLET)

    // Fetch received (wallet is `to`) and sent (wallet is `from`) in parallel
    const [receivedLogs, sentLogs] = await Promise.all([
      queryLogs(null, walletTopic),
      queryLogs(walletTopic, null),
    ])

    const allLogs = [...receivedLogs, ...sentLogs]
    if (allLogs.length === 0) {
      return NextResponse.json({ receipts: [], source: 'tempo-live' }, {
        headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
      })
    }

    // Deduplicate by tx hash + direction
    const seen = new Set<string>()
    const uniqueLogs: { log: RpcLog; direction: 'sent' | 'received' }[] = []
    for (const log of receivedLogs) {
      const key = log.transactionHash + ':received'
      if (!seen.has(key)) { seen.add(key); uniqueLogs.push({ log, direction: 'received' }) }
    }
    for (const log of sentLogs) {
      const key = log.transactionHash + ':sent'
      if (!seen.has(key)) { seen.add(key); uniqueLogs.push({ log, direction: 'sent' }) }
    }

    // Batch-resolve block timestamps (deduplicate block numbers)
    const blockNumbers = [...new Set(uniqueLogs.map(({ log }) => log.blockNumber))]
    const tsMap = new Map<string, number>()
    await Promise.all(blockNumbers.map(async (bn) => {
      const ts = await getBlockTimestamp(bn)
      tsMap.set(bn, ts)
    }))

    const receipts: Receipt[] = uniqueLogs.map(({ log, direction }) => {
      const ts = tsMap.get(log.blockNumber) ?? Math.floor(Date.now() / 1000)
      return logToReceipt(log, direction, ts)
    })

    receipts.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({ receipts, source: 'tempo-live' }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    })
  } catch (e) {
    console.error('tempo-receipts route error:', e)
    return NextResponse.json({ receipts: [], source: 'tempo-error' }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    })
  }
}
