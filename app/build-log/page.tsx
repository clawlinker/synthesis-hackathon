'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

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

const phaseVariant: Record<string, string> = {
  discover: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  plan: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  execute: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  verify: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  cron: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

export default function BuildLogPage() {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Build Log</h1>
        <p className="text-muted-foreground">
          Live git commit history with 🤖 [auto] commits, cron pipeline visualization, and agent_log.json timeline.
        </p>
        <Link href="/" className={buttonVariants({ variant: "link", className: "h-auto p-0 mt-2" })}>
          ← Back to feed
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
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
                    { name: 'Autonomous', icon: '🤖', desc: 'Build & commit', schedule: '30m' },
                    { name: 'Build Guard', icon: '🛡️', desc: 'Fix/revert', schedule: '1h' },
                    { name: 'Code Review', icon: '🔍', desc: 'Find bugs', schedule: '2h' },
                    { name: 'Self Review', icon: '🧠', desc: 'Reprioritize', schedule: '3h' },
                    { name: 'Daily Sum', icon: '📝', desc: 'Progress report', schedule: '22:00' },
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
              {commits.slice(0, 15).map((commit) => (
                <Card key={commit.sha} className="border-l-4 border-l-muted-foreground/20 hover:border-l-muted-foreground/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono text-xs text-muted-foreground">{commit.sha.slice(0, 7)}</code>
                      <span className="text-sm">{commit.message}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(commit.author.date).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        hour12: false, timeZone: 'UTC'
                      })} UTC
                      <span className="mx-2">•</span>
                      {commit.author.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {commits.length > 15 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Showing last 15 commits. {commits.length - 15} older commits hidden.
              </p>
            )}
          </section>

          {/* Agent Log Timeline */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-xs">📝</span>
              Agent Log Timeline ({logs.length} entries)
            </h2>
            <div className="space-y-2">
              {logs.slice(0, 20).map((entry, idx) => {
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
                            href={`https://github.com/base-designer/synthesis-hackathon/commit/${entry.commit}`}
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
            {logs.length > 20 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Showing last 20 entries. {logs.length - 20} older entries hidden.
              </p>
            )}
          </section>
        </div>
      )}

      <Separator className="mt-12" />
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Molttail — Onchain proof of autonomous agent work
        <br />
        Built by <a href="https://pawr.link/clawlinker" className="transition-colors hover:text-foreground">Clawlinker</a> for the Synthesis Hackathon
      </footer>
    </main>
  )
}
