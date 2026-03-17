#!/usr/bin/env node
/**
 * Build-time receipt fetcher — runs as `prebuild` step.
 * Fetches USDC transactions for both wallets via Blockscout REST API v2
 * and saves results to data/cached-receipts.json.
 * Fails gracefully: if fetch fails, the build continues without updating the cache.
 */

const fs = require('fs')
const path = require('path')

// Configuration (mirrors app/types.ts & data/config.ts)
const WALLETS = [
  { wallet: '0x5793BFc1331538C5A8028e71Cc22B43750163af8', name: 'Clawlinker', agentId: '22945' },
  { wallet: '0x4de988e65a32a12487898c10bc63a88abea2e292', name: 'Bankr', agentId: '0' },
]

const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2'
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'cached-receipts.json')
const FETCH_TIMEOUT_MS = 30_000
const TARGET_COUNT = 50

// Address labels (mirrors data/config.ts)
const ADDRESS_LABELS = {
  '0x5793bfc1331538c5a8028e71cc22b43750163af8': 'Clawlinker (Agent)',
  '0x4de9236423ccf24c084d5dfd3581177699477699': 'Bankr Wallet',
  '0x4de988e65a32a12487898c10bc63a88abea2e292': 'Bankr (Clawlinker)',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC Contract',
  '0x5776d6d49132516709e11e6e3676e43750163af8': 'x402 Facilitator (CDP)',
  '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  '0x4104000000000000000000000000000000004104': 'x402 Exact Permit2 Proxy',
  '0x3216893708d46a928ebe06990c29ead64590163a': 'Clawdia (Agent)',
  '0x9c9563816900f862356b243750163af850163af8': 'Virtuals ACP',
  '0xcb5e412977f09e7b358117769947769947769947': 'pawr.link Treasury',
}

function labelAddress(address) {
  return ADDRESS_LABELS[address.toLowerCase()]
}

function getServiceFromTx(from, to, wallet) {
  const toLower = to.toLowerCase()
  const fromLower = from.toLowerCase()
  const other = fromLower === wallet.toLowerCase() ? toLower : fromLower
  if (other === '0x5776d6d49132516709e11e6e3676e43750163af8') return 'x402 Facilitator'
  if (other === '0x9c9563816900f862356b243750163af850163af8') return 'Virtuals ACP'
  return labelAddress(other)
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

async function fetchForWallet({ wallet, agentId }) {
  const receipts = []
  let nextPageParams = null

  // Fetch up to TARGET_COUNT items with pagination
  while (receipts.length < TARGET_COUNT) {
    let url = `${BLOCKSCOUT_API}/addresses/${wallet}/token-transfers?token=${USDC_CONTRACT}&type=ERC-20`
    if (nextPageParams) {
      const p = new URLSearchParams(nextPageParams)
      url += `&${p.toString()}`
    }

    console.log(`  Fetching ${wallet.slice(0, 10)}... (${receipts.length} so far)`)

    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const items = data.items || []

    if (items.length === 0) break

    for (const item of items) {
      const from = item.from?.hash || ''
      const to = item.to?.hash || ''
      const rawValue = item.total?.value || '0'
      const decimals = item.total?.decimals || '6'
      const timestampIso = item.timestamp || ''
      const timestampUnix = timestampIso ? Math.floor(Date.parse(timestampIso) / 1000) : 0
      const direction = from.toLowerCase() === wallet.toLowerCase() ? 'sent' : 'received'

      receipts.push({
        hash: item.transaction_hash || '',
        from,
        to,
        value: rawValue,
        amount: (parseInt(rawValue) / Math.pow(10, parseInt(decimals))).toFixed(2),
        timestamp: timestampUnix,
        blockNumber: item.block_number?.toString() || '0',
        direction,
        status: 'confirmed',
        tokenSymbol: 'USDC',
        tokenDecimal: decimals,
        chain: 'base', // All receipts fetched from Base chain via Blockscout
        agentId,
        service: getServiceFromTx(from, to, wallet),
        fromLabel: labelAddress(from),
        toLabel: labelAddress(to),
      })

      if (receipts.length >= TARGET_COUNT) break
    }

    // Check if there's a next page
    if (data.next_page_params && receipts.length < TARGET_COUNT) {
      nextPageParams = data.next_page_params
    } else {
      break
    }
  }

  console.log(`  Got ${receipts.length} txs for ${wallet.slice(0, 10)}...`)
  return receipts
}

async function main() {
  console.log('🔄 fetch-receipts: fetching USDC transactions at build time via Blockscout REST API...')

  let allReceipts = []

  try {
    // Fetch wallets sequentially to avoid rate limits
    for (const walletConfig of WALLETS) {
      try {
        const receipts = await fetchForWallet(walletConfig)
        allReceipts = allReceipts.concat(receipts)
      } catch (err) {
        console.warn(`  ⚠️  Failed for ${walletConfig.wallet.slice(0, 10)}...: ${err.message}`)
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }

  if (allReceipts.length === 0) {
    console.warn('\n⚠️  Could not fetch any transactions — cache not updated.')
    console.warn('   Build will continue using existing cache (if any) or sample data.')
    process.exit(0)
  }

  // Sort newest first
  allReceipts.sort((a, b) => b.timestamp - a.timestamp)

  const output = {
    fetchedAt: new Date().toISOString(),
    count: allReceipts.length,
    receipts: allReceipts,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))
  console.log(`\n✅ Saved ${allReceipts.length} receipts to data/cached-receipts.json`)
  console.log(`   Fetched at: ${output.fetchedAt}`)
}

main().catch(err => {
  console.error('❌ fetch-receipts script error:', err.message)
  process.exit(0) // Graceful — don't break the build
})
