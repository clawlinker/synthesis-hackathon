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

function AgentBadge({ agent, align = 'left' }: { agent: Receipt['fromAgent'] | Receipt['toAgent'], align?: 'left' | 'right' }) {
  if (!agent) return null
  
  const isFrom = align === 'left'
  
  return (
    <a
      href={`https://www.8004scan.io/agents/ethereum/${agent.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
      style={{ background: 'rgba(38, 161, 123, 0.1)' }}
    >
      {agent.avatar && (
        <img src={agent.avatar} alt="" className="w-5 h-5 rounded-full" />
      )}
      <div className="flex flex-col items-start" style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end' }}>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Agent</span>
        <span className="text-xs font-semibold">{agent.name}</span>
      </div>
      <span className="text-[10px] font-mono opacity-50">ERC-8004 #{agent.id}</span>
    </a>
  )
}

// Check if receipt is an inference receipt (from null address, USD token)
function isInferenceReceipt(receipt: Receipt): boolean {
  return receipt.from === '0x0000000000000000000000000000000000000000' && receipt.tokenSymbol === 'USD'
}

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const isSent = receipt.direction === 'sent'
  const isInference = isInferenceReceipt(receipt)

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
            {isSent ? '↑ Sent' : isInference ? '💰 Inference' : '↓ Received'}
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
          <span className="text-sm font-medium" style={{ color: isInference ? 'var(--color-text-primary)' : 'var(--color-usdc)' }}>
            {isInference ? 'USD' : 'USDC'}
          </span>
        </div>
      </div>

      {/* Agent Badges */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1" style={{ alignItems: 'flex-start' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>From</span>
          <AgentBadge agent={receipt.fromAgent} align="left" />
        </div>
        <div className="flex flex-col gap-1" style={{ alignItems: 'flex-end' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>To</span>
          <AgentBadge agent={receipt.toAgent} align="right" />
        </div>
      </div>

      {/* Addresses (fallback) */}
      <div className="flex flex-col gap-1 text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {!receipt.fromAgent && (
          <div className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>From</span>
            <span className="font-medium truncate">{receipt.fromLabel || shortenAddress(receipt.from)}</span>
            <code className="hidden sm:inline font-mono text-[10px] opacity-50">{shortenAddress(receipt.from)}</code>
          </div>
        )}
        {!receipt.toAgent && (
          <div className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>To</span>
            <span className="font-medium truncate">{receipt.toLabel || shortenAddress(receipt.to)}</span>
            <code className="hidden sm:inline font-mono text-[10px] opacity-50">{shortenAddress(receipt.to)}</code>
          </div>
        )}
      </div>

      {/* Footer: time + tx link */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>{formatTime(receipt.timestamp)}</span>
        {isInference ? (
          <span className="font-mono opacity-60">LLM Inference</span>
        ) : (
          <a
            href={`https://basescan.org/tx/${receipt.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono transition-colors hover:text-white"
          >
            {receipt.hash.slice(0, 10)}…
          </a>
        )}
      </div>
    </div>
  )
}
