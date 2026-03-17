import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

export async function GET() {
  try {
    const entries = agentLogRaw as any[]

    const breakdown = {
      total: 0,
      byCron: {} as Record<string, number>,
      byPhase: {} as Record<string, number>,
      byModel: {} as Record<string, number>,
    }

    for (const entry of entries) {
      const model = entry.model || ''
      const cost = entry.model_cost_usd || 0

      // Only count Bankr model costs (not OpenClaw's internal Opus/Sonnet usage)
      if (!model.startsWith('bankr/')) continue

      breakdown.total += cost

      const phase = entry.phase || 'unknown'
      breakdown.byPhase[phase] = (breakdown.byPhase[phase] || 0) + cost

      breakdown.byModel[model] = (breakdown.byModel[model] || 0) + cost

      // Use cron field if present (for cron-specific log entries), otherwise use action
      const cron = entry.cron || entry.action || 'main-session'
      breakdown.byCron[cron] = (breakdown.byCron[cron] || 0) + cost
    }

    return NextResponse.json({
      breakdown,
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate costs' }, { status: 500 })
  }
}
