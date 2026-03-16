'use client'

import { useEffect, useState } from 'react'
import { AnimatedCounter } from './AnimatedCounter'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AGENT } from '@/app/types'

interface HeroStats {
  totalReceipts: number
  totalUSDC: number
  onChainCount: number
  inferenceCount: number
}

export function HeroSection({ stats, source }: { stats: HeroStats; source: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isLive = source.startsWith('live')

  return (
    <section className={`relative mb-8 overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 md:p-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {/* Subtle gradient glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-usdc/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />

      {/* Top bar — logo + nav */}
      <div className="relative flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Molt<span className="text-usdc">tail</span>
          </h1>
          <Badge
            variant="outline"
            className={`gap-1.5 text-[10px] uppercase tracking-wider ${
              isLive ? 'border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            {isLive ? 'Live' : source.startsWith('cached') ? 'Cached' : 'Loading'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://github.com/clawlinker/synthesis-hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <svg className="mr-1.5 h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Source
          </a>
          <a href="/judge" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Judge&nbsp;Mode
          </a>
        </div>
      </div>

      {/* Headline */}
      <div className="relative mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight text-zinc-100">
          Every dollar an AI agent spends.
          <br />
          <span className="text-usdc">Verified on-chain.</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-md leading-relaxed">
          Real-time audit trail for autonomous agent transactions.
          On-chain receipts with BaseScan verification. No fake data.
        </p>
      </div>

      {/* Stats grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox
          label="Total Tracked"
          mounted={mounted}
        >
          <AnimatedCounter end={stats.totalUSDC} prefix="$" decimals={2} className="text-xl md:text-2xl font-bold text-usdc tabular-nums" />
        </StatBox>
        <StatBox label="Receipts" mounted={mounted}>
          <AnimatedCounter end={stats.totalReceipts} className="text-xl md:text-2xl font-bold text-zinc-100 tabular-nums" />
        </StatBox>
        <StatBox label="On-Chain Txns" mounted={mounted}>
          <AnimatedCounter end={stats.onChainCount} className="text-xl md:text-2xl font-bold text-zinc-100 tabular-nums" />
        </StatBox>
        <StatBox label="AI Inference" mounted={mounted}>
          <AnimatedCounter end={stats.inferenceCount} className="text-xl md:text-2xl font-bold text-zinc-100 tabular-nums" />
        </StatBox>
      </div>

      {/* Agent identity strip */}
      <div className="relative flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3">
        <img
          src={AGENT.avatar}
          alt={AGENT.name}
          className="h-10 w-10 rounded-full ring-2 ring-usdc/40 object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">{AGENT.name}</span>
            <span className="text-[10px] text-zinc-500">ERC-8004 #{AGENT.id}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{AGENT.ens}</span>
            <span>·</span>
            <span>Base Chain</span>
            <span>·</span>
            <a
              href={`https://basescan.org/address/${AGENT.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View on BaseScan ↗
            </a>
          </div>
        </div>
      </div>

      {/* Scroll CTA */}
      <div className="mt-5 flex items-center justify-center">
        <a
          href="#feed"
          className="group flex items-center gap-2 text-xs text-zinc-500 hover:text-usdc transition-colors"
        >
          <span>Explore the receipt feed</span>
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  )
}

function StatBox({ label, children, mounted }: { label: string; children: React.ReactNode; mounted: boolean }) {
  return (
    <div className={`rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-3 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      {children}
    </div>
  )
}
