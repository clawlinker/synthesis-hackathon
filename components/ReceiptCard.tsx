'use client'

import { type Receipt } from '@/app/types'
import { useState } from 'react'
import { InferenceModal } from './InferenceModal'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownLeft, Layers, ChevronDown, ChevronRight } from 'lucide-react'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function shortenAddress(addr: string): string {
  if (!addr || addr === ZERO_ADDRESS) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTimestamp(ts: number): [string, string] {
  const now = Date.now()
  const date = new Date(ts * 1000)
  const diffMs = now - ts * 1000
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  const full = date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  let short: string
  if (diffSec < 60) {
    short = 'just now'
  } else if (diffMin < 60) {
    short = `${diffMin}m ago`
  } else if (diffHour < 24) {
    short = `${diffHour}h ago`
  } else {
    const thisYear = new Date().getFullYear()
    const sameYear = date.getFullYear() === thisYear
    if (sameYear) {
      short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' · ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else {
      short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return [short, full]
}

function isInferenceReceipt(receipt: Receipt): boolean {
  return receipt.hash?.startsWith('inference-') || receipt.tokenSymbol === 'USD'
}

function extractModelName(service: string | undefined): string | null {
  if (!service) return null
  const match = service.match(/\(([^)]+)\)\s*$/)
  return match ? match[1] : null
}

function isZeroAddress(addr: string): boolean {
  return !addr || addr === ZERO_ADDRESS || addr.replace(/0x0+/, '0x0') === '0x0'
}

/** Extract task description from service: "Bankr LLM — task_name (model)" → "task_name" */
function extractTaskName(service: string | undefined): string {
  if (!service) return 'Inference'
  const withoutParen = service.split('(')[0].trim()
  const afterDash = withoutParen.split('—')[1]?.trim()
  return afterDash || withoutParen || 'Inference'
}

/** Returns just the display name for a counterparty — name OR address, never both */
function getCounterpartyName(receipt: Receipt): string {
  const isSent = receipt.direction === 'sent'
  if (isSent) {
    return receipt.toAgent?.name || receipt.toLabel || shortenAddress(receipt.to)
  } else {
    if (isZeroAddress(receipt.from)) return 'Bankr LLM'
    return receipt.fromAgent?.name || receipt.fromLabel || shortenAddress(receipt.from)
  }
}

/** Returns address for secondary display — only when a human-readable name is already shown */
function getCounterpartyAddress(receipt: Receipt): string | null {
  const isSent = receipt.direction === 'sent'
  if (isSent) {
    const hasName = !!(receipt.toAgent?.name || receipt.toLabel)
    return hasName ? shortenAddress(receipt.to) : null
  } else {
    if (isZeroAddress(receipt.from)) return null
    const hasName = !!(receipt.fromAgent?.name || receipt.fromLabel)
    return hasName ? shortenAddress(receipt.from) : null
  }
}

/** Stable key for grouping consecutive receipts to the same counterparty */
function groupKey(receipt: Receipt): string {
  const addr = receipt.direction === 'sent' ? receipt.to : receipt.from
  return `${receipt.direction}:${addr.toLowerCase()}`
}

// ---------------------------------------------------------------------------
// Individual USDC Receipt Card
// ---------------------------------------------------------------------------

function USDCCard({ receipt, index }: { receipt: Receipt; index: number }) {
  const isSent = receipt.direction === 'sent'
  const [timeShort, timeFull] = formatTimestamp(receipt.timestamp)
  const counterpartyName = getCounterpartyName(receipt)
  const counterpartyAddr = getCounterpartyAddress(receipt)

  const val = parseFloat(receipt.amount)
  const amountStr = val.toFixed(2)
  const sign = isSent ? '−' : '+'

  const borderColor = isSent ? 'border-red-500/50' : 'border-green-500/50'
  const amountColor = isSent ? 'text-red-400' : 'text-green-400'
  const iconColor = isSent ? 'text-red-400' : 'text-green-400'

  const delay = Math.min(index * 25, 400)

  return (
    <Card
      className={`group cursor-default border-l-2 ${borderColor} px-3 py-2.5
        hover:-translate-y-px hover:shadow-lg hover:shadow-black/20
        active:scale-[0.99] transition-all duration-150`}
      style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: icon + counterparty */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`shrink-0 ${iconColor}`}>
            {isSent
              ? <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              : <ArrowDownLeft className="h-4 w-4" strokeWidth={2.5} />
            }
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-100 truncate leading-tight">
              {counterpartyName}
            </div>
            {counterpartyAddr && (
              <div className="text-[9px] font-mono text-zinc-500 truncate leading-tight">
                {counterpartyAddr}
              </div>
            )}
          </div>
        </div>

        {/* Right: amount */}
        <div className="shrink-0 text-right">
          <div className={`text-sm font-bold tabular-nums leading-tight ${amountColor}`}>
            {sign}{amountStr}
          </div>
          <div className="text-[9px] text-zinc-500 leading-tight">USDC</div>
        </div>
      </div>

      {/* Bottom meta row */}
      <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500 gap-2">
        {receipt.service ? (
          <span className="truncate flex-1 text-zinc-600">{receipt.service}</span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span title={timeFull}>{timeShort}</span>
          {receipt.hash && !receipt.hash.startsWith('inference-') && (
            <a
              href={`/receipt/${receipt.hash}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              {receipt.hash.slice(0, 8)}…
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Inference Receipt Card
// ---------------------------------------------------------------------------

function InferenceCard({ receipt, index }: { receipt: Receipt; index: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [timeShort, timeFull] = formatTimestamp(receipt.timestamp)
  const modelName = extractModelName(receipt.service)
  const taskName = extractTaskName(receipt.service)

  const val = parseFloat(receipt.amount)
  const costStr = `$${val.toFixed(val < 0.01 ? 4 : val < 0.1 ? 3 : 2)}`

  const delay = Math.min(index * 25, 400)

  return (
    <>
      <Card
        onClick={() => receipt.modelInfo && setIsModalOpen(true)}
        className={`group border-l-2 border-purple-500/50 bg-purple-500/[0.04]
          hover:bg-purple-500/[0.08] hover:-translate-y-px hover:shadow-lg hover:shadow-purple-900/20
          active:scale-[0.99] transition-all duration-150 px-3 py-2.5
          ${receipt.modelInfo ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: robot icon + task name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm shrink-0 leading-none">🤖</span>
            <span className="text-xs font-semibold text-zinc-100 truncate leading-tight">
              {taskName}
            </span>
          </div>

          {/* Right: cost */}
          <div className="shrink-0">
            <span className="text-sm font-bold tabular-nums text-purple-300">{costStr}</span>
          </div>
        </div>

        {/* Bottom row: model pill + time */}
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {modelName && (
              <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-1.5 py-px text-[9px] font-mono text-purple-400 shrink-0">
                {modelName}
              </span>
            )}
            {receipt.modelInfo && (
              <span className="text-purple-400/60 group-hover:text-purple-400/90 transition-colors text-[9px] shrink-0">
                ⚡ breakdown
              </span>
            )}
          </div>
          <span title={timeFull} className="shrink-0">{timeShort}</span>
        </div>
      </Card>

      <InferenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={
          receipt.modelInfo
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

// ---------------------------------------------------------------------------
// Grouped Receipt Card (3+ consecutive receipts to same counterparty)
// ---------------------------------------------------------------------------

function GroupedCard({ receipts, index }: { receipts: Receipt[]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const first = receipts[0]
  const isSent = first.direction === 'sent'
  const counterpartyName = getCounterpartyName(first)
  const total = receipts.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const sign = isSent ? '−' : '+'

  const borderColor = isSent ? 'border-red-500/50' : 'border-green-500/50'
  const amountColor = isSent ? 'text-red-400' : 'text-green-400'
  const iconColor = isSent ? 'text-red-400' : 'text-green-400'

  const delay = Math.min(index * 25, 400)

  return (
    <div style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}>
      <Card
        onClick={() => setExpanded((v) => !v)}
        className={`group cursor-pointer border-l-2 ${borderColor} px-3 py-2.5
          hover:-translate-y-px hover:shadow-lg hover:shadow-black/20
          active:scale-[0.99] transition-all duration-150`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: stacked icon + summary */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`shrink-0 ${iconColor}`}>
              <Layers className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-100 truncate leading-tight">
                {receipts.length} transactions · {counterpartyName}
              </div>
              <div className="flex items-center gap-0.5 text-[9px] text-zinc-500 leading-tight">
                {expanded
                  ? <ChevronDown className="h-2.5 w-2.5 inline shrink-0" />
                  : <ChevronRight className="h-2.5 w-2.5 inline shrink-0" />
                }
                <span>{expanded ? 'collapse' : 'expand'}</span>
              </div>
            </div>
          </div>

          {/* Right: total */}
          <div className="shrink-0 text-right">
            <div className={`text-sm font-bold tabular-nums leading-tight ${amountColor}`}>
              {sign}{total.toFixed(2)}
            </div>
            <div className="text-[9px] text-zinc-500 leading-tight">USDC total</div>
          </div>
        </div>
      </Card>

      {/* Expanded receipts */}
      {expanded && (
        <div className="mt-1 ml-3 pl-2 border-l border-zinc-700/40 space-y-1">
          {receipts.map((r) => (
            <USDCCard key={r.hash} receipt={r} index={0} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouping logic
// ---------------------------------------------------------------------------

type DisplayItem =
  | { kind: 'single'; receipt: Receipt }
  | { kind: 'grouped'; receipts: Receipt[] }

export function groupReceiptsForDisplay(receipts: Receipt[]): DisplayItem[] {
  const result: DisplayItem[] = []
  let i = 0

  while (i < receipts.length) {
    const r = receipts[i]

    // Never group inference receipts
    if (isInferenceReceipt(r)) {
      result.push({ kind: 'single', receipt: r })
      i++
      continue
    }

    // Count consecutive receipts with the same direction+counterparty
    const key = groupKey(r)
    let j = i + 1
    while (j < receipts.length) {
      const next = receipts[j]
      if (isInferenceReceipt(next) || groupKey(next) !== key) break
      j++
    }

    const count = j - i
    if (count >= 3) {
      result.push({ kind: 'grouped', receipts: receipts.slice(i, j) })
      i = j
    } else {
      result.push({ kind: 'single', receipt: r })
      i++
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/** Single receipt card — used when rendering one receipt directly */
export function ReceiptCard({ receipt, index = 0 }: { receipt: Receipt; index?: number; isFirstInference?: boolean }) {
  if (isInferenceReceipt(receipt)) {
    return <InferenceCard receipt={receipt} index={index} />
  }
  return <USDCCard receipt={receipt} index={index} />
}

/** Receipt list with automatic grouping of consecutive duplicates */
export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        if (item.kind === 'grouped') {
          return (
            <GroupedCard
              key={item.receipts[0].hash}
              receipts={item.receipts}
              index={i}
            />
          )
        }
        return (
          <ReceiptCard
            key={item.receipt.hash}
            receipt={item.receipt}
            index={i}
          />
        )
      })}
    </div>
  )
}
