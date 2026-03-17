'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppFooter } from '@/components/AppFooter'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// Helper to calculate autonomous hours from log entries
function calculateAutonomousHours(entries: AgentLogEntry[]): number {
  if (entries.length === 0) return 0
  const timestamps = entries.map(e => new Date(e.timestamp).getTime())
  const minTime = Math.min(...timestamps)
  const maxTime = Math.max(...timestamps)
  const diffMs = maxTime - minTime
  return diffMs / (1000 * 60 * 60) // Convert ms to hours
}

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
  author: { login: string; avatar_url: string }
  date: string
  html_url: string
}

export default function JudgeModePage() {
  const [logEntries, setLogEntries] = useState<AgentLogEntry[]>([])
  const [costs, setCosts] = useState<CostBreakdown | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCron, setSelectedCron] = useState<string>('all')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [logRes, costRes, commitsRes] = await Promise.all([
          fetch('/api/judge/log'),
          fetch('/api/judge/costs'),
          fetch('/api/build-log/commits'),
        ])
        const [logData, costData, commitsData] = await Promise.all([logRes.json(), costRes.json(), commitsRes.json()])
        setLogEntries(logData.entries || [])
        setCosts(costData.breakdown || null)
        const rawCommits = commitsData.commits || []
        setCommits(rawCommits.slice(0, 20).map((c: { sha: string; author: string; date: string; message: string; avatar_url?: string }) => ({
          sha: c.sha,
          message: c.message,
          author: { login: c.author, avatar_url: c.avatar_url || '' },
          date: c.date,
          html_url: `https://github.com/clawlinker/synthesis-hackathon/commit/${c.sha}`,
        })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredEntries = logEntries.filter((entry) => {
    if (selectedCron !== 'all' && !entry.action.includes(selectedCron)) return false
    if (selectedPhase !== 'all' && entry.phase !== selectedPhase) return false
    return true
  })

  if (loading && !logEntries.length) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header skeleton */}
        <section className="mb-12 text-center space-y-4">
          <Skeleton className="h-6 w-56 mx-auto rounded-full" />
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-6 mx-auto" />
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </section>

        {/* Stats cards skeleton */}
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-[200px] rounded-md" />
          <Skeleton className="h-10 w-[160px] rounded-md" />
        </div>

        {/* Build Timeline skeleton */}
        <section className="mb-12">
          <Skeleton className="h-8 w-44 mb-6" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Agent Execution Log skeleton */}
        <section className="mb-12">
          <Skeleton className="h-8 w-52 mb-6" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-1.5 flex-wrap">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cost Breakdown skeleton */}
        <section className="mb-12">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <section className="mb-12 text-center space-y-4">
        <Badge variant="outline" className="gap-2 border-usdc/30 text-usdc">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Judge Mode — Self-Referential Dashboard
        </Badge>

        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          How Molttail
          <br />
          <span className="text-usdc">Built Itself</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
          Real-time insight into the autonomous development process: cost transparency, build timeline, and agent execution logs.
        </p>
      </section>

      {/* For Judges — quick orientation card */}
      <div className="mb-10 rounded-xl border border-usdc/20 bg-usdc/5 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-usdc/10 text-usdc">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-zinc-100">For Judges</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-xs text-zinc-400">
              <div><span className="font-semibold text-zinc-200">What:</span> Onchain receipt dashboard for AI agents</div>
              <div><span className="font-semibold text-zinc-200">Who:</span> Clawlinker (ERC-8004 #22945, clawlinker.eth)</div>
              <div><span className="font-semibold text-zinc-200">How:</span> 5 autonomous crons, 4 Bankr LLM models, x402 payments</div>
              <div><span className="font-semibold text-zinc-200">Tracks:</span> ERC-8004 ($8K), Agent Cook ($8K), Bankr LLM ($5K), AgentCash ($1.75K)</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <a href="/api/judge/summary" target="_blank" rel="noopener noreferrer" className="text-usdc hover:underline font-medium">
                machine-readable summary
              </a>
              <span>•</span>
              <a href="https://github.com/clawlinker/synthesis-hackathon" target="_blank" rel="noopener noreferrer" className="text-usdc hover:underline font-medium">
                source on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {costs && (
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total LLM Cost', value: `$${costs.total.toFixed(2)}`, accent: true },
            { label: 'Git Commits', value: `${commits.length}`, accent: false },
            { label: 'Autonomous Hours', value: `${logEntries.length > 0 ? calculateAutonomousHours(logEntries).toFixed(1) : '0'}`, accent: false },
            { label: 'Models Used', value: `${Object.keys(costs.byModel || {}).length}`, accent: false },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                <div className={`text-3xl font-bold tabular-nums ${stat.accent ? 'text-usdc' : ''}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Verify Section */}
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Verify:</span>
        <a href="/.well-known/agent.json" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-usdc/30 bg-usdc/5 px-3 py-1 text-xs font-medium text-usdc hover:bg-usdc/10 transition-colors">
          agent.json
        </a>
        <a href="https://www.8004scan.io/agents/ethereum/22945" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-usdc/30 bg-usdc/5 px-3 py-1 text-xs font-medium text-usdc hover:bg-usdc/10 transition-colors">
          ERC-8004 #22945
        </a>
        <a href="/api/x402/receipts" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-usdc/30 bg-usdc/5 px-3 py-1 text-xs font-medium text-usdc hover:bg-usdc/10 transition-colors">
          x402 Endpoint
        </a>
        <a href="https://github.com/clawlinker/synthesis-hackathon" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-usdc/30 bg-usdc/5 px-3 py-1 text-xs font-medium text-usdc hover:bg-usdc/10 transition-colors">
          GitHub
        </a>
        <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-usdc/30 bg-usdc/5 px-3 py-1 text-xs font-medium text-usdc hover:bg-usdc/10 transition-colors">
          llms.txt
        </a>
      </div>

      {/* Filter Controls */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <Select value={selectedCron} onValueChange={(v) => v && setSelectedCron(v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Crons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crons</SelectItem>
            <SelectItem value="autonomous">synthesis-autonomous</SelectItem>
            <SelectItem value="self-review">synthesis-self-review</SelectItem>
            <SelectItem value="daily-summary">synthesis-daily-summary</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPhase} onValueChange={(v) => v && setSelectedPhase(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="build">build</SelectItem>
            <SelectItem value="cleanup">cleanup</SelectItem>
            <SelectItem value="cron">cron</SelectItem>
            <SelectItem value="deploy">deploy</SelectItem>
            <SelectItem value="discover">discover</SelectItem>
            <SelectItem value="execute">execute</SelectItem>
            <SelectItem value="plan">plan</SelectItem>
            <SelectItem value="polish">polish</SelectItem>
            <SelectItem value="submit">submit</SelectItem>
            <SelectItem value="verify">verify</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Build Timeline */}
      <section className="mb-12">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <svg className="h-6 w-6 text-usdc" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Build Timeline
        </h2>

        <div className="space-y-3">
          {commits.length > 0 ? (
            commits.map((commit) => (
              <Card key={commit.sha} className="group hover:border-usdc/30 transition-colors">
                <CardContent className="flex gap-4 p-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-usdc text-[10px] font-bold text-black">
                    {commit.sha.substring(0, 7)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-medium break-words">{commit.message.split('\n')[0]}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {commit.author.login}
                      </span>
                      <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-usdc hover:underline">
                        View commit →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No commits available</CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Agent Execution Log */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <svg className="h-6 w-6 text-usdc" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Agent Execution Log
          </h2>
          {logEntries.length > 0 && (
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {filteredEntries.length === logEntries.length
                ? `${logEntries.length} entries`
                : `${filteredEntries.length} of ${logEntries.length}`}
            </span>
          )}
        </div>

        {filteredEntries.length > 0 ? (
          <div className="space-y-3">
            {filteredEntries.map((entry, index) => (
              <Card key={`${entry.timestamp}-${index}`} className="hover:border-usdc/30 transition-colors">
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="border-usdc/30 text-usdc">{entry.phase}</Badge>
                      <span className="text-sm font-medium break-words">{entry.action.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{entry.description}</p>

                  {entry.decision && (
                    <p className="mb-3 text-xs text-zinc-600 italic line-clamp-2" title={entry.decision}>
                      <span className="not-italic text-zinc-700 font-medium">Reasoning: </span>{entry.decision}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {(entry.tools_used || []).map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-[10px]">{tool}</Badge>
                    ))}
                    <Badge variant="secondary" className="text-[10px]">
                      {entry.model.split('/')[1] || entry.model}
                    </Badge>
                    <Badge variant="outline" className="border-usdc/30 text-usdc text-[10px]">
                      ${entry.model_cost_usd.toFixed(4)}
                    </Badge>
                    {entry.commit && (
                      <Badge variant="secondary" className="font-mono text-[10px]">{entry.commit}</Badge>
                    )}
                  </div>

                  {(entry.artifacts?.length ?? 0) > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Artifacts:</span>
                        {(entry.artifacts || []).slice(0, 3).map((artifact, idx) => (
                          <span key={idx} className="text-usdc cursor-pointer hover:underline">{artifact}</span>
                        ))}
                        {(entry.artifacts?.length ?? 0) > 3 && (
                          <span className="text-muted-foreground">+{(entry.artifacts?.length ?? 0) - 3} more</span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No entries match your filters</CardContent>
          </Card>
        )}
      </section>

      {/* Cost Breakdown */}
      {costs && (
        <section className="mb-12">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
            <svg className="h-6 w-6 text-usdc" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cost Transparency Breakdown
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: 'By Phase', data: costs.byPhase },
              { title: 'By Model', data: costs.byModel, truncateKey: true },
              { title: 'By Cron', data: costs.byCron, truncateKey: true, stripPrefix: 'synthesis-' },
            ].map((section) => (
              <Card key={section.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(section.data || {}).slice(0, 10).map(([key, cost]) => {
                    let displayKey = key
                    if (section.stripPrefix) displayKey = key.replace(section.stripPrefix, '')
                    if (section.truncateKey) displayKey = (displayKey.split('/')[1] || displayKey)
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground" title={key}>{displayKey}</span>
                        <span className="font-mono tabular-nums">${(cost as number).toFixed(4)}</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <AppFooter />
    </main>
  )
}
