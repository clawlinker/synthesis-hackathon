import { AGENT } from '@/app/types'

export function AgentHeader({ receiptCount, source }: { receiptCount: number; source: string }) {
  return (
    <header className="pb-6 mb-8" style={{ borderBottom: '1px solid var(--color-border-main)' }}>
      <div className="flex items-center gap-4 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AGENT.avatar}
          alt={AGENT.name}
          className="w-14 h-14 rounded-full"
          style={{ border: '2px solid var(--color-accent-dim)' }}
        />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {AGENT.name}
            <span className="text-sm font-normal px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-accent)', background: 'rgba(22,101,52,0.2)' }}>
              ERC-8004 #{AGENT.id}
            </span>
          </h1>
          <div className="flex items-center gap-3 text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{AGENT.ens}</span>
            <span>·</span>
            <span className="font-mono text-xs">{AGENT.wallet.slice(0, 6)}…{AGENT.wallet.slice(-4)}</span>
            <span>·</span>
            <span>Base</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Receipts: </span>
          <span className="font-semibold">{receiptCount}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Source: </span>
          <span className="font-medium" style={{ color: source === 'live' ? 'var(--color-accent)' : '#eab308' }}>
            {source === 'live' ? '🟢 Live' : '🟡 Sample Data'}
          </span>
        </div>
      </div>
    </header>
  )
}
