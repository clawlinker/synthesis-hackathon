'use client'

import { AGENT } from '@/app/types'

export function AgentHeader({ receiptCount, source }: { receiptCount: number; source: string }) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-4">
        <img
          src={AGENT.avatar}
          alt={AGENT.name}
          className="w-16 h-16 rounded-full object-cover"
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
        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-main)',
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-usdc)' }} />
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
