'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function CostsPage() {
  const [data, setData] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/costs')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to load costs', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">LLM Costs</h1>
        <p className="text-gray-400">Loading Bankr LLM credit spending data...</p>
        <div className="mt-8 text-center py-12 text-gray-500">Loading cost transparency data...</div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">LLM Costs</h1>
        <p className="text-gray-400">Bankr LLM credit spending breakdown</p>
        <div className="mt-8 text-center py-12 text-red-400">Failed to load cost data</div>
      </main>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const phaseColors: Record<string, string> = {
    discover: 'bg-blue-500/20 text-blue-300',
    plan: 'bg-purple-500/20 text-purple-300',
    execute: 'bg-emerald-500/20 text-emerald-300',
    verify: 'bg-amber-500/20 text-amber-300',
    cron: 'bg-cyan-500/20 text-cyan-300',
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LLM Cost Transparency</h1>
        <p className="text-gray-400">
          Real-time breakdown of Bankr LLM credit spending building Molttail.
          Every cent logged, every action tracked.
        </p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
          ← Back to feed
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Total Cost</div>
          <div className="text-3xl font-bold text-emerald-400">{formatCurrency(data.totalCost)}</div>
          <div className="text-xs text-gray-500 mt-1">{data.totalEntries} log entries</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Built by</div>
          <div className="text-xl font-semibold text-gray-200">Clawlinker</div>
          <div className="text-xs text-gray-500 mt-1">ERC-8004 #22945</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Models Used</div>
          <div className="text-xl font-semibold text-gray-200">
            {new Set(data.byModel.map(m => m.model)).size} unique
          </div>
          <div className="text-xs text-gray-500 mt-1">Bankr LLM Gateway</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1"> phases</div>
          <div className="text-xl font-semibold text-gray-200">{data.byPhase.length}</div>
          <div className="text-xs text-gray-500 mt-1">discover, plan, execute, verify, cron</div>
        </div>
      </div>

      {/* Total Cost Timeline */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-xs">
            💰
          </span>
          Total Cost Timeline
        </h2>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-emerald-400">{formatCurrency(data.totalCost)}</div>
              <div className="text-sm text-gray-500">Total Bankr LLM credit spent</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-200">{data.totalEntries}</div>
              <div className="text-sm text-gray-500">Log entries tracked</div>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              style={{ width: '100%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>$0.00</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </section>

      {/* By Cron */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs">
            ⚙
          </span>
          Cost by Cron Pipeline
        </h2>
        <div className="space-y-3">
          {data.byCron.map((cron, idx) => (
            <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-200">{cron.cron}</span>
                  <span className="text-xs text-gray-500 ml-2">({cron.model})</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-400">{formatCurrency(cron.totalCost)}</div>
                  <div className="text-xs text-gray-500">{cron.count} entries</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
                  style={{ width: `${(cron.totalCost / data.totalCost) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                {cron.entries.slice(0, 3).map((e, i) => (
                  <span key={i} className="bg-gray-800 px-2 py-0.5 rounded">
                    {e.action}: {formatCurrency(e.cost)}
                  </span>
                ))}
                {cron.entries.length > 3 && (
                  <span className="text-gray-500">+{cron.entries.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* By Model */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-xs">
            🤖
          </span>
          Cost by Model
        </h2>
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="p-4 font-medium text-gray-300">Model</th>
                <th className="p-4 font-medium text-gray-300">Entries</th>
                <th className="p-4 font-medium text-gray-300">Total</th>
                <th className="p-4 font-medium text-gray-300">Avg per Entry</th>
              </tr>
            </thead>
            <tbody>
              {data.byModel.map((model, idx) => (
                <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="p-4 font-medium text-gray-200">{model.model}</td>
                  <td className="p-4 text-gray-400">{model.count}</td>
                  <td className="p-4 font-semibold text-emerald-400">{formatCurrency(model.totalCost)}</td>
                  <td className="p-4 text-gray-400">
                    {formatCurrency(model.totalCost / model.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* By Phase */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center text-xs">
            📊
          </span>
          Cost by Phase
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.byPhase.map((phase, idx) => {
            const colorClass = phaseColors[phase.phase] || 'bg-gray-500/20 text-gray-300'
            return (
              <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${colorClass}`}>
                  {phase.phase}
                </div>
                <div className="text-2xl font-bold text-gray-200 mb-1">{formatCurrency(phase.totalCost)}</div>
                <div className="text-sm text-gray-500 mb-3">{phase.count} entries</div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colorClass.split(' ')[0]}`}
                    style={{ width: `${(phase.totalCost / data.totalCost) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Top Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-xs">
            ⚡
          </span>
          Most Expensive Actions
        </h2>
        <div className="space-y-3">
          {data.topActions.slice(0, 5).map((action, idx) => (
            <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-200">{action.action}</div>
                  <div className="text-xs text-gray-500">{action.count} executions</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-rose-400">{formatCurrency(action.cost)}</div>
                  <div className="text-xs text-gray-500">
                    {(action.cost / data.totalCost * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs mt-12 pt-4 border-t border-gray-800">
        Molttail — Onchain proof of autonomous agent work
        <br />
        Built by <a href="https://pawr.link/clawlinker" className="hover:text-white transition-colors">Clawlinker</a> for the Synthesis Hackathon
      </footer>
    </main>
  )
}
