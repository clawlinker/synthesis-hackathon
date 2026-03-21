'use client'

import { useEffect, useState } from 'react'
import { AnimatedCounter } from './AnimatedCounter'
import { Badge } from '@/components/ui/badge'
import { AGENT } from '@/app/types'
import { PROJECT_HEADLINE, PROJECT_TAGLINE } from '@/lib/constants'

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
        {/* Navigation links moved to NavBar */}
      </div>

      {/* Headline */}
      <div className="relative mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight text-zinc-100">
          {PROJECT_HEADLINE}
          <br />
          <span className="text-usdc">{PROJECT_TAGLINE}</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-md leading-relaxed">
          Every USDC payment tracked in real-time — from x402 micropayments to LLM inference costs. Explore the feed below.
        </p>
      </div>

      {/* Stats grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {source === 'loading' ? (
          <>
            {['Total Tracked', 'Receipts', 'On-Chain Txns', 'AI Inference'].map((label) => (
              <StatBox key={label} label={label} mounted={mounted}>
                <span className="inline-block h-7 w-16 animate-pulse rounded bg-zinc-700/50" />
              </StatBox>
            ))}
          </>
        ) : (
          <>
            <StatBox label="Total Tracked" mounted={mounted}>
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
          </>
        )}
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
            {/* ENS badge */}
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {AGENT.ens}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
            <span>Base · Ethereum</span>
            <span>·</span>
            <a
              href={`https://basescan.org/address/${AGENT.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`View ${AGENT.name} wallet on BaseScan`}
            >
              BaseScan ↗
            </a>
            <span>·</span>
            <a
              href={`https://etherscan.io/address/${AGENT.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`View ${AGENT.name} wallet on Etherscan`}
            >
              Etherscan ↗
            </a>
          </div>
        </div>
      </div>

      {/* Scroll CTA */}
      <div className="mt-5">
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
