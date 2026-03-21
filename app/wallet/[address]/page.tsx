'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { AGENT } from '@/app/types'

// ─── Types ───────────────────────────────────────────────

interface BreakdownEntry {
  category: string
  amount: string
  count: number
  pct: number
}

interface TopRecipient {
  address: string
  label: string
  amount: string
  count: number
}

interface Anomaly {
  hash: string
  amount: string
  reason: string
}

interface WalletAnalysis {
  txCount: number
  timeRange: { first: string; last: string; days: number }
  totalSent: string
  totalReceived: string
  netFlow: string
  breakdown: BreakdownEntry[]
  topRecipients: TopRecipient[]
  anomalies: Anomaly[]
  healthScore: number
  healthLabel: string
}

interface DashboardData {
  wallet: string
  chain: string
  analysis: WalletAnalysis
  llmSummary: string | null
  agent: { id: number; name: string; ens: string; erc8004: string }
  meta: {
    model: string | null
    analyzedAt: string
    txsFetched: number
  }
}

// ─── Helpers ─────────────────────────────────────────────

function healthColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function healthBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 ring-1 ring-green-500/20'
  if (score >= 60) return 'bg-yellow-500/10 ring-1 ring-yellow-500/20'
  if (score >= 40) return 'bg-orange-500/10 ring-1 ring-orange-500/20'
  return 'bg-red-500/10 ring-1 ring-red-500/20'
}

function healthRingColor(score: number): string {
  if (score >= 80) return 'stroke-green-400'
  if (score >= 60) return 'stroke-yellow-400'
  if (score >= 40) return 'stroke-orange-400'
  return 'stroke-red-400'
}

function formatAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Health Ring SVG ─────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="currentColor"
          className="text-zinc-800" strokeWidth="8"
        />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" strokeWidth="8"
          className={healthRingColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${healthColor(score)}`}>{score}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">health</span>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────

export default function WalletDashboard() {
  const params = useParams()
  const address = params.address as string

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      setError('Invalid wallet address')
      setLoading(false)
      return
    }

    // Fetch analysis from our internal (non-x402) endpoint
    fetch(`/api/wallet-dashboard?wallet=${address}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [address])

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-usdc border-t-transparent" />
          <p className="mt-3 text-sm text-zinc-500">Analyzing {formatAddr(address)}…</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">{error || 'Unknown error'}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Try the <a href="/analyze" className="text-usdc hover:underline">Analyzer</a> to run a fresh analysis.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const { analysis } = data
  const netFlowPositive = parseFloat(analysis.netFlow) >= 0

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-100">Wallet Dashboard</h1>
            <span className="rounded bg-usdc/10 px-1.5 py-0.5 text-[10px] font-medium text-usdc uppercase">
              Base
            </span>
          </div>
          <a
            href={`https://basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-mono text-sm text-zinc-400 hover:text-usdc transition-colors"
          >
            {formatAddr(address)} ↗
          </a>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-600">
            Analyzed {formatDate(data.meta.analyzedAt)}
          </div>
          <div className="text-[10px] text-zinc-600">
            {data.meta.txsFetched} transactions
          </div>
        </div>
      </div>

      {/* Health Score + Flow Stats */}
      <div className="grid grid-cols-[auto_1fr] gap-6 mb-6">
        <HealthRing score={analysis.healthScore} />
        <div className="flex flex-col justify-center gap-2">
          <p className="text-sm text-zinc-300">{analysis.healthLabel}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-zinc-900/70 p-2.5 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Sent</div>
              <div className="text-base font-bold text-red-400">${analysis.totalSent}</div>
            </div>
            <div className="rounded-lg bg-zinc-900/70 p-2.5 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Received</div>
              <div className="text-base font-bold text-green-400">${analysis.totalReceived}</div>
            </div>
            <div className="rounded-lg bg-zinc-900/70 p-2.5 text-center">
              <div className="text-[10px] text-zinc-500 uppercase">Net</div>
              <div className={`text-base font-bold ${netFlowPositive ? 'text-green-400' : 'text-red-400'}`}>
                {netFlowPositive ? '+' : ''}${analysis.netFlow}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-600">
            {analysis.timeRange.days} days · {formatDate(analysis.timeRange.first)} → {formatDate(analysis.timeRange.last)}
          </div>
        </div>
      </div>

      {/* AI Summary (if cached from a paid request) */}
      {data.llmSummary && (
        <Card className="mb-4 border-usdc/15 bg-usdc/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-usdc">AI Analysis</span>
              {data.meta.model && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  {data.meta.model}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{data.llmSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Spending Breakdown */}
      {analysis.breakdown.length > 0 && (
        <Card className="mb-4 border-zinc-800/40 bg-zinc-900/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Spending Breakdown</h3>
            <div className="space-y-2.5">
              {analysis.breakdown.slice(0, 10).map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 truncate max-w-[60%]">{b.category}</span>
                    <span className="text-zinc-500">${b.amount} · {b.count} tx{b.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-usdc/50 transition-all duration-700"
                      style={{ width: `${Math.min(b.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Recipients */}
      {analysis.topRecipients.length > 0 && (
        <Card className="mb-4 border-zinc-800/40 bg-zinc-900/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Top Recipients</h3>
            <div className="space-y-2">
              {analysis.topRecipients.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 w-4">{i + 1}.</span>
                    <div>
                      <span className="text-zinc-300">{r.label}</span>
                      <a
                        href={`https://basescan.org/address/${r.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 text-zinc-600 hover:text-usdc font-mono"
                      >
                        {formatAddr(r.address)}
                      </a>
                    </div>
                  </div>
                  <span className="text-zinc-400 font-medium">${r.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {analysis.anomalies.length > 0 && (
        <Card className="mb-4 border-orange-500/15 bg-orange-500/5">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-orange-400 mb-3">
              ⚠️ Anomalies ({analysis.anomalies.length})
            </h3>
            <div className="space-y-2">
              {analysis.anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <a
                    href={`https://basescan.org/tx/${a.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-usdc font-mono shrink-0"
                  >
                    {a.hash.slice(0, 10)}…
                  </a>
                  <span className="text-zinc-500">${a.amount} — {a.reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-zinc-800/50 pt-4">
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          <span>Analyzed by</span>
          <a
            href={`https://www.8004scan.io/agents/ethereum/${AGENT.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-usdc"
          >
            {AGENT.name} (ERC-8004 #{AGENT.id})
          </a>
        </div>
        <a
          href="/analyze"
          className="text-[10px] text-zinc-500 hover:text-usdc transition-colors"
        >
          Analyze another wallet →
        </a>
      </div>
    </main>
  )
}
