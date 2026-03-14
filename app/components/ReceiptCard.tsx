'use client'

import { type Receipt } from '@/app/types'

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const isSent = receipt.direction === 'sent'

  return (
    <div className="group rounded-xl p-4 transition-colors"
      style={{
        border: '1px solid var(--color-border-main)',
        background: 'var(--color-bg-card)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-card)'}
    >
      {/* Header: direction + amount */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            isSent
              ? 'bg-red-500/10 text-red-400'
              : 'bg-green-500/10 text-green-400'
          }`}>
            {isSent ? '↑ Sent' : '↓ Received'}
          </span>
          {receipt.service && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {receipt.service}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold">
            {isSent ? '-' : '+'}{receipt.amount}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-usdc)' }}>USDC</span>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>From</span>
        <code className="font-mono text-xs">{shortenAddress(receipt.from)}</code>
        <span style={{ color: 'var(--color-text-muted)' }}>→</span>
        <code className="font-mono text-xs">{shortenAddress(receipt.to)}</code>
      </div>

      {/* Footer: time + tx link + agent badge */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>{formatTime(receipt.timestamp)}</span>
        <div className="flex items-center gap-3">
          {receipt.agentId && (
            <a
              href={`https://www.8004scan.io/agents/ethereum/${receipt.agentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-green-400"
            >
              <span>🤖</span>
              <span>ERC-8004 #{receipt.agentId}</span>
            </a>
          )}
          <a
            href={`https://basescan.org/tx/${receipt.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono transition-colors hover:text-white"
          >
            {receipt.hash.slice(0, 10)}…
          </a>
        </div>
      </div>
    </div>
  )
}
