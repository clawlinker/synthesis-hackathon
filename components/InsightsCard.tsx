'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

interface InsightsResponse {
  insights: {
    summary: string
    patterns: string[]
    topCounterparties: { name: string; count: number; total: string }[]
    spendingTrend: 'increasing' | 'decreasing' | 'stable'
    generatedBy: string
    generatedAt: string
  }
}

export function InsightsCard() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/insights')
        if (!res.ok) throw new Error('Failed to fetch insights')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch insights:', err)
        setError('Unable to load insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  if (loading) {
    return (
      <Card className="border-zinc-700 bg-zinc-800/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-purple-500/20 animate-pulse" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error || 'No insights available'}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-zinc-100">
            Transaction Insights
          </CardTitle>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-purple-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Bankr LLM
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="prose prose-invert prose-sm">
          <p className="text-zinc-300 leading-relaxed">
            {data.insights.summary}
          </p>
        </div>

        {/* Patterns */}
        {data.insights.patterns.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Key Patterns</span>
            <div className="space-y-1.5">
              {data.insights.patterns.slice(0, 3).map((pattern, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
                  <span>{pattern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Counterparties */}
        {data.insights.topCounterparties.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Top Counterparties</span>
            <div className="grid grid-cols-1 gap-1.5">
              {data.insights.topCounterparties.slice(0, 5).map((counterparty, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
                    <span className="text-zinc-300 truncate max-w-[120px]">{counterparty.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400">{counterparty.count} txns</span>
                    <span className="text-zinc-500 ml-2 text-xs">• {counterparty.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-700/50 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Generated: {new Date(data.insights.generatedAt).toLocaleDateString()}</span>
          {data.insights.spendingTrend && (
            <span className={`capitalize px-1.5 py-0.5 rounded-full text-[9px] ${
              data.insights.spendingTrend === 'increasing' 
                ? 'bg-green-500/10 text-green-400'
                : data.insights.spendingTrend === 'decreasing'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-zinc-500/10 text-zinc-400'
            }`}>
              Trend: {data.insights.spendingTrend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
