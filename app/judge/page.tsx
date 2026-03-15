'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

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
          fetch('https://api.github.com/repos/your-org/agent-receipts/commits?per_page=50').catch(() => null),
        ])
        const [logData, costData] = await Promise.all([logRes.json(), costRes.json()])
        setLogEntries(logData.entries || [])
        setCosts(costData.breakdown || null)
        if (commitsRes?.ok) {
          const commitsData = await commitsRes.json()
          setCommits(commitsData.slice(0, 20))
        }
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
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-usdc border-t-transparent animate-spin" />
          <p className="text-xl">Loading judge mode dashboard...</p>
        </div>
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

      {/* Stats Overview */}
      {costs && (
        <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total LLM Cost', value: `$${costs.total.toFixed(2)}`, accent: true },
            { label: 'Total Actions', value: `${logEntries.length}` },
            { label: 'Phases Active', value: `${Object.keys(costs.byPhase || {}).length}` },
            { label: 'Models Used', value: `${Object.keys(costs.byModel || {}).length}` },
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

      {/* Filter Controls */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <Select value={selectedCron} onValueChange={(v) => v && setSelectedCron(v)}>
          <SelectTrigger className="w-[200px]">
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
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="discover">discover</SelectItem>
            <SelectItem value="plan">plan</SelectItem>
            <SelectItem value="execute">execute</SelectItem>
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
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{commit.message.split('\n')[0]}</span>
                      <span className="text-xs text-muted-foreground">
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
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <svg className="h-6 w-6 text-usdc" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Agent Execution Log
        </h2>

        {filteredEntries.length > 0 ? (
          <div className="space-y-3">
            {filteredEntries.map((entry, index) => (
              <Card key={`${entry.timestamp}-${index}`} className="hover:border-usdc/30 transition-colors">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-usdc/30 text-usdc">{entry.phase}</Badge>
                      <span className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-muted-foreground leading-relaxed">{entry.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {entry.tools_used.map((tool) => (
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

                  {entry.artifacts.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Artifacts:</span>
                        {entry.artifacts.slice(0, 3).map((artifact, idx) => (
                          <span key={idx} className="text-usdc cursor-pointer hover:underline">{artifact}</span>
                        ))}
                        {entry.artifacts.length > 3 && (
                          <span className="text-muted-foreground">+{entry.artifacts.length - 3} more</span>
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

      {/* Footer */}
      <Separator />
      <footer className="py-6 text-center text-muted-foreground">
        <p className="text-sm mb-1">This dashboard was built by the agent to demonstrate autonomous execution capabilities.</p>
        <p className="text-xs opacity-60">Real-time agent_log.json feed + git commit timeline + cost transparency</p>
      </footer>
    </main>
  )
}
