'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function BuildLogPage() {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch git log via API
        const commitRes = await fetch('/api/build-log/commits')
        const commitData = await commitRes.json()
        setCommits(commitData.commits)

        // Fetch agent log
        const logRes = await fetch('/api/build-log/logs')
        const logData = await logRes.json()
        setLogs(logData.logs)
      } catch (err) {
        console.error('Failed to load build log data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const phases = ['discover', 'plan', 'execute', 'verify', 'cron']
  const phaseColors: Record<string, string> = {
    discover: 'bg-blue-500/20 text-blue-300',
    plan: 'bg-purple-500/20 text-purple-300',
    execute: 'bg-emerald-500/20 text-emerald-300',
    verify: 'bg-amber-500/20 text-amber-300',
    cron: 'bg-cyan-500/20 text-cyan-300',
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Build Log</h1>
        <p className="text-gray-400">
          Live git commit history with 🤖 [auto] commits, cron pipeline visualization, and agent_log.json timeline.
        </p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
          ← Back to feed
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading build history...</div>
      ) : (
        <div className="space-y-8">
          {/* Cron Pipeline Visualization */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs">
                ⚙
              </span>
              Cron Pipeline
            </h2>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="grid grid-cols-5 gap-4 text-center">
                {[
                  { name: 'Autonomous', icon: '🤖', desc: 'Build & commit', schedule: '30m' },
                  { name: 'Build Guard', icon: '🛡️', desc: 'Fix/revert', schedule: '1h' },
                  { name: 'Code Review', icon: '🔍', desc: 'Find bugs', schedule: '2h' },
                  { name: 'Self Review', icon: '🧠', desc: 'Reprioritize', schedule: '3h' },
                  { name: 'Daily Sum', icon: '📝', desc: 'Progress report', schedule: '22:00' },
                ].map((cron) => (
                  <div key={cron.name} className="flex flex-col items-center gap-2 p-3 rounded bg-gray-800/50">
                    <div className="text-2xl">{cron.icon}</div>
                    <div className="text-sm font-medium">{cron.name}</div>
                    <div className="text-xs text-gray-500">{cron.desc}</div>
                    <div className="text-xs text-blue-400/80">{cron.schedule}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Git Commits Timeline */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-xs">
                💾
              </span>
              Git Commits ({commits.length})
            </h2>
            <div className="space-y-3">
              {commits.slice(0, 15).map((commit) => (
                <div key={commit.sha} className="bg-gray-900 rounded-lg p-4 border-l-4 border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs text-gray-500 font-mono">{commit.sha.slice(0, 7)}</code>
                        <span className="text-gray-300 text-sm">{commit.message}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(commit.author.date).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          hour12: false, timeZone: 'UTC' 
                        })} UTC
                        <span className="mx-2">•</span>
                        {commit.author.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {commits.length > 15 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Showing last 15 commits. {commits.length - 15} older commits hidden.
              </p>
            )}
          </section>

          {/* Agent Log Timeline */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-xs">
                📝
              </span>
              Agent Log Timeline ({logs.length} entries)
            </h2>
            <div className="space-y-3">
              {logs.slice(0, 20).map((entry, idx) => {
                const phaseColor = phaseColors[entry.phase] || 'bg-gray-500/20 text-gray-300'
                return (
                  <div key={idx} className="bg-gray-900 rounded-lg p-4 border-l-4 border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${phaseColor}`}>
                            {entry.phase}
                          </span>
                          <span className="text-sm font-medium">{entry.action}</span>
                          {entry.commit && (
                            <a 
                              href={`https://github.com/base-designer/synthesis-hackathon/commit/${entry.commit}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              {entry.commit.slice(0, 7)}
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{entry.description}</p>
                        {entry.tools_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.tools_used.map((tool, i) => (
                              <span key={i} className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: false, timeZone: 'UTC'
                          })} UTC
                          <span className="mx-2">•</span>
                          Outcome: {entry.outcome}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {logs.length > 20 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Showing last 20 log entries. {logs.length - 20} older entries hidden.
              </p>
            )}
          </section>
        </div>
      )}

      <footer className="text-center text-xs mt-12 pt-4" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-main)' }}>
        Agent Receipts — Onchain proof of autonomous agent work
        <br />
        Built by <a href="https://pawr.link/clawlinker" className="hover:text-white transition-colors">Clawlinker</a> for the Synthesis Hackathon
      </footer>
    </main>
  )
}
