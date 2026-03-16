'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppFooter } from '@/components/AppFooter'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
// Table kept for sm+ screens; mobile uses stacked cards

interface CostBreakdown {
  cron: string
  model: string
  phase: string
  totalCost: number
  count: number
  entries: { timestamp: string; action: string; cost: number; description: string }[]
}

interface CostSummary {
  totalCost: number
  totalEntries: number
  byCron: CostBreakdown[]
  byModel: CostBreakdown[]
  byPhase: CostBreakdown[]
  topActions: { action: string; cost: number; count: number }[]
}

import { phaseColors } from '@/lib/phase-colors'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export default function CostsPage() {
  const [data, setData] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/costs')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">LLM Cost Transparency</h1>
          <Skeleton className="h-5 w-96 mb-2" />
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total cost bar skeleton */}
        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-8 w-16 ml-auto" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>

        {/* By Cron skeleton */}
        <section className="mb-8 space-y-2">
          <Skeleton className="h-7 w-48 mb-4" />
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* By Model table skeleton */}
        <section className="mb-8">
          <Skeleton className="h-7 w-36 mb-4" />
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {['Model', 'Entries', 'Total', 'Avg per Entry'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">LLM Cost Transparency</h1>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-8 text-center text-destructive">Failed to load cost data</CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">LLM Cost Transparency</h1>
        <p className="text-muted-foreground">
          Real-time breakdown of Bankr LLM credit spending building Molttail. Every cent logged, every action tracked.
        </p>
        <Link href="/" className={buttonVariants({ variant: "link", className: "h-auto p-0 mt-2" })}>
          ← Back to feed
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Cost', value: formatCurrency(data.totalCost), sub: `${data.totalEntries} log entries`, accent: true },
          { label: 'Built by', value: 'Clawlinker', sub: 'ERC-8004 #22945' },
          { label: 'Models Used', value: `${new Set(data.byModel.map((m) => m.model)).size} unique`, sub: 'Bankr LLM Gateway' },
          { label: 'Phases', value: `${data.byPhase.length}`, sub: 'discover, plan, execute, verify, cron' },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 sm:p-6">
              <div className="text-sm text-muted-foreground mb-1">{card.label}</div>
              <div className={`text-xl sm:text-2xl font-bold ${card.accent ? 'text-success' : ''}`}>{card.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Cost Visual */}
      <Card className="mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-success tabular-nums">{formatCurrency(data.totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total Bankr LLM credit spent</div>
            </div>
            <div className="sm:text-right">
              <div className="text-2xl font-semibold tabular-nums">{data.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Log entries tracked</div>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-success to-success/60" style={{ width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* By Cron */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-xs">⚙</span>
          Cost by Cron Pipeline
        </h2>
        <div className="space-y-2">
          {data.byCron.map((cron, idx) => (
            <Card key={idx} className="hover:bg-accent/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{cron.cron}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({cron.model})</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success tabular-nums">{formatCurrency(cron.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">{cron.count} entries</div>
                  </div>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500" style={{ width: `${(cron.totalCost / data.totalCost) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {cron.entries.slice(0, 3).map((e, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {e.action}: {formatCurrency(e.cost)}
                    </Badge>
                  ))}
                  {cron.entries.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{cron.entries.length - 3} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* By Model — stacked cards on mobile, table on sm+ */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-600 text-xs">🤖</span>
          Cost by Model
        </h2>

        {/* Mobile: stacked cards */}
        <div className="space-y-2 sm:hidden">
          {data.byModel.map((model, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-sm leading-tight break-all pr-2">{model.model}</span>
                  <span className="font-semibold text-success tabular-nums shrink-0">{formatCurrency(model.totalCost)}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{model.count} entries</span>
                  <span>avg {formatCurrency(model.totalCost / model.count)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop: table */}
        <Card className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Avg per Entry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byModel.map((model, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{model.model}</TableCell>
                  <TableCell className="text-muted-foreground">{model.count}</TableCell>
                  <TableCell className="font-semibold text-success tabular-nums">{formatCurrency(model.totalCost)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatCurrency(model.totalCost / model.count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* By Phase */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-teal-600 text-xs">📊</span>
          Cost by Phase
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {data.byPhase.map((phase, idx) => {
            const color = phaseColors[phase.phase] || 'bg-muted text-muted-foreground'
            return (
              <Card key={idx}>
                <CardContent className="p-4">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium mb-2 ${color}`}>
                    {phase.phase}
                  </span>
                  <div className="text-2xl font-bold mb-1 tabular-nums">{formatCurrency(phase.totalCost)}</div>
                  <div className="text-sm text-muted-foreground mb-3">{phase.count} entries</div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${color.split(' ')[0]}`} style={{ width: `${(phase.totalCost / data.totalCost) * 100}%` }} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Top Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-pink-600 text-xs">⚡</span>
          Most Expensive Actions
        </h2>
        <div className="space-y-2">
          {data.topActions.slice(0, 5).map((action, idx) => (
            <Card key={idx} className="hover:bg-accent/30 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{action.action}</div>
                  <div className="text-xs text-muted-foreground">{action.count} executions</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-rose-400 tabular-nums">{formatCurrency(action.cost)}</div>
                  <div className="text-xs text-muted-foreground">
                    {((action.cost / data.totalCost) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <AppFooter />
    </main>
  )
}
