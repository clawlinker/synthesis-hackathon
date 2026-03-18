'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants, Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppFooter } from '@/components/AppFooter'

interface GitCommit {
  sha: string
  message: string
  author: { name: string; date: string }
}

interface LogEntry {
  timestamp: string
  phase: string
  action: string
  description: string
  tools_used: string[]
  outcome: string
  commit?: string
}

import { phaseColorsWithBorder as phaseVariant } from '@/lib/phase-colors'

const COMMITS_INITIAL = 20
const LOGS_INITIAL = 30

function getCommitType(message: string): 'feature' | 'auto' | 'other' {
  if (/^\s*(feat|fix)(\(.+\))?:/i.test(message)) return 'feature'
  if (/\[auto\]|🔍|🤖/i.test(message)) return 'auto'
  return 'other'
}

function getCommitPrefix(message: string): string | null {
  const match = message.match(/^\s*(feat|fix|chore|refactor|docs|style|test|build|ci|perf)(\(.+\))?:/i)
  return match ? match[1].toLowerCase() : null
}

function buildDayHistogram(commits: GitCommit[]) {
  // Collect all unique days
  const byDay: Record<string, number> = {}
  for (const c of commits) {
    const day = new Date(c.author.date).toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  }
  // Sort days ascending
  const days = Object.keys(byDay).sort()
  if (days.length === 0) return []
  // Fill gaps between first and last day
  const result: { date: string; label: string; count: number }[] = []
  const start = new Date(days[0])
  const end = new Date(days[days.length - 1])
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    result.push({
      date: key,
      label: String(d.getUTCDate()),
      count: byDay[key] || 0,
    })
  }
  return result
}

export default function BuildLogPage() {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllCommits, setShowAllCommits] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [commitRes, logRes] = await Promise.all([
          fetch('/api/build-log/commits'),
          fetch('/api/build-log/logs'),
        ])
        const [commitData, logData] = await Promise.all([commitRes.json(), logRes.json()])
        setCommits(commitData.commits)
        setLogs(logData.logs)
      } catch (err) {
        console.error('Failed to load build log data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derive stats
  const buildSpanDays = commits.length >= 2
    ? Math.max(1, Math.round(
        (new Date(commits[0]?.author?.date ?? 0).getTime() -
         new Date(commits[commits.length - 1]?.author?.date ?? 0).getTime()) /
        (1000 * 60 * 60 * 24)
      ))
    : 0

  // Most recent first
  const sortedCommits = [...commits].sort(
    (a, b) => new Date(b.author.date).getTime() - new Date(a.author.date).getTime()
  )

  const histogram = buildDayHistogram(commits)
  const maxCount = Math.max(1, ...histogram.map((d) => d.count))

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Build Log</h1>
        <p className="text-muted-foreground">
          Autonomous build activity — commits, cron pipelines, agent decisions.
        </p>
        <Link href="/" className={buttonVariants({ variant: "link", className: "h-auto p-0 mt-2" })}>
          ← Feed
        </Link>
      </div>

      {loading ? (
        <div className="space-y-8">
          {/* Stats bar skeleton */}
          <section>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Histogram skeleton */}
          <section>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="flex items-end gap-1 h-16">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${30 + i * 8}%` }} />
                ))}
              </div>
            </div>
          </section>

          {/* Cron Pipeline skeleton */}
          <section>
            <Skeleton className="h-7 w-40 mb-4" />
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-muted/50">
                      <CardContent className="flex flex-col items-center gap-2 p-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-5 w-10 rounded-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Git Commits skeleton */}
          <section>
            <Skeleton className="h-7 w-44 mb-4" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-l-4 border-l-muted-foreground/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-14 rounded" />
                      <Skeleton className="h-4 flex-1 max-w-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-1 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Agent Log Timeline skeleton */}
          <section>
            <Skeleton className="h-7 w-56 mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border-l-4 border-l-muted-foreground/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Skeleton className="h-5 w-16 rounded" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-md" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-18 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero Stats Bar */}
          <section>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
                <div className="flex flex-col items-center py-2 sm:py-0">
                  <span className="text-2xl font-bold tabular-nums">{commits.length}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Commits</span>
                </div>
                <div className="flex flex-col items-center py-2 sm:py-0">
                  <span className="text-2xl font-bold tabular-nums">{buildSpanDays}d</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Build Span</span>
                </div>
                <div className="flex flex-col items-center py-2 sm:py-0">
                  <span className="text-2xl font-bold tabular-nums">{logs.length}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Log Entries</span>
                </div>
                <div className="flex flex-col items-center py-2 sm:py-0">
                  <span className="text-2xl font-bold tabular-nums">5</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Cron Pipelines</span>
                </div>
              </div>
            </div>
          </section>

          {/* Commit Activity Histogram */}
          {histogram.length > 0 && (
            <section>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6">
                <p className="text-xs text-muted-foreground mb-4">Commits / day</p>
                <div className="flex items-end gap-1.5 h-20">
                  {histogram.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max(4, Math.round((d.count / maxCount) * 64))}px`,
                          backgroundColor: d.count > 0 ? 'rgb(161 161 170)' : 'rgb(63 63 70 / 0.5)',
                        }}
                        title={`${d.date}: ${d.count} commit${d.count !== 1 ? 's' : ''}`}
                      />
                      <span className="text-[10px] text-zinc-500">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Cron Pipeline */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-xs">⚙</span>
              Cron Pipeline
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    { name: 'Autonomous', icon: '🤖', desc: 'Build & commit', schedule: 'hourly' },
                    { name: 'Build Guard', icon: '🛡️', desc: 'Fix/revert', schedule: 'every 2h' },
                    { name: 'Judge Review', icon: '🔍', desc: 'Find bugs', schedule: 'hourly' },
                    { name: 'Type Check', icon: '🧪', desc: 'TS validation', schedule: 'every 3h' },
                    { name: 'Git Hygiene', icon: '🧹', desc: 'Clean history', schedule: 'hourly' },
                  ].map((cron) => (
                    <Card key={cron.name} className="bg-muted/50">
                      <CardContent className="flex flex-col items-center gap-2 p-3 text-center">
                        <div className="text-2xl">{cron.icon}</div>
                        <div className="text-sm font-medium">{cron.name}</div>
                        <div className="text-xs text-muted-foreground">{cron.desc}</div>
                        <Badge variant="outline" className="text-[10px]">{cron.schedule}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Git Commits */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-red-600 text-xs">💾</span>
              Git Commits ({commits.length})
            </h2>
            <div className="space-y-2">
              {(showAllCommits ? sortedCommits : sortedCommits.slice(0, COMMITS_INITIAL)).map((commit) => {
                const type = getCommitType(commit.message)
                const prefix = getCommitPrefix(commit.message)
                const borderColor =
                  type === 'feature' ? 'border-l-green-500'
                  : type === 'auto' ? 'border-l-amber-500'
                  : 'border-l-zinc-600'
                return (
                  <Card key={commit.sha} className={`border-l-4 ${borderColor} hover:border-l-opacity-80 transition-colors`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 mb-1 min-w-0">
                        <code className="font-mono text-xs text-muted-foreground shrink-0">{commit.sha.slice(0, 7)}</code>
                        {prefix && (
                          <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 shrink-0 ${
                            prefix === 'feat' ? 'bg-green-950 text-green-400'
                            : prefix === 'fix' ? 'bg-red-950 text-red-400'
                            : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {prefix}
                          </span>
                        )}
                        <span className="text-sm break-words min-w-0">{commit.message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(commit.author.date).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          hour12: false
                        })}
                        <span className="mx-2">•</span>
                        {commit.author.name}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {commits.length > COMMITS_INITIAL && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllCommits((v) => !v)}
                  className="text-xs"
                >
                  {showAllCommits
                    ? `▲ Show less`
                    : `▼ Show all ${commits.length} commits (${commits.length - COMMITS_INITIAL} more)`}
                </Button>
              </div>
            )}
          </section>

          {/* Agent Log Timeline */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-xs">📝</span>
              Agent Log Timeline ({logs.length} entries)
            </h2>
            <div className="space-y-2">
              {(showAllLogs ? logs : logs.slice(0, LOGS_INITIAL)).map((entry, idx) => {
                const color = phaseVariant[entry.phase] || 'bg-muted text-muted-foreground'
                return (
                  <Card key={idx} className="border-l-4 border-l-muted-foreground/20 hover:border-l-muted-foreground/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>
                          {entry.phase}
                        </span>
                        <span className="text-sm font-medium">{entry.action}</span>
                        {entry.commit && (
                          <a
                            href={`https://github.com/clawlinker/synthesis-hackathon/commit/${entry.commit}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-usdc hover:underline"
                          >
                            {entry.commit.slice(0, 7)}
                          </a>
                        )}
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">{entry.description}</p>
                      {entry.tools_used.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {entry.tools_used.map((tool, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{tool}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                          hour12: false, timeZone: 'UTC'
                        })} UTC
                        <span className="mx-2">•</span>
                        Outcome: {entry.outcome}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {logs.length > LOGS_INITIAL && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllLogs((v) => !v)}
                  className="text-xs"
                >
                  {showAllLogs
                    ? `▲ Show less`
                    : `▼ Show all ${logs.length} entries (${logs.length - LOGS_INITIAL} more)`}
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      <AppFooter />
    </main>
  )
}
