'use client'

import { useEffect, useState } from 'react'
import { ReceiptStats } from '@/components/ReceiptStats'

type AgentLogEntry = {
  timestamp: string
  phase: string
  action: string
  description: string
  tools_used: string[]
  model: string
  model_cost_usd: number
  decision: string
  outcome: string
  artifacts: string[]
  commit: string
}

type CostBreakdown = {
  total: number
  byCron: Record<string, number>
  byPhase: Record<string, number>
  byModel: Record<string, number>
}

type GitCommit = {
  sha: string
  message: string
  author: {
    login: string
    avatar_url: string
  }
  date: string
  html_url: string
}

export default function JudgeModePage() {
  const [logEntries, setLogEntries] = useState<AgentLogEntry[]>([])
  const [costs, setCosts] = useState<CostBreakdown | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCron, setSelectedCron] = useState<string>('all')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch agent log
        const logRes = await fetch('/api/judge/log')
        const logData = await logRes.json()
        setLogEntries(logData.entries || [])

        // Fetch cost breakdown
        const costRes = await fetch('/api/judge/costs')
        const costData = await costRes.json()
        setCosts(costData.breakdown || null)

        // Fetch git commits
        const commitsRes = await fetch('https://api.github.com/repos/your-org/agent-receipts/commits?per_page=50')
        if (commitsRes.ok) {
          const commitsData = await commitsRes.json()
          setCommits(commitsData.slice(0, 20))
        }
      } catch (err) {
        setError('Failed to load judge mode data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter entries based on selected cron and phase
  const filteredEntries = logEntries.filter((entry) => {
    if (selectedCron !== 'all' && !entry.action.includes(selectedCron)) {
      return false
    }
    if (selectedPhase !== 'all' && entry.phase !== selectedPhase) {
      return false
    }
    return true
  })

  if (loading && !logEntries.length) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-[var(--color-usdc)] border-t-transparent animate-spin" />
          <p className="text-xl" style={{ color: 'var(--color-text-primary)' }}>
            Loading judge mode dashboard...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <section className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-usdc)/30', color: 'var(--color-usdc)' }}>
          <svg className="w-5 h-5 text-[var(--color-usdc)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Judge Mode — Self-Referential Dashboard
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
          <span style={{ color: 'var(--color-text-primary)' }}>How Agent Receipts</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-usdc)] to-[var(--color-usdc)]/70">
            Built Itself
          </span>
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-slate-400 leading-relaxed">
          Real-time insight into the autonomous development process: cost transparency, build timeline, and agent execution logs.
        </p>
      </section>

      {/* Stats Overview */}
      {costs && (
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <div className="text-sm text-slate-400 mb-1">Total LLM Cost</div>
              <div className="text-3xl font-bold text-[var(--color-usdc)]">
                ${costs.total.toFixed(2)}
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <div className="text-sm text-slate-400 mb-1">Total Actions</div>
              <div className="text-3xl font-bold text-white">
                {logEntries.length}
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <div className="text-sm text-slate-400 mb-1">Phases Active</div>
              <div className="text-3xl font-bold text-white">
                {Object.keys(costs.byPhase || {}).length}
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <div className="text-sm text-slate-400 mb-1">Models Used</div>
              <div className="text-3xl font-bold text-white">
                {Object.keys(costs.byModel || {}).length}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter Controls */}
      <section className="mb-8 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Filter by:</span>
          <select
            value={selectedCron}
            onChange={(e) => setSelectedCron(e.target.value)}
            className="px-3 py-1.5 rounded text-sm transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-main)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="all">All Crons</option>
            <option value="autonomous">synthesis-autonomous</option>
            <option value="self-review">synthesis-self-review</option>
            <option value="daily-summary">synthesis-daily-summary</option>
          </select>

          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="px-3 py-1.5 rounded text-sm transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-main)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="all">All Phases</option>
            <option value="discover">discover</option>
            <option value="plan">plan</option>
            <option value="execute">execute</option>
          </select>
        </div>
      </section>

      {/* Build Timeline */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <svg className="w-6 h-6 text-[var(--color-usdc)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Build Timeline
        </h2>
        
        <div className="space-y-4">
          {commits.length > 0 ? (
            commits.map((commit, index) => (
              <div
                key={commit.sha}
                className="flex gap-4 p-4 rounded-xl border border-white/5 hover:border-[var(--color-usdc)]/30 transition-colors duration-200 group"
                style={{ background: 'var(--color-bg-card)' }}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--color-usdc)', color: 'black' }}>
                    {commit.sha.substring(0, 7)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {commit.message.split('\n')[0]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {commit.author.login}
                    </span>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View commit
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              No commits available
            </div>
          )}
        </div>
      </section>

      {/* Agent Execution Log */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <svg className="w-6 h-6 text-[var(--color-usdc)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Agent Execution Log
        </h2>
        
        {filteredEntries.length > 0 ? (
          <div className="space-y-4">
            {filteredEntries.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${index}`}
                className="p-5 rounded-xl border border-white/5 hover:border-[var(--color-usdc)]/30 transition-colors duration-200"
                style={{ background: 'var(--color-bg-card)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded text-xs font-medium"
                      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-usdc)/30', color: 'var(--color-usdc)' }}>
                      {entry.phase}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                  {entry.description}
                </p>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  {entry.tools_used.map((tool) => (
                    <span key={tool} className="px-2 py-0.5 rounded-full bg-gray-800 text-slate-400">
                      {tool}
                    </span>
                  ))}
                  
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-slate-400">
                    {entry.model.split('/')[1] || entry.model}
                  </span>
                  
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-usdc)]/10 text-[var(--color-usdc)]">
                    ${entry.model_cost_usd.toFixed(4)}
                  </span>
                  
                  {entry.commit && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-800 text-slate-400">
                      {entry.commit}
                    </span>
                  )}
                </div>
                
                {entry.artifacts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-slate-500 mr-2">Artifacts:</span>
                    {entry.artifacts.slice(0, 3).map((artifact, idx) => (
                      <span key={idx} className="text-xs text-blue-400 hover:text-blue-300 mr-2 cursor-pointer">
                        {artifact}
                        {idx < entry.artifacts.length - 1 && '•'}
                      </span>
                    ))}
                    {entry.artifacts.length > 3 && (
                      <span className="text-xs text-slate-500">+{entry.artifacts.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No entries match your filters
          </div>
        )}
      </section>

      {/* Cost Transparency Breakdown */}
      {costs && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <svg className="w-6 h-6 text-[var(--color-usdc)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cost Transparency Breakdown
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Phase */}
            <div className="p-5 rounded-xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <h3 className="text-sm font-medium mb-3 text-slate-300">By Phase</h3>
              <div className="space-y-2">
                {Object.entries(costs.byPhase || {}).map(([phase, cost]) => (
                  <div key={phase} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 uppercase tracking-wider">{phase}</span>
                    <span className="font-mono text-slate-300">${cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* By Model */}
            <div className="p-5 rounded-xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <h3 className="text-sm font-medium mb-3 text-slate-300">By Model</h3>
              <div className="space-y-2">
                {Object.entries(costs.byModel || {}).map(([model, cost]) => (
                  <div key={model} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 truncate max-w-[150px]" title={model}>
                      {model.split('/')[1] || model}
                    </span>
                    <span className="font-mono text-slate-300">${cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* By Cron */}
            <div className="p-5 rounded-xl border border-white/5" style={{ background: 'var(--color-bg-card)' }}>
              <h3 className="text-sm font-medium mb-3 text-slate-300">By Cron</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(costs.byCron || {}).slice(0, 10).map(([cron, cost]) => (
                  <div key={cron} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 truncate max-w-[120px]" title={cron}>
                      {cron.replace('synthesis-', '')}
                    </span>
                    <span className="font-mono text-slate-300">${cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center pt-8 pb-4" style={{ color: 'var(--color-text-muted)' }}>
        <div className="text-sm mb-2">
          This dashboard was built by the agent to demonstrate autonomous execution capabilities.
        </div>
        <div className="text-xs opacity-60">
          Real-time agent_log.json feed + git commit timeline + cost transparency
        </div>
      </footer>
    </main>
  )
}
