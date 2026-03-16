import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

interface LogEntry {
  timestamp: string
  phase: string
  action: string
  description: string
  tools_used: string[]
  model: string
  model_cost_usd: number
  outcome: string
  commit?: string
  cron?: string
  compute_budget?: {
    session_cost_usd?: number
    daily_budget_usd?: number
    remaining_usd?: number
  }
}

interface CostBreakdown {
  cron: string
  model: string
  phase: string
  totalCost: number
  count: number
  entries: {
    timestamp: string
    action: string
    cost: number
    description: string
  }[]
}

interface CostSummary {
  totalCost: number
  totalEntries: number
  byCron: CostBreakdown[]
  byModel: CostBreakdown[]
  byPhase: CostBreakdown[]
  topActions: {
    action: string
    cost: number
    count: number
  }[]
}

function aggregateCosts(logs: LogEntry[]): CostSummary {
  const byCron: Record<string, CostBreakdown> = {}
  const byModel: Record<string, CostBreakdown> = {}
  const byPhase: Record<string, CostBreakdown> = {}
  const actionCosts: Record<string, { cost: number; count: number }> = {}

  let totalCost = 0
  let totalEntries = 0

  for (const log of logs) {
    // Get cost from different possible fields
    let cost = 0
    if (log.model_cost_usd !== undefined) {
      cost = log.model_cost_usd
    } else if (log.compute_budget?.session_cost_usd !== undefined) {
      cost = log.compute_budget.session_cost_usd
    } else if (log.compute_budget?.daily_budget_usd !== undefined) {
      cost = log.compute_budget.daily_budget_usd
    }

    // Only count if cost > 0 and we have model info
    if (cost > 0 && log.model) {
      totalCost += cost
      totalEntries += 1

      // By cron
      const cronName = log.cron || 'manual'
      if (!byCron[cronName]) {
        byCron[cronName] = { cron: cronName, model: log.model, phase: log.phase, totalCost: 0, count: 0, entries: [] }
      }
      byCron[cronName].totalCost += cost
      byCron[cronName].count += 1
      byCron[cronName].entries.push({
        timestamp: log.timestamp,
        action: log.action,
        cost,
        description: log.description
      })

      // By model
      if (!byModel[log.model]) {
        byModel[log.model] = { cron: log.model, model: log.model, phase: log.phase, totalCost: 0, count: 0, entries: [] }
      }
      byModel[log.model].totalCost += cost
      byModel[log.model].count += 1
      byModel[log.model].entries.push({
        timestamp: log.timestamp,
        action: log.action,
        cost,
        description: log.description
      })

      // By phase
      if (!byPhase[log.phase]) {
        byPhase[log.phase] = { cron: log.phase, model: log.model, phase: log.phase, totalCost: 0, count: 0, entries: [] }
      }
      byPhase[log.phase].totalCost += cost
      byPhase[log.phase].count += 1
      byPhase[log.phase].entries.push({
        timestamp: log.timestamp,
        action: log.action,
        cost,
        description: log.description
      })

      // By action
      if (!actionCosts[log.action]) {
        actionCosts[log.action] = { cost: 0, count: 0 }
      }
      actionCosts[log.action].cost += cost
      actionCosts[log.action].count += 1
    }
  }

  // Convert to sorted arrays
  const byCronArray = Object.values(byCron).sort((a, b) => b.totalCost - a.totalCost)
  const byModelArray = Object.values(byModel).sort((a, b) => b.totalCost - a.totalCost)
  const byPhaseArray = Object.values(byPhase).sort((a, b) => b.totalCost - a.totalCost)

  const topActions = Object.entries(actionCosts)
    .map(([action, { cost, count }]) => ({ action, cost, count }))
    .sort((a, b) => b.cost - a.cost)

  return {
    totalCost,
    totalEntries,
    byCron: byCronArray,
    byModel: byModelArray,
    byPhase: byPhaseArray,
    topActions
  }
}

export async function GET() {
  try {
    const logs: LogEntry[] = agentLogRaw as any
    const summary = aggregateCosts(logs)
    return NextResponse.json(summary)
  } catch (err) {
    console.error('Failed to fetch costs:', err)
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 })
  }
}
