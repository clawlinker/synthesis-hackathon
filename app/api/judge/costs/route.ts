import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

// In-memory cache for Bankr API costs (24 hour TTL)
let bankrCostCache: { data: any; expiresAt: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000

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

// Build byPhase and byCron from agent_log entries
function buildLogBreakdowns(entries: any[]) {
  const byPhase: Record<string, number> = {}
  const byCron: Record<string, number> = {}
  for (const entry of entries) {
    const cost = entry.model_cost_usd || 0
    if (cost <= 0) continue
    const phase = entry.phase || 'unknown'
    byPhase[phase] = (byPhase[phase] || 0) + cost
    const action = entry.action || ''
    // Use action prefix as cron bucket (e.g. "synthesis-agent-smith" → "agent-smith")
    const cronKey = action.replace(/^synthesis-/, '') || 'main'
    byCron[cronKey] = (byCron[cronKey] || 0) + cost
  }
  return { byPhase, byCron }
}

export async function GET() {
  try {
    const bankrData = await fetchBankrCosts()
    const entries = agentLogRaw as any[]

    if (!bankrData) {
      // Fallback to agent_log estimates if Bankr API unavailable
      const breakdown = { total: 0, byModel: {} as Record<string, number>, byPhase: {} as Record<string, number>, byCron: {} as Record<string, number> }
      for (const entry of entries) {
        const model = entry.model || ''
        const cost = entry.model_cost_usd || 0
        if (cost <= 0) continue
        breakdown.total += cost
        breakdown.byModel[model] = (breakdown.byModel[model] || 0) + cost
        const phase = entry.phase || 'unknown'
        breakdown.byPhase[phase] = (breakdown.byPhase[phase] || 0) + cost
        const cronKey = (entry.action || '').replace(/^synthesis-/, '') || 'main'
        breakdown.byCron[cronKey] = (breakdown.byCron[cronKey] || 0) + cost
      }
      return NextResponse.json({ breakdown, source: 'agent_log_estimates', loadedAt: new Date().toISOString() })
    }

    // Build breakdown from real Bankr API data — normalize byModel to plain numbers
    // so the judge page can render them without knowing the response shape.
    // Filter to only bankr/* models to match the judge summary behavior (which
    // filters agent_log for bankr/ models to show Bankr LLM-specific costs).
    const byModelNormalized: Record<string, number> = {}
    for (const m of bankrData.byModel || []) {
      if ((m.totalCost || 0) > 0 && (m.model || '').startsWith('bankr/')) {
        byModelNormalized[m.model] = m.totalCost
      }
    }

    // Supplement byPhase and byCron from agent_log (Bankr API doesn't provide these)
    const { byPhase, byCron } = buildLogBreakdowns(entries)

    const breakdown = {
      total: bankrData.totals?.totalCost || 0,
      totalRequests: bankrData.totals?.totalRequests || 0,
      totalTokens: bankrData.totals?.totalTokens || 0,
      byModel: byModelNormalized,
      byPhase,
      byCron,
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
