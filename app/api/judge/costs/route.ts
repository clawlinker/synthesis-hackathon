import { NextResponse } from 'next/server'

// In-memory cache for cost breakdown
let cachedCosts: any | null = null
let cacheTime: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minute

async function calculateCostBreakdown(): Promise<{
  total: number
  byCron: Record<string, number>
  byPhase: Record<string, number>
  byModel: Record<string, number>
}> {
  const now = Date.now()
  if (cachedCosts && (now - cacheTime) < CACHE_DURATION) {
    return cachedCosts
  }
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const logPath = path.join(process.cwd(), 'agent_log.json')
    const content = fs.readFileSync(logPath, 'utf8')
    const entries = JSON.parse(content)
    
    const breakdown = {
      total: 0,
      byCron: {} as Record<string, number>,
      byPhase: {} as Record<string, number>,
      byModel: {} as Record<string, number>,
    }
    
    for (const entry of entries) {
      const cost = entry.model_cost_usd || 0
      breakdown.total += cost
      
      // By phase
      const phase = entry.phase || 'unknown'
      breakdown.byPhase[phase] = (breakdown.byPhase[phase] || 0) + cost
      
      // By model (extract model name without provider prefix)
      const model = entry.model || 'unknown'
      breakdown.byModel[model] = (breakdown.byModel[model] || 0) + cost
      
      // By cron/action
      const cron = entry.action || 'unknown'
      breakdown.byCron[cron] = (breakdown.byCron[cron] || 0) + cost
    }
    
    cachedCosts = breakdown
    cacheTime = now
    
    return breakdown
  } catch (err) {
    console.error('Failed to calculate cost breakdown:', err)
    return {
      total: 0,
      byCron: {},
      byPhase: {},
      byModel: {},
    }
  }
}

export async function GET() {
  try {
    const breakdown = await calculateCostBreakdown()
    
    return NextResponse.json({
      breakdown,
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate costs' }, { status: 500 })
  }
}
