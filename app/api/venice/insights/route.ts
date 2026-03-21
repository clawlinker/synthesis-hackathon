import { NextResponse } from 'next/server'

const VENICE_API_KEY = process.env.VENICE_API_KEY
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1'
const VENICE_MODEL = 'llama-3.3-70b'

// In-memory cache (24h TTL)
let insightsCache: { data: VeniceInsights; expiresAt: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000

interface VeniceInsights {
  summary: string
  anomalies: string[]
  recommendations: string[]
  operationalStatus: 'healthy' | 'watch' | 'critical'
  statusReason: string
  generatedAt: string
  model: string
  privacyNote: string
}

// Use build-time cached receipts (same source as the main receipts endpoint)
import cachedReceiptsData from '@/data/cached-receipts.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchReceiptData(): string {
  try {
    const data = cachedReceiptsData as unknown as { receipts: Record<string, unknown>[] }
    const receipts = data.receipts || []
    
    if (!receipts.length) {
      return 'No recent transaction data available.'
    }
    
    // Format transactions for Venice analysis (anonymize addresses, keep patterns)
    const txSummary = receipts.slice(0, 40).map((r) => {
      const from = String(r.from || '')
      const to = String(r.to || '')
      const direction = String(r.direction || 'unknown')
      const amount = parseFloat(String(r.amount || r.value || '0'))
      const symbol = String(r.tokenSymbol || 'USDC')
      const timestamp = r.timestamp ? new Date(Number(r.timestamp) * 1000).toISOString().slice(0, 10) : 'unknown'
      const counterparty = direction === 'sent' ? to.slice(0, 6) + '...' : from.slice(0, 6) + '...'
      const service = r.service ? ` [${r.service}]` : r.toLabel ? ` [${r.toLabel}]` : ''
      return `${timestamp} | ${direction} | $${amount.toFixed(4)} ${symbol} | ${counterparty}${service}`
    }).join('\n')
    
    return txSummary
  } catch (err) {
    return 'Error reading transaction data.'
  }
}

async function generateVeniceInsights(txData: string): Promise<VeniceInsights> {
  if (!VENICE_API_KEY) {
    throw new Error('VENICE_API_KEY not configured')
  }

  const systemPrompt = `You are a senior on-chain forensic analyst specializing in autonomous agent economies on Base L2. You produce institutional-grade spending intelligence from USDC transaction data.

## Analysis Framework

1. **Behavioral Classification** — Categorize this wallet's economic role:
   - Builder (pays for infra/services to create value)
   - Trader (swaps, arbitrage, MEV)
   - Service provider (earns from x402/ACP endpoints)
   - Treasury/multisig (holds and distributes)
   - Consumer (pure spend, no revenue)

2. **Cash Flow Dynamics** — Identify:
   - Revenue streams vs cost centers
   - Burn rate (daily/weekly spend velocity)
   - Runway estimate if spend > income
   - Concentration risk (% of spend to single counterparty)

3. **Temporal Patterns** — Look for:
   - Spending cadence (bursty vs steady)
   - Time-of-day clustering (suggests automated crons vs manual)
   - Trend direction (spending accelerating, decelerating, or flat)

4. **Anomaly Detection** — Only flag REAL anomalies:
   - Single tx > 3x the median (not just above average)
   - Sudden counterparty change (new large recipient)
   - Irregular timing breaks from established patterns
   - Do NOT flag routine micropayments ($0.01 facilitator fees) as anomalies

## Output Rules
- Be ruthlessly concise. No filler phrases.
- Use service names (x402 Facilitator, Bankr, pawr.link, checkr) not hex addresses.
- Dollar amounts with 2 decimal places.
- Summary: 2-3 sentences that a CFO would find useful. Lead with the insight, not the data.
- Anomalies: only genuinely unusual patterns. Empty array is fine.
- Recommendations: max 2, specific and actionable (e.g. "Diversify inference providers — 94% of spend goes to Bankr" not "Consider monitoring expenses").
- Operational status: this is NOT a risk rating. It's operational health — can this agent keep running?
  - "healthy" = sustainable operations, no blockers
  - "watch" = something needs attention (single-vendor dependency, burn > revenue, unusual pattern) — explain WHAT specifically
  - "critical" = agent operations at risk (wallet draining, service disruption, anomalous outflows)
- statusReason: ONE short phrase explaining the status (e.g. "94% vendor concentration on Bankr" or "burn rate exceeds revenue 3:1"). Required for watch/critical, optional for healthy.

## JSON Response Format
{
  "summary": "...",
  "anomalies": ["..."],
  "recommendations": ["..."],
  "operationalStatus": "healthy|watch|critical",
  "statusReason": "..."
}

## Context
This is Clawlinker (ERC-8004 #22945), an autonomous AI agent on Base. Known cost centers: Bankr (LLM inference), x402 Facilitator/Fee addresses (micropayment protocol fees — $0.01 each is NORMAL), checkr (social intelligence API). Known revenue: x402 earnings from pawr.link profile creation ($9-$10/profile). Address 0x4de9... is the Bankr hot wallet. Address 0x5793... is the x402 wallet.`

  const res = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VENICE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze these recent USDC transactions for an autonomous AI agent:\n\n${txData}` },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Venice API error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  
  // Parse JSON from response (handle markdown code blocks)
  let parsed: { summary: string; anomalies: string[]; recommendations: string[]; operationalStatus: string; statusReason: string }
  try {
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    // Fallback if JSON parsing fails
    parsed = {
      summary: content.slice(0, 300),
      anomalies: [],
      recommendations: [],
      operationalStatus: 'healthy',
      statusReason: '',
    }
  }

  return {
    summary: parsed.summary,
    anomalies: parsed.anomalies || [],
    recommendations: parsed.recommendations || [],
    operationalStatus: (['healthy', 'watch', 'critical'].includes(parsed.operationalStatus) ? parsed.operationalStatus : 'healthy') as 'healthy' | 'watch' | 'critical',
    statusReason: parsed.statusReason || '',
    generatedAt: new Date().toISOString(),
    model: VENICE_MODEL,
    privacyNote: 'Analysis performed via Venice AI with zero data retention. No transaction data is stored or logged by the inference provider.',
  }
}

export async function GET() {
  try {
    // Check cache
    if (insightsCache && Date.now() < insightsCache.expiresAt) {
      return NextResponse.json({
        ...insightsCache.data,
        cached: true,
        source: 'venice_private_inference',
      })
    }

    const txData = await fetchReceiptData()
    const insights = await generateVeniceInsights(txData)

    // Cache result
    insightsCache = { data: insights, expiresAt: Date.now() + CACHE_TTL }

    return NextResponse.json({
      ...insights,
      cached: false,
      source: 'venice_private_inference',
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to generate private insights', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
