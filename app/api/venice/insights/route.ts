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

  const systemPrompt = `You are a concise on-chain analyst for autonomous AI agents on Base L2.

Analyze this wallet's USDC activity. Return ONLY a JSON object — no preamble, no explanation, no markdown fences. Just the raw JSON.

## Rules
- If healthy: summary is ONE short sentence highlighting receipt count and total volume (e.g. "X receipts totaling $Y over Z days — all normal"). Do NOT calculate daily burn rate (transactions are irregular, not daily). No recommendations. Empty anomalies array.
- If watch/critical: summary is 1-2 sentences explaining the issue. Max 1 recommendation. Only flag genuine anomalies.
- Use service names not hex addresses. Dollar amounts with 2 decimals.
- Spending heavily on core infra (Bankr for LLM inference) is EXPECTED, not a problem.
- $0.01 facilitator fees are routine, never flag them.
- NEVER divide total spend by days to get "daily burn" — transactions are bursty, not uniform.

## Status
- "healthy" = sustainable, no issues. Most agents are healthy.
- "watch" = burn significantly exceeds revenue, or unknown large recipient appeared.
- "critical" = wallet draining fast, anomalous outflows.

## JSON Format
{
  "summary": "...",
  "anomalies": [],
  "recommendations": [],
  "operationalStatus": "healthy|watch|critical",
  "statusReason": "short phrase"
}

## Context
Clawlinker (ERC-8004 #22945). Known services: Bankr (LLM inference), x402 Facilitator ($0.01 fees = normal), checkr (social intel). Revenue: x402 earnings ($9-$10/profile). 0x4de9... = Bankr wallet. 0x5793... = x402 wallet.`

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
  
  // Parse JSON from response — model may include preamble text before/after the JSON
  let parsed: { summary: string; anomalies: string[]; recommendations: string[]; operationalStatus: string; statusReason: string }
  try {
    // Strategy: find the first { and last } to extract the JSON object
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) throw new Error('No JSON found')
    const jsonStr = content.slice(firstBrace, lastBrace + 1)
    parsed = JSON.parse(jsonStr)
  } catch {
    // Fallback if JSON parsing fails
    parsed = {
      summary: content.replace(/```json?\n?/g, '').replace(/```/g, '').replace(/\{[\s\S]*\}/g, '').trim().slice(0, 200) || 'Analysis unavailable',
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
