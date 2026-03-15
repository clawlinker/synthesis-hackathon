'use client'

import { AGENT } from '@/app/types'
import { useEffect, useState } from 'react'

export function AgentHeader({ receiptCount, source }: { receiptCount: number; source: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoading = source === 'loading'

  if (isLoading && !mounted) {
    return (
      <header className="mb-8 animate-pulse-subtle">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full skeleton" style={{ border: '3px solid var(--color-usdc)' }} />
          <div>
            <div className="w-32 h-6 skeleton mb-2" />
            <div className="w-48 h-4 skeleton" />
          </div>
        </div>
        <div className="mt-4 w-64 h-10 skeleton rounded-lg" />
      </header>
    )
  }

  return (
    <header className={`transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-4">
        <img
          src={AGENT.avatar}
          alt={AGENT.name}
          className="w-16 h-16 rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ border: '3px solid var(--color-usdc)' }}
        />
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {AGENT.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ERC-8004 #{AGENT.id} • <span className="font-mono">{AGENT.ens}</span>
          </p>
        </div>
      </div>

      <div
        className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
          source === 'live' ? 'border-green-500/20' : ''
        }`}
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-main)',
        }}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            source === 'live'
              ? 'bg-green-500 animate-pulse'
              : 'bg-gray-500 animate-pulse-subtle'
          }`}
        />
        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {receiptCount} receipts
        </span>
        <span className="opacity-50">|</span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          {source === 'live' ? 'Live' : 'Sample'} data
        </span>
      </div>
    </header>
  )
}
