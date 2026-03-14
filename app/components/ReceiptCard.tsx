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
    <div className="group border border-[var(--border)] rounded-xl p-4 hover:bg-[var(--bg-card-hover)] transition-colors bg-[var(--bg-card)]">
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
            <span className="text-xs text-[var(--text-muted)]">
              {receipt.service}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold">
            {isSent ? '-' : '+'}{receipt.amount}
          </span>
          <span className="text-sm font-medium text-[var(--usdc-blue)]">USDC</span>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
        <span className="text-[var(--text-muted)]">From</span>
        <code className="font-mono text-xs">{shortenAddress(receipt.from)}</code>
        <span className="text-[var(--text-muted)]">→</span>
        <code className="font-mono text-xs">{shortenAddress(receipt.to)}</code>
      </div>

      {/* Footer: time + tx link + agent badge */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{formatTime(receipt.timestamp)}</span>
        <div className="flex items-center gap-3">
          {receipt.agentId && (
            <a
              href={`https://www.8004scan.io/agents/ethereum/${receipt.agentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
            >
              <span>🤖</span>
              <span>ERC-8004 #{receipt.agentId}</span>
            </a>
          )}
          <a
            href={`https://basescan.org/tx/${receipt.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors font-mono"
          >
            {receipt.hash.slice(0, 10)}…
          </a>
        </div>
      </div>
    </div>
  )
}
