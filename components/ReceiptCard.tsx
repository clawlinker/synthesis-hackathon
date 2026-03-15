'use client'

import { type Receipt } from '@/app/types'
import { useState } from 'react'
import { InferenceModal } from './InferenceModal'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function shortenAddress(addr: string): string {
  if (!addr || addr === ZERO_ADDRESS) return ''
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
      className="inline-flex max-w-[140px] items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 transition-all duration-200 hover:bg-success/20 active:scale-95 overflow-hidden"
    >
      {agent.avatar && (
        <img src={agent.avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
      )}
      <div className="flex min-w-0 flex-col" style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end' }}>
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">Agent</span>
        <span className="text-xs font-semibold truncate flex-1 text-zinc-200">{agent.name}</span>
      </div>
      <span className="hidden sm:inline shrink-0 font-mono text-[10px] text-zinc-500">#{agent.id}</span>
    </a>
  )
}

function isInferenceReceipt(receipt: Receipt): boolean {
  return receipt.hash?.startsWith('inference-') || receipt.tokenSymbol === 'USD'
}

/** Extract model name from service string like "Bankr LLM — task_name (model_name)" */
function extractModelName(service: string | undefined): string | null {
  if (!service) return null
  const match = service.match(/\(([^)]+)\)\s*$/)
  return match ? match[1] : null
}

function isZeroAddress(addr: string): boolean {
  return !addr || addr === ZERO_ADDRESS || addr.replace(/0x0+/, '0x0') === '0x0'
}

export function ReceiptCard({ receipt, isFirstInference }: { receipt: Receipt; isFirstInference?: boolean }) {
  const isSent = receipt.direction === 'sent'
  const isInference = isInferenceReceipt(receipt)
  const modelName = isInference ? extractModelName(receipt.service) : null
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
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              LLM Inference Receipts (Bankr LLM Costs)
            </span>
          </div>
        )}

        {/* Header: direction + amount */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isInference ? (
              <>
                {/* Purple inference badge with robot icon */}
                <Badge
                  variant="outline"
                  className="text-xs border-purple-500/40 bg-purple-500/10 text-purple-400 gap-1"
                >
                  🤖 Inference
                </Badge>
                {/* Model name tag */}
                {modelName && (
                  <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-300 border border-purple-500/20">
                    {modelName}
                  </span>
                )}
              </>
            ) : (
              <Badge variant={isSent ? 'destructive' : 'default'} className="text-xs">
                {isSent ? '↑ Sent' : '↓ Received'}
              </Badge>
            )}
            {receipt.service && !isInference && (
              <span className="text-xs text-zinc-400">{receipt.service}</span>
            )}
            {receipt.service && isInference && (
              <span className="text-xs text-zinc-400 truncate max-w-[120px] sm:max-w-xs" title={receipt.service}>
                {receipt.service.split('(')[0].trim()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isInference ? (
              <span className="text-lg font-semibold tabular-nums text-purple-300">
                ${parseFloat(receipt.amount).toFixed(
                  parseFloat(receipt.amount) < 0.01 ? 4 :
                  parseFloat(receipt.amount) < 0.1 ? 3 : 2
                )}
              </span>
            ) : (
              <>
                <span className="text-lg font-semibold tabular-nums text-zinc-100">
                  {isSent ? '-' : '+'}{receipt.amount}
                </span>
                <span className="text-sm font-medium text-usdc">USDC</span>
              </>
            )}
          </div>
        </div>

        {/* Agent Badges */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">From</span>
            <AgentBadge agent={receipt.fromAgent} align="left" />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">To</span>
            <AgentBadge agent={receipt.toAgent} align="right" />
          </div>
        </div>

        {/* Addresses (fallback) */}
        <div className="flex flex-col gap-1 text-sm mb-3">
          {!receipt.fromAgent && (
            (() => {
              // Hide zero-address "from" on inference receipts; replace with label
              if (isInference && isZeroAddress(receipt.from)) {
                return (
                  <div className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider text-zinc-400">From</span>
                    <span className="font-medium text-zinc-300">Bankr LLM Gateway</span>
                  </div>
                )
              }
              const label = receipt.fromLabel || shortenAddress(receipt.from)
              if (!label) return null
              return (
                <div className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider text-zinc-400">From</span>
                  <span className="font-medium text-zinc-300 truncate">{label}</span>
                  {receipt.fromLabel && receipt.from && !isZeroAddress(receipt.from) && (
                    <code className="hidden sm:inline font-mono text-[10px] text-zinc-500">{shortenAddress(receipt.from)}</code>
                  )}
                </div>
              )
            })()
          )}
          {!receipt.toAgent && (
            (() => {
              const label = receipt.toLabel || shortenAddress(receipt.to)
              if (!label) return null
              return (
                <div className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-[10px] uppercase tracking-wider text-zinc-400">To</span>
                  <span className="font-medium text-zinc-300 truncate">{label}</span>
                  {receipt.toLabel && receipt.to && !isZeroAddress(receipt.to) && (
                    <code className="hidden sm:inline font-mono text-[10px] text-zinc-500">{shortenAddress(receipt.to)}</code>
                  )}
                </div>
              )
            })()
          )}
        </div>

        {/* Footer: time + tx link */}
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
          <span>{formatTime(receipt.timestamp)}</span>
          {isInference ? (
            receipt.modelInfo ? (
              <span className="font-mono cursor-help opacity-80 hover:opacity-100 transition-opacity text-purple-400">
                ⚡ Cost Breakdown
              </span>
            ) : (
              <span className="font-mono text-purple-400 opacity-80">⚡ LLM Inference</span>
            )
          ) : (
            <a
              href={`/receipt/${receipt.hash}`}
              className="font-mono text-zinc-500 transition-colors hover:text-zinc-200"
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
