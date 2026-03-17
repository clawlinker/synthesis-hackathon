import { NextResponse } from 'next/server'

// In-memory cache for Bankr API costs (1 hour TTL)
let bankrCostCache: { data: any; expiresAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000

async function fetchBankrCosts() {
  // Return cache if fresh
  if (bankrCostCache && Date.now() < bankrCostCache.expiresAt) {
    return bankrCostCache.data
  }

  const apiKey = process.env.BANKR_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://llm.bankr.bot/v1/usage', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    bankrCostCache = { data, expiresAt: Date.now() + CACHE_TTL }
    return data
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const bankrData = await fetchBankrCosts()

    if (!bankrData) {
      // Fallback to agent_log estimates if Bankr API unavailable
      const agentLogRaw = await import('@/agent_log.json')
      const entries = agentLogRaw.default as any[]
      const breakdown = { total: 0, byModel: {} as Record<string, number>, byPhase: {} as Record<string, number>, byCron: {} as Record<string, number> }
      for (const entry of entries) {
        const model = entry.model || ''
        if (!model.startsWith('bankr/')) continue
        const cost = entry.model_cost_usd || 0
        breakdown.total += cost
        breakdown.byModel[model] = (breakdown.byModel[model] || 0) + cost
        const phase = entry.phase || 'unknown'
        breakdown.byPhase[phase] = (breakdown.byPhase[phase] || 0) + cost
      }
      return NextResponse.json({ breakdown, source: 'agent_log_estimates', loadedAt: new Date().toISOString() })
    }

    // Build breakdown from real Bankr API data
    const breakdown = {
      total: bankrData.totals?.totalCost || 0,
      totalRequests: bankrData.totals?.totalRequests || 0,
      totalTokens: bankrData.totals?.totalTokens || 0,
      byModel: {} as Record<string, { cost: number; requests: number; provider: string }>,
    }

    for (const m of bankrData.byModel || []) {
      if (m.totalCost > 0) {
        breakdown.byModel[m.model] = {
          cost: m.totalCost,
          requests: m.requests,
          provider: m.provider,
        }
      }
    }

    return NextResponse.json({
      breakdown,
      period: `${bankrData.startDate?.slice(0, 10)} to ${bankrData.endDate?.slice(0, 10)}`,
      source: 'bankr_api_live',
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate costs' }, { status: 500 })
  }
}
