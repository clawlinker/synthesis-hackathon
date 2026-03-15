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

function formatTimeShort(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
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

function formatAmount(amount: string, isInference: boolean, isSent: boolean): string {
  const val = parseFloat(amount)
  if (isInference) {
    return `$${val.toFixed(val < 0.01 ? 4 : val < 0.1 ? 3 : 2)}`
  }
  return `${isSent ? '−' : '+'}${val} USDC`
}

export function ReceiptCard({ receipt }: { receipt: Receipt; isFirstInference?: boolean }) {
  const isSent = receipt.direction === 'sent'
  const isInference = isInferenceReceipt(receipt)
  const modelName = isInference ? extractModelName(receipt.service) : null
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Determine from/to display — prefer agent name, then label, then short address
  const fromDisplay = receipt.fromAgent?.name ||
    (isInference && isZeroAddress(receipt.from) ? 'Bankr LLM' : receipt.fromLabel || shortenAddress(receipt.from))
  const toDisplay = receipt.toAgent?.name || receipt.toLabel || shortenAddress(receipt.to)

  // Extract a short service label for inference receipts
  const serviceName = isInference
    ? (receipt.service?.split('(')[0]?.split('—')[1]?.trim() || receipt.service?.split('(')[0]?.trim() || '')
    : (receipt.service || '')

  return (
    <>
      <Card
        onClick={() => isInference && receipt.modelInfo && setIsModalOpen(true)}
        className={`group cursor-pointer px-3 py-2 transition-all duration-150 active:scale-[0.99] animate-fade-in ${
          isInference
            ? 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20'
            : 'hover:bg-accent/50'
        }`}
      >
        {/* Main row: direction + from→to + service + amount */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Direction indicator */}
            {isInference ? (
              <span className="text-xs shrink-0">🤖</span>
            ) : (
              <Badge
                variant={isSent ? 'destructive' : 'default'}
                className="text-[10px] px-1.5 py-0 h-4 shrink-0 leading-4"
              >
                {isSent ? '↑' : '↓'}
              </Badge>
            )}

            {/* From agent/address */}
            <span className={`text-xs font-medium truncate ${receipt.fromAgent ? 'text-success' : 'text-zinc-300'}`}>
              {fromDisplay}
            </span>

            <span className="text-[10px] text-zinc-600 shrink-0">→</span>

            {/* To agent/address */}
            <span className={`text-xs font-medium truncate ${receipt.toAgent ? 'text-success' : 'text-zinc-300'}`}>
              {toDisplay}
            </span>

            {/* Service name — hidden on narrow */}
            {serviceName && (
              <span className="text-[10px] text-zinc-500 shrink-0 hidden sm:inline max-w-[120px] truncate">
                · {serviceName}
              </span>
            )}
          </div>

          {/* Amount */}
          <div className="shrink-0 flex items-baseline gap-1">
            <span className={`text-sm font-semibold tabular-nums ${
              isInference ? 'text-purple-300' : isSent ? 'text-red-400' : 'text-green-400'
            }`}>
              {formatAmount(receipt.amount, isInference, isSent)}
            </span>
            {isInference && modelName && (
              <span className="text-[9px] font-mono text-purple-400 opacity-60">{modelName}</span>
            )}
          </div>
        </div>

        {/* Meta row: time + tx hash / inference link */}
        <div className="flex items-center justify-between mt-0.5 text-[10px] text-zinc-500">
          <span>{formatTimeShort(receipt.timestamp)}</span>
          {isInference ? (
            receipt.modelInfo ? (
              <span className="text-purple-400 opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                ⚡ breakdown
              </span>
            ) : (
              <span className="text-purple-400 opacity-50">⚡ inference</span>
            )
          ) : (
            <a
              href={`/receipt/${receipt.hash}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono hover:text-zinc-300 transition-colors"
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
