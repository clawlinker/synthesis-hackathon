import { NextResponse } from 'next/server'

// In-memory cache for hackathon Bankr API costs (24 hour TTL)
let hackathonCostCache: { data: HackathonCostData; expiresAt: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000

interface ModelBreakdown {
  cost: number
  requests: number
  provider: string
}

interface HackathonCostData {
  breakdown: {
    total: number
    totalRequests: number
    totalTokens: number
    byModel: Record<string, ModelBreakdown>
  }
  period: string
  source: string
  loadedAt: string
}

async function fetchHackathonCosts(): Promise<HackathonCostData | null> {
  // Return cache if fresh
  if (hackathonCostCache && Date.now() < hackathonCostCache.expiresAt) {
    return hackathonCostCache.data
  }

  const apiKey = process.env.BANKR_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://llm.bankr.bot/v1/usage?days=10', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!res.ok) return null
    const data = await res.json()

    const breakdown: HackathonCostData['breakdown'] = {
      total: data.totals?.totalCost || 0,
      totalRequests: data.totals?.totalRequests || 0,
      totalTokens: data.totals?.totalTokens || 0,
      byModel: {},
    }

    for (const m of data.byModel || []) {
      if (m.totalCost > 0) {
        breakdown.byModel[m.model] = {
          cost: m.totalCost,
          requests: m.requests,
          provider: m.provider,
        }
      }
    }

    const result: HackathonCostData = {
      breakdown,
      period: `${data.startDate?.slice(0, 10)} to ${data.endDate?.slice(0, 10)}`,
      source: 'bankr_api_live',
      loadedAt: new Date().toISOString(),
    }

    hackathonCostCache = { data: result, expiresAt: Date.now() + CACHE_TTL }
    return result
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const result = await fetchHackathonCosts()
    if (!result) {
      return NextResponse.json({ error: 'Bankr API unavailable or missing API key' }, { status: 503 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch hackathon costs' }, { status: 500 })
  }
}
