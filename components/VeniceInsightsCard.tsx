'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface VeniceInsights {
  summary: string
  anomalies: string[]
  recommendations: string[]
  operationalStatus: 'healthy' | 'watch' | 'critical'
  statusReason: string
  generatedAt: string
  model: string
  privacyNote: string
  source: string
}

const statusConfig = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle, label: 'Healthy' },
  watch: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, label: 'Watch' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, label: 'Critical' },
}

export function VeniceInsightsCard() {
  const [data, setData] = useState<VeniceInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/venice/insights')
      .then((r) => r.json())
      .then((d) => { if (d.summary) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className="border-zinc-700 bg-zinc-800/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-500 animate-pulse" />
            <Skeleton className="h-5 w-44" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const status = statusConfig[data.operationalStatus] || statusConfig.healthy
  const StatusIcon = status.icon

  return (
    <Card className="border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-400" />
            Spending Analysis
          </CardTitle>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-400">
            <Shield className="h-3 w-3" />
            Private inference
          </span>
        </div>
      </CardHeader>
      <CardContent className={data.operationalStatus === 'healthy' ? 'space-y-2' : 'space-y-4'}>
        {/* Status + Summary inline for healthy, stacked for issues */}
        <div className={data.operationalStatus === 'healthy' ? 'flex items-center gap-3' : 'space-y-3'}>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${status.bg} ${status.color} ${status.border} border`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </div>
          <p className={`text-sm text-zinc-${data.operationalStatus === 'healthy' ? '400' : '300'} leading-relaxed`}>{data.summary}</p>
        </div>

        {/* Anomalies */}
        {data.anomalies.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Anomalies Detected</span>
            {data.anomalies.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-300/80">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Recommendations</span>
            {data.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-700/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-violet-400/70">
            <Shield className="h-3 w-3" />
            Zero data retention · Venice AI
          </div>
          <span className="text-[10px] text-zinc-600">
            {new Date(data.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
