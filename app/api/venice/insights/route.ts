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
  riskLevel: 'low' | 'medium' | 'high'
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

  const systemPrompt = `You are a concise financial analyst for AI agents. Analyze USDC transactions and respond in JSON only.

Rules:
- Be direct. No filler. No "The agent has been involved in..."
- Use service names when obvious (x402 facilitator, Bankr, CDP) not hex addresses
- Focus on actionable patterns, not restating the data
- Summary: 1-2 punchy sentences max
- Anomalies: only flag genuinely unusual patterns, not routine micro-payments
- Recommendations: specific and actionable, max 2

JSON format:
{
  "summary": "...",
  "anomalies": ["..."],
  "recommendations": ["..."],
  "riskLevel": "low|medium|high"
}

Context: This is Clawlinker, an autonomous AI agent on Base. It pays for LLM inference via Bankr, earns x402 micropayments, and transacts USDC for services. Small $0.01 payments to 0xA6a8... are x402 facilitator fees (normal). Address 0x4de9... is the Bankr wallet.`

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
  let parsed: { summary: string; anomalies: string[]; recommendations: string[]; riskLevel: string }
  try {
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    // Fallback if JSON parsing fails
    parsed = {
      summary: content.slice(0, 300),
      anomalies: [],
      recommendations: [],
      riskLevel: 'low',
    }
  }

  return {
    summary: parsed.summary,
    anomalies: parsed.anomalies || [],
    recommendations: parsed.recommendations || [],
    riskLevel: (parsed.riskLevel as 'low' | 'medium' | 'high') || 'low',
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
