import { AGENT } from '@/app/types'

export function AgentHeader({ receiptCount, source }: { receiptCount: number; source: string }) {
  return (
    <header className="border-b border-[var(--border)] pb-6 mb-8">
      <div className="flex items-center gap-4 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AGENT.avatar}
          alt={AGENT.name}
          className="w-14 h-14 rounded-full border-2 border-[var(--accent-dim)]"
        />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {AGENT.name}
            <span className="text-sm font-normal text-[var(--accent)] bg-[var(--accent-dim)]/20 px-2 py-0.5 rounded-full">
              ERC-8004 #{AGENT.id}
            </span>
          </h1>
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mt-1">
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
          <span className="text-[var(--text-muted)]">Receipts: </span>
          <span className="font-semibold">{receiptCount}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Source: </span>
          <span className={`font-medium ${source === 'live' ? 'text-[var(--accent)]' : 'text-yellow-500'}`}>
            {source === 'live' ? '🟢 Live' : '🟡 Sample Data'}
          </span>
        </div>
      </div>
    </header>
  )
}
