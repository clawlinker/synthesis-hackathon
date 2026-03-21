/**
 * Wallet Analyzer — Pure categorization and analysis functions
 * No side effects, no API calls. Just math and labels.
 */

import { ADDRESS_LABELS, SERVICE_LABELS, CONTRACTS } from '@/data/config'

// ─── Types ───────────────────────────────────────────────

export interface ParsedTx {
  hash: string
  from: string
  to: string
  value: string       // raw (6 decimals)
  amount: number      // parsed float
  timestamp: number   // unix seconds
  blockNumber: string
  direction: 'sent' | 'received'
  counterparty: string
  label?: string
}

export interface BreakdownEntry {
  category: string
  amount: string
  count: number
  pct: number
}

export interface TopRecipient {
  address: string
  label: string
  amount: string
  count: number
}

export interface Anomaly {
  hash: string
  amount: string
  reason: string
}

export interface WalletStats {
  txCount: number
  timeRange: {
    first: string
    last: string
    days: number
  }
  totalSent: string
  totalReceived: string
  netFlow: string
  breakdown: BreakdownEntry[]
  topRecipients: TopRecipient[]
  anomalies: Anomaly[]
  healthScore: number
  healthLabel: string
}

// ─── Helpers ─────────────────────────────────────────────

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  for (const [key, label] of Object.entries(SERVICE_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

function shortenAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ─── Core Functions ──────────────────────────────────────

/**
 * Parse raw Blockscout tokentx response into typed transactions
 */
export function parseTransactions(
  rawTxs: Array<{
    hash: string
    from: string
    to: string
    value: string
    timeStamp: string
    blockNumber: string
    tokenDecimal?: string
  }>,
  wallet: string
): ParsedTx[] {
  const walletLower = wallet.toLowerCase()

  return rawTxs.map((tx) => {
    const from = tx.from.toLowerCase()
    const to = tx.to.toLowerCase()
    const direction: 'sent' | 'received' = from === walletLower ? 'sent' : 'received'
    const counterparty = direction === 'sent' ? to : from
    const decimals = parseInt(tx.tokenDecimal || '6')
    const amount = parseInt(tx.value) / Math.pow(10, decimals)

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      amount,
      timestamp: parseInt(tx.timeStamp),
      blockNumber: tx.blockNumber,
      direction,
      counterparty,
      label: labelAddress(counterparty),
    }
  })
}

/**
 * Compute full wallet analysis stats
 */
export function analyzeWallet(txs: ParsedTx[]): WalletStats {
  if (txs.length === 0) {
    return {
      txCount: 0,
      timeRange: { first: '', last: '', days: 0 },
      totalSent: '0.00',
      totalReceived: '0.00',
      netFlow: '0.00',
      breakdown: [],
      topRecipients: [],
      anomalies: [],
      healthScore: 0,
      healthLabel: 'No USDC activity detected',
    }
  }

  // Sort by timestamp
  const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp)
  const firstTs = sorted[0].timestamp
  const lastTs = sorted[sorted.length - 1].timestamp
  const days = Math.max(1, Math.ceil((lastTs - firstTs) / 86400))

  // Totals
  const sent = txs.filter((t) => t.direction === 'sent')
  const received = txs.filter((t) => t.direction === 'received')
  const totalSent = sent.reduce((s, t) => s + t.amount, 0)
  const totalReceived = received.reduce((s, t) => s + t.amount, 0)
  const netFlow = totalReceived - totalSent

  // Breakdown by counterparty label
  const breakdown = computeBreakdown(txs)

  // Top recipients
  const topRecipients = findTopRecipients(sent, 5)

  // Anomalies
  const anomalies = detectAnomalies(txs)

  // Health score
  const healthScore = computeHealthScore(txs, days, anomalies.length)
  const healthLabel = getHealthLabel(healthScore)

  return {
    txCount: txs.length,
    timeRange: {
      first: new Date(firstTs * 1000).toISOString(),
      last: new Date(lastTs * 1000).toISOString(),
      days,
    },
    totalSent: totalSent.toFixed(2),
    totalReceived: totalReceived.toFixed(2),
    netFlow: netFlow.toFixed(2),
    breakdown,
    topRecipients,
    anomalies,
    healthScore,
    healthLabel,
  }
}

/**
 * Group transactions by counterparty category
 */
function computeBreakdown(txs: ParsedTx[]): BreakdownEntry[] {
  const groups = new Map<string, { amount: number; count: number }>()
  const totalVolume = txs.reduce((s, t) => s + t.amount, 0)

  for (const tx of txs) {
    const category = tx.label || `Unknown (${shortenAddress(tx.counterparty)})`
    const existing = groups.get(category) || { amount: 0, count: 0 }
    existing.amount += tx.amount
    existing.count++
    groups.set(category, existing)
  }

  return Array.from(groups.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount.toFixed(2),
      count: data.count,
      pct: totalVolume > 0 ? Math.round((data.amount / totalVolume) * 1000) / 10 : 0,
    }))
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
}

/**
 * Find top recipients by sent volume
 */
function findTopRecipients(sentTxs: ParsedTx[], limit: number): TopRecipient[] {
  const recipients = new Map<string, { amount: number; count: number; label: string }>()

  for (const tx of sentTxs) {
    const addr = tx.counterparty.toLowerCase()
    const existing = recipients.get(addr) || {
      amount: 0,
      count: 0,
      label: tx.label || `Unknown (${shortenAddress(addr)})`,
    }
    existing.amount += tx.amount
    existing.count++
    recipients.set(addr, existing)
  }

  return Array.from(recipients.entries())
    .map(([address, data]) => ({
      address,
      label: data.label,
      amount: data.amount.toFixed(2),
      count: data.count,
    }))
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, limit)
}

/**
 * Detect anomalous transactions using z-score
 */
function detectAnomalies(txs: ParsedTx[]): Anomaly[] {
  if (txs.length < 3) return []

  const amounts = txs.map((t) => t.amount)
  const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length
  const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)

  const totalVolume = amounts.reduce((s, a) => s + a, 0)
  const anomalies: Anomaly[] = []

  for (const tx of txs) {
    const reasons: string[] = []

    // Z-score check (>2 standard deviations)
    if (stdDev > 0) {
      const zScore = (tx.amount - mean) / stdDev
      if (zScore > 2) {
        reasons.push(`${zScore.toFixed(1)}x std dev above average ($${mean.toFixed(2)})`)
      }
    }

    // Single tx > 50% of total volume
    if (totalVolume > 0 && tx.amount / totalVolume > 0.5) {
      reasons.push(`${((tx.amount / totalVolume) * 100).toFixed(0)}% of total volume in single tx`)
    }

    if (reasons.length > 0) {
      anomalies.push({
        hash: tx.hash,
        amount: tx.amount.toFixed(2),
        reason: reasons.join('; '),
      })
    }
  }

  return anomalies.slice(0, 10) // Cap at 10 anomalies
}

/**
 * Compute health score (0-100) based on wallet activity patterns
 */
function computeHealthScore(txs: ParsedTx[], days: number, anomalyCount: number): number {
  let score = 50 // Start neutral

  // Activity frequency (max +20)
  const txsPerDay = txs.length / Math.max(days, 1)
  if (txsPerDay >= 1) score += 20
  else if (txsPerDay >= 0.3) score += 15
  else if (txsPerDay >= 0.1) score += 10
  else score += 5

  // Diversity of counterparties (max +15)
  const uniqueCounterparties = new Set(txs.map((t) => t.counterparty)).size
  if (uniqueCounterparties >= 10) score += 15
  else if (uniqueCounterparties >= 5) score += 10
  else if (uniqueCounterparties >= 3) score += 7
  else score += 3

  // Net flow direction (max +10)
  const totalSent = txs.filter((t) => t.direction === 'sent').reduce((s, t) => s + t.amount, 0)
  const totalReceived = txs.filter((t) => t.direction === 'received').reduce((s, t) => s + t.amount, 0)
  if (totalReceived > totalSent) score += 10 // Earning more than spending
  else if (totalReceived > totalSent * 0.5) score += 5 // Some income

  // Wallet age (max +10)
  if (days >= 90) score += 10
  else if (days >= 30) score += 7
  else if (days >= 7) score += 4
  else score += 1

  // Anomaly penalty (max -15)
  if (anomalyCount >= 5) score -= 15
  else if (anomalyCount >= 3) score -= 10
  else if (anomalyCount >= 1) score -= 5

  // Transaction volume confidence (max +5)
  if (txs.length >= 50) score += 5
  else if (txs.length >= 20) score += 3
  else if (txs.length >= 5) score += 1

  return Math.max(0, Math.min(100, score))
}

/**
 * Human-readable health label
 */
function getHealthLabel(score: number): string {
  if (score >= 85) return 'Highly active, diversified wallet'
  if (score >= 70) return 'Active wallet with healthy patterns'
  if (score >= 55) return 'Moderate activity, typical usage'
  if (score >= 40) return 'Low activity or concentrated spending'
  if (score >= 20) return 'Minimal activity detected'
  return 'No USDC activity detected'
}
