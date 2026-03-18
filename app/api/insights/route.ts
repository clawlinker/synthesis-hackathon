import { NextResponse } from 'next/server'
import cachedReceiptsData from '@/data/cached-receipts.json'

// Cache for LLM responses (1 hour TTL)
interface CacheEntry {
  data: InsightsResponse
  expiresAt: number
}

let insightsCache: CacheEntry | null = null
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface InsightsResponse {
  insights: {
    summary: string
    patterns: string[]
    topCounterparties: Counterparty[]
    spendingTrend: 'increasing' | 'decreasing' | 'stable'
    generatedBy: string
    generatedAt: string
  }
}

interface Counterparty {
  name: string
  count: number
  total: string
}

interface Receipt {
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
  service?: string
  fromLabel?: string
  toLabel?: string
}

interface ReceiptsData {
  receipts: Receipt[]
}

// Compute raw stats from receipts (without calling LLM)
function computeStats(receipts: Receipt[]): {
  totalSent: number
  totalReceived: number
  transactionCount: number
  counterpartyCounts: Record<string, { count: number; total: number }>
  timestamps: number[]
} {
  const stats = {
    totalSent: 0,
    totalReceived: 0,
    transactionCount: 0,
    counterpartyCounts: {} as Record<string, { count: number; total: number }>,
    timestamps: [] as number[],
  }

  for (const receipt of receipts) {
    const amount = parseFloat(receipt.amount) || 0
    const counterparty = receipt.service || receipt.toLabel || receipt.fromLabel || (receipt.direction === 'sent' ? receipt.to : receipt.from)

    if (receipt.direction === 'sent') {
      stats.totalSent += amount
    } else {
      stats.totalReceived += amount
    }

    stats.transactionCount++

    if (!stats.counterpartyCounts[counterparty]) {
      stats.counterpartyCounts[counterparty] = { count: 0, total: 0 }
    }
    stats.counterpartyCounts[counterparty].count++
    stats.counterpartyCounts[counterparty].total += amount

    stats.timestamps.push(receipt.timestamp)
  }

  return stats
}

// Format USD amount
function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`
}

// Determine spending trend (compare first half vs second half)
function determineTrend(timestamps: number[], amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (timestamps.length < 2) return 'stable'
  
  // Pair timestamps with amounts and sort by timestamp
  const paired = timestamps.map((ts, i) => ({ ts, amount: amounts[i] }))
    .sort((a, b) => a.ts - b.ts)
  
  const half = Math.floor(paired.length / 2)
  const firstHalf = paired.slice(0, half).reduce((sum, p) => sum + p.amount, 0)
  const secondHalf = paired.slice(half).reduce((sum, p) => sum + p.amount, 0)
  
  if (firstHalf === 0) return 'increasing'
  
  const ratio = secondHalf / firstHalf
  if (ratio > 1.1) return 'increasing'
  if (ratio < 0.9) return 'decreasing'
  return 'stable'
}

// Get unique counterparties sorted by total
function getTopCounterparties(counterpartyCounts: Record<string, { count: number; total: number }>, limit: number = 5): Counterparty[] {
  return Object.entries(counterpartyCounts)
    .map(([name, data]) => ({
      name,
      count: data.count,
      total: formatUSD(data.total),
    }))
    .sort((a, b) => b.count - a.count) // Sort by count for top counterparties
    .slice(0, limit)
}

// Generate LLM prompt for insights
function generateLLMPrompt(stats: {
  totalSent: number
  totalReceived: number
  transactionCount: number
  counterpartyCounts: Record<string, { count: number; total: number }>
  timestamps: number[]
}): string {
  const topCounterparties = getTopCounterparties(stats.counterpartyCounts, 3)
  const trend = determineTrend(stats.timestamps, Object.values(stats.counterpartyCounts).map(c => c.total))
  const avgTx = stats.transactionCount > 0 ? (stats.totalSent / stats.transactionCount).toFixed(2) : '0'
  
  const summaryLines = [
    'Analyze these USDC transaction insights and provide a natural language summary. Keep it concise (2-3 sentences).',
    '',
    'Transaction Summary:',
    `- Total Sent: ${formatUSD(stats.totalSent)}`,
    `- Total Received: ${formatUSD(stats.totalReceived)}`,
    `- Total Transactions: ${stats.transactionCount}`,
    `- Average Transaction: $${avgTx}`,
    `- Spending Trend: ${trend}`,
    '',
    'Top Counterparties (by transaction count):',
    ...topCounterparties.map((c, i) => `${i + 1}. ${c.name}: ${c.count} txns, ${c.total}`),
    '',
    'Pattern Analysis:',
    `- First transaction: ${stats.timestamps.length > 0 ? new Date(stats.timestamps[0] * 1000).toISOString().split('T')[0] : 'N/A'}`,
    `- Last transaction: ${stats.timestamps.length > 0 ? new Date(stats.timestamps[stats.timestamps.length - 1] * 1000).toISOString().split('T')[0] : 'N/A'}`,
    `- Total days active: ${stats.timestamps.length > 1 ? Math.round((Math.max(...stats.timestamps) - Math.min(...stats.timestamps)) / 86400) : 0}`,
    '',
    'Please provide:',
    '1. A concise summary of the transaction activity',
    '2. 2-3 key patterns observed (e.g., weekday activity, average transaction size)',
    '3. The top counterparty if clear',
    '',
    'Return your response as JSON with this schema: {"summary": string, "patterns": string[], "generatedBy": "bankr/qwen3.5-flash"}'
  ]
  
  return summaryLines.join('\n')
}

// Call Bankr LLM Gateway
async function callBankrLLM(prompt: string): Promise<InsightsResponse | null> {
  const apiKey = process.env.BANKR_API_KEY
  
  if (!apiKey) {
    console.warn('BANKR_API_KEY not set — skipping LLM call')
    return null
  }

  try {
    const response = await fetch('https://llm.bankr.bot/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen3.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes USDC transaction data and provides concise, natural language insights. Always respond with valid JSON matching the requested schema.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.warn(`Bankr LLM API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    // Parse the JSON response
    let parsed: Partial<InsightsResponse>['insights'] | undefined
    try {
      parsed = JSON.parse(content)
    } catch {
      console.warn('Failed to parse LLM response as JSON:', content.substring(0, 200))
      return null
    }

    if (!parsed) {
      return null
    }

    return {
      insights: {
        summary: parsed.summary || 'Transaction analysis complete.',
        patterns: parsed.patterns || [],
        topCounterparties: parsed.topCounterparties || getTopCounterparties({}, 3),
        spendingTrend: parsed.spendingTrend || 'stable',
        generatedBy: 'bankr/qwen3.5-flash',
        generatedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.warn('Bankr LLM API call failed:', error)
    return null
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const receiptsData = cachedReceiptsData as ReceiptsData
    const receipts = receiptsData.receipts || []

    if (receipts.length === 0) {
      return NextResponse.json(
        { error: 'No receipts data available' },
        { status: 503 }
      )
    }

    // Compute raw stats
    const stats = computeStats(receipts)
    
    // Check cache first
    const now = Date.now()
    if (insightsCache && now < insightsCache.expiresAt) {
      return NextResponse.json(
        { insights: insightsCache.data.insights },
        { 
          headers: {
            'Cache-Control': 'public, max-age=300',
            'X-Cache': 'HIT'
          }
        }
      )
    }

    // Generate prompt and call LLM
    const prompt = generateLLMPrompt(stats)
    const llmResponse = await callBankrLLM(prompt)

    let finalResponse: InsightsResponse

    if (llmResponse) {
      finalResponse = llmResponse
      // Cache the response
      insightsCache = {
        data: finalResponse,
        expiresAt: now + CACHE_TTL_MS,
      }
    } else {
      // Fallback: return raw stats without LLM narrative
      const topCounterparties = getTopCounterparties(stats.counterpartyCounts)
      const trend = determineTrend(
        stats.timestamps, 
        Object.values(stats.counterpartyCounts).map(c => c.total)
      )
      
      // Create compact summary from raw stats
      const avgTx = stats.transactionCount > 0 ? (stats.totalSent / stats.transactionCount).toFixed(2) : '0'
      
      finalResponse = {
        insights: {
          summary: `Clawlinker has made ${stats.transactionCount} USDC transactions totaling ${formatUSD(stats.totalSent)} sent and ${formatUSD(stats.totalReceived)} received. Average transaction size: $${avgTx}.`,
          patterns: [
            stats.totalSent > 0 ? `Total sent: ${formatUSD(stats.totalSent)}` : 'No outgoing transactions',
            stats.totalReceived > 0 ? `Total received: ${formatUSD(stats.totalReceived)}` : 'No incoming transactions',
          ],
          topCounterparties,
          spendingTrend: trend,
          generatedBy: 'bankr/raw-stats',
          generatedAt: new Date().toISOString(),
        }
      }
    }

    return NextResponse.json(
      { insights: finalResponse.insights },
      { 
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Cache': insightsCache && now < insightsCache.expiresAt ? 'HIT' : 'MISS'
        }
      }
    )
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
