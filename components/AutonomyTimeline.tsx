'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Key decisions from agent_log.json - prioritized for Story criterion
interface Decision {
  timestamp: string
  phase: 'plan' | 'discover' | 'execute' | 'verify'
  title: string
  description: string
  cost: string
  tool: string
}

interface ExtendedDecision extends Decision {
  retry: true
  retryCount: number
}

interface SafetyDecision extends Decision {
  safety: true
}

const KEY_DECISIONS: (Decision | ExtendedDecision | SafetyDecision)[] = [
  {
    timestamp: '2026-03-13T22:42:00Z',
    phase: 'plan',
    title: 'Created Phased 10-Day Schedule',
    description: 'Decided on phased approach: research → build → polish. Crons handle grunt work, Opus for decisions.',
    cost: '$0.05',
    tool: 'write'
  },
  {
    timestamp: '2026-03-14T00:30:00Z',
    phase: 'discover',
    title: 'Chose Agent Receipts Concept',
    description: 'Ranked 6 ideation outputs. Agent Receipts scored highest — uses real x402 history, fits 4 bounties.',
    cost: '$0.002',
    tool: 'read'
  },
  {
    timestamp: '2026-03-14T05:01:00Z',
    phase: 'execute',
    title: 'Self-Optimized Cron Prompts',
    description: 'Implemented Karpathy mutation strategies on all 3 synthesis cron prompts. Scored before/after.',
    cost: '$0.008',
    tool: 'write'
  },
  {
    timestamp: '2026-03-14T10:12:00Z',
    phase: 'execute',
    title: 'Built MVP Scaffold',
    description: 'Scaffolded Next.js 16 + Tailwind v4 with live Base block explorer integration. Overcame 3 retry attempts.',
    cost: '$0.12',
    tool: 'write',
    retry: true,
    retryCount: 3
  },
  {
    timestamp: '2026-03-14T10:54:00Z',
    phase: 'verify',
    title: 'Self-Correction: Cron Conflict',
    description: 'Detected cron fighting main session. Disabled competing cron and added guardrails to prevent recurrence.',
    cost: '$0.04',
    tool: 'exec',
    safety: true
  },
  {
    timestamp: '2026-03-14T14:24:00Z',
    phase: 'discover',
    title: 'Identified Green Field Opportunity',
    description: 'Research confirmed no direct competitors in agent receipt visualization space.',
    cost: '$0.005',
    tool: 'web_search'
  }
]

const phaseColors: Record<Decision['phase'], string> = {
  plan: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  discover: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  execute: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  verify: 'bg-amber-500/15 text-amber-400 border-amber-500/20'
}

export function AutonomyTimeline() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-950/60 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-700/30 text-zinc-300">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-zinc-100">Autonomous Decision Log</div>
          <div className="text-xs text-zinc-400">Key decisions made by ERC-8004 #22945 agent</div>
        </div>
      </div>

      <div className="space-y-3">
        {KEY_DECISIONS.map((decision, idx) => (
          <div key={idx} className="relative pl-6 sm:pl-8">
            {/* Timeline line */}
            {idx !== KEY_DECISIONS.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-12px] w-px bg-zinc-800" />
            )}

            {/* Node */}
            <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-zinc-600 ring-4 ring-zinc-950" />

            {/* Card */}
            <Card className="border-zinc-800/50 bg-zinc-950/30 hover:bg-zinc-950/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn('text-[10px] h-5 border', phaseColors[decision.phase])}>
                    {decision.phase}
                  </Badge>
                  {('retry' in decision && decision.retry) && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-400">
                      Retried {decision.retryCount}×
                    </Badge>
                  )}
                  {('safety' in decision && decision.safety) && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-950/30 text-emerald-400">
                      Safety Guardrail
                    </Badge>
                  )}
                  <span className="text-[10px] text-zinc-500 tabular-nums font-mono">
                    {new Date(decision.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">· ${decision.cost}</span>
                  <span className="text-[10px] text-zinc-600">· {decision.tool}</span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-200 mb-1">{decision.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{decision.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-800">
        <a href="/build-log" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View full autonomy log (134 sessions)
        </a>
      </div>
    </div>
  )
}
