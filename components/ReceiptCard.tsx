'use client'

import { type Receipt } from '@/app/types'
import { useState } from 'react'
import { InferenceModal } from './InferenceModal'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  
  return (
    <a
      href={`https://www.8004scan.io/agents/ethereum/${agent.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 transition-all duration-200 hover:bg-success/20 active:scale-95 overflow-hidden"
    >
      {agent.avatar && (
        <img src={agent.avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
      )}
      <div className="flex min-w-0 flex-col" style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end' }}>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent</span>
        <span className="text-xs font-semibold truncate max-w-[80px] sm:max-w-none">{agent.name}</span>
      </div>
      <span className="hidden sm:inline shrink-0 font-mono text-[10px] text-muted-foreground/50">ERC-8004 #{agent.id}</span>
    </a>
  )
}

function isInferenceReceipt(receipt: Receipt): boolean {
  return receipt.from === '0x0000000000000000000000000000000000000000' && receipt.tokenSymbol === 'USD'
}

export function ReceiptCard({ receipt, isFirstInference }: { receipt: Receipt; isFirstInference?: boolean }) {
  const isSent = receipt.direction === 'sent'
  const isInference = isInferenceReceipt(receipt)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleReceiptClick = () => {
    if (isInference && receipt.modelInfo) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <Card
        onClick={handleReceiptClick}
        className={`group cursor-pointer p-4 transition-all duration-200 active:scale-[0.99] animate-fade-in ${
          isFirstInference ? 'mt-4' : ''
        } ${
          isInference 
            ? 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20' 
            : 'hover:bg-accent/50'
        }`}
      >
        {/* Inference Section Header */}
        {isFirstInference && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              LLM Inference Receipts (Bankr LLM Costs)
            </span>
          </div>
        )}

        {/* Header: direction + amount */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={isSent ? 'destructive' : 'default'} className="text-xs">
              {isSent ? '↑ Sent' : '💰 Inference'}
            </Badge>
            {receipt.service && (
              <span className="text-xs text-muted-foreground">{receipt.service}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-semibold tabular-nums">
              {isSent ? '-' : '+'}{receipt.amount}
            </span>
            <span className={`text-sm font-medium ${isInference ? '' : 'text-usdc'}`}>
              {isInference ? 'USD' : 'USDC'}
            </span>
          </div>
        </div>

        {/* Agent Badges */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">From</span>
            <AgentBadge agent={receipt.fromAgent} align="left" />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">To</span>
            <AgentBadge agent={receipt.toAgent} align="right" />
          </div>
        </div>

        {/* Addresses (fallback) */}
        <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
          {!receipt.fromAgent && (
            <div className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/70">From</span>
              <span className="font-medium truncate">{receipt.fromLabel || shortenAddress(receipt.from)}</span>
              <code className="hidden sm:inline font-mono text-[10px] opacity-50">{shortenAddress(receipt.from)}</code>
            </div>
          )}
          {!receipt.toAgent && (
            <div className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/70">To</span>
              <span className="font-medium truncate">{receipt.toLabel || shortenAddress(receipt.to)}</span>
              <code className="hidden sm:inline font-mono text-[10px] opacity-50">{shortenAddress(receipt.to)}</code>
            </div>
          )}
        </div>

        {/* Footer: time + tx link */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatTime(receipt.timestamp)}</span>
          {isInference ? (
            receipt.modelInfo ? (
              <span className="font-mono cursor-help opacity-60 hover:opacity-100 transition-opacity">
                💰 Cost Breakdown
              </span>
            ) : (
              <span className="font-mono opacity-60">LLM Inference</span>
            )
          ) : (
            <a
              href={`/receipt/${receipt.hash}`}
              className="font-mono transition-colors hover:text-foreground"
            >
              {receipt.hash.slice(0, 10)}…
            </a>
          )}
        </div>
      </Card>

      <InferenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={
          isInference && receipt.modelInfo
            ? {
                timestamp: receipt.timestamp,
                service: receipt.service || '',
                amount: receipt.amount,
                modelInfo: receipt.modelInfo,
              }
            : null
        }
      />
    </>
  )
}
