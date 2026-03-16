'use client'

import { type Receipt } from '@/app/types'
import { useState } from 'react'
import { InferenceModal } from './InferenceModal'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

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
    if (date.getFullYear() === thisYear) {
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

function isZeroAddress(addr: string): boolean {
  return !addr || addr === ZERO_ADDRESS || addr.replace(/0x0+/, '0x0') === '0x0'
}

function extractModelName(service: string | undefined): string | null {
  if (!service) return null
  const match = service.match(/\(([^)]+)\)\s*$/)
  return match ? match[1] : null
}

function extractTaskName(service: string | undefined): string {
  if (!service) return 'Inference'
  const withoutParen = service.split('(')[0].trim()
  const afterDash = withoutParen.split('—')[1]?.trim()
  return afterDash || withoutParen || 'Inference'
}

function humanizeTaskName(raw: string): string {
  const spaced = raw.replace(/_/g, ' ')
  const titled = spaced.replace(/\b\w/g, (c) => c.toUpperCase())
  if (titled.length <= 35) return titled
  return titled.slice(0, 34).trimEnd() + '…'
}

function extractPhase(notes: string | undefined): string | null {
  if (!notes) return null
  const match = notes.match(/^phase:([^|]+)/)
  return match ? match[1].trim() : null
}

function groupKey(receipt: Receipt): string {
  const addr = receipt.direction === 'sent' ? receipt.to : receipt.from
  return `${receipt.direction}:${addr.toLowerCase()}`
}

function formatAmount(amount: string, decimals = 2): string {
  const val = parseFloat(amount)
  return val.toFixed(val < 0.01 ? 4 : val < 0.1 ? 3 : decimals)
}

function getCounterpartyName(receipt: Receipt): string {
  const isSent = receipt.direction === 'sent'
  if (isSent) {
    return receipt.toAgent?.name || receipt.toLabel || shortenAddress(receipt.to)
  } else {
    if (isZeroAddress(receipt.from)) return 'Bankr LLM'
    return receipt.fromAgent?.name || receipt.fromLabel || shortenAddress(receipt.from)
  }
}

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

// ---------------------------------------------------------------------------
// Narrative text generators
// ---------------------------------------------------------------------------

function buildNarrative(receipt: Receipt): string {
  const val = parseFloat(receipt.amount)
  const amt = `$${formatAmount(receipt.amount)}`

  if (isInferenceReceipt(receipt)) {
    const rawTask = extractTaskName(receipt.service)
    const task = humanizeTaskName(rawTask)
    const model = extractModelName(receipt.service)
    if (model) return `Spent ${amt} on ${task} (${model})`
    return `Spent ${amt} on ${task}`
  }

  const counterparty = getCounterpartyName(receipt)
  const service = receipt.service

  if (receipt.direction === 'sent') {
    if (service && service.toLowerCase().includes('fee')) {
      return `Paid ${amt} in fees to ${counterparty}`
    }
    if (service) {
      return `Paid ${amt} to ${counterparty} — ${service}`
    }
    return `Sent ${amt} USDC to ${counterparty}`
  } else {
    if (isZeroAddress(receipt.from)) {
      return `Received ${amt} USDC from Bankr`
    }
    if (service) {
      return `Received ${amt} from ${counterparty} — ${service}`
    }
    return `Received ${amt} USDC from ${counterparty}`
  }
}

function buildGroupNarrative(receipts: Receipt[]): string {
  const first = receipts[0]
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const totalStr = `$${total.toFixed(total < 0.1 ? 3 : 2)}`

  if (isInferenceReceipt(first)) {
    const task = humanizeTaskName(extractTaskName(first.service))
    return `${receipts.length} inference calls · ${task} · ${totalStr} total`
  }

  const counterparty = getCounterpartyName(first)
  if (first.direction === 'sent') {
    return `${receipts.length} payments · ${counterparty} · ${totalStr} total`
  }
  return `${receipts.length} receipts · ${counterparty} · ${totalStr} total`
}

// ---------------------------------------------------------------------------
// CSS for animations (injected once)
// ---------------------------------------------------------------------------

const TIMELINE_STYLES = `
@keyframes tl-fade-in {
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes tl-pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  50%       { box-shadow: 0 0 0 4px transparent; opacity: 0.7; }
}
.tl-node-animate { animation: tl-fade-in 0.3s ease-out both; }
.tl-dot-pulse    { animation: tl-pulse-dot 2s ease-in-out infinite; }
`

let stylesInjected = false
function ensureStyles() {
  if (typeof document === 'undefined') return
  if (stylesInjected) return
  stylesInjected = true
  const el = document.createElement('style')
  el.textContent = TIMELINE_STYLES
  document.head.appendChild(el)
}

// ---------------------------------------------------------------------------
// Dot component
// ---------------------------------------------------------------------------

type DotVariant = 'sent' | 'received' | 'inference' | 'group-sent' | 'group-received' | 'group-inference'

function Dot({
  variant,
  large = false,
  pulse = false,
}: {
  variant: DotVariant
  large?: boolean
  pulse?: boolean
}) {
  const colorMap: Record<DotVariant, string> = {
    'sent':            'bg-red-400 text-red-400',
    'received':        'bg-green-400 text-green-400',
    'inference':       'bg-purple-400 text-purple-400',
    'group-sent':      'bg-red-400 ring-2 ring-red-500/30 text-red-400',
    'group-received':  'bg-green-400 ring-2 ring-green-500/30 text-green-400',
    'group-inference': 'bg-purple-400 ring-2 ring-purple-500/30 text-purple-400',
  }

  const sizeClass = large ? 'w-3 h-3' : 'w-2 h-2'
  const classes = [
    'rounded-full shrink-0',
    sizeClass,
    colorMap[variant],
    pulse ? 'tl-dot-pulse' : '',
  ].filter(Boolean).join(' ')

  return <span className={classes} />
}

// ---------------------------------------------------------------------------
// Line segment color per variant
// ---------------------------------------------------------------------------

function lineColorClass(variant: DotVariant): string {
  if (variant.includes('sent')) return 'border-red-500/20'
  if (variant.includes('received')) return 'border-green-500/20'
  return 'border-purple-500/20'
}

// ---------------------------------------------------------------------------
// Single USDC timeline node
// ---------------------------------------------------------------------------

function USDCNode({
  receipt,
  index,
  isFirst,
  isLast,
}: {
  receipt: Receipt
  index: number
  isFirst: boolean
  isLast: boolean
}) {
  if (typeof window !== 'undefined') ensureStyles()

  const isSent = receipt.direction === 'sent'
  const variant: DotVariant = isSent ? 'sent' : 'received'
  const [timeShort, timeFull] = formatTimestamp(receipt.timestamp)
  const narrative = buildNarrative(receipt)
  const addr = getCounterpartyAddress(receipt)
  const phase = extractPhase(receipt.notes)

  const amountColor = isSent ? 'text-red-400' : 'text-green-400'
  const amtFormatted = (isSent ? '−' : '+') + formatAmount(receipt.amount) + ' USDC'

  const delay = Math.min(index * 20, 300)

  return (
    <div
      className="tl-node-animate flex gap-3 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-4 shrink-0">
        <div className={`w-px flex-1 ${isFirst ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
        <Dot variant={variant} pulse={isFirst && index === 0} />
        <div className={`w-px flex-1 ${isLast ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
      </div>

      {/* Node content */}
      <div className="pb-3 pt-0.5 min-w-0 flex-1">
        {/* Primary action line */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-zinc-100 leading-snug font-medium">
            {narrative}
          </p>
          <span className={`text-xs font-bold tabular-nums shrink-0 ${amountColor}`}>
            {amtFormatted}
          </span>
        </div>

        {/* Meta line */}
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-500">
          <span title={timeFull}>{timeShort}</span>
          {receipt.hash && !receipt.hash.startsWith('inference-') && (
            <>
              <span className="text-zinc-700">·</span>
              <Link
                href={`/receipt/${receipt.hash}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {receipt.hash.slice(0, 8)}…
              </Link>
            </>
          )}
          {receipt.service && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600 truncate max-w-[160px]">{receipt.service}</span>
            </>
          )}
          {phase && phase !== 'unknown' && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500">{phase}</span>
            </>
          )}
          {addr && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="font-mono text-zinc-600">{addr}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single Inference timeline node
// ---------------------------------------------------------------------------

function InferenceNode({
  receipt,
  index,
  isFirst,
  isLast,
  totalInferenceCost,
  sub = false,
}: {
  receipt: Receipt
  index: number
  isFirst: boolean
  isLast: boolean
  totalInferenceCost?: number
  sub?: boolean
}) {
  if (typeof window !== 'undefined') ensureStyles()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const variant: DotVariant = 'inference'
  const [timeShort, timeFull] = formatTimestamp(receipt.timestamp)
  const narrative = buildNarrative(receipt)
  const model = extractModelName(receipt.service)
  const phase = extractPhase(receipt.notes)
  const costStr = `$${formatAmount(receipt.amount, 4)}`
  const totalStr = totalInferenceCost != null
    ? `of $${totalInferenceCost.toFixed(totalInferenceCost < 0.1 ? 3 : 2)} total`
    : null

  const delay = Math.min(index * 20, 300)

  return (
    <>
      <div
        className={`tl-node-animate flex gap-3 group ${receipt.modelInfo ? 'cursor-pointer' : ''}`}
        style={{ animationDelay: `${delay}ms` }}
        onClick={() => receipt.modelInfo && setIsModalOpen(true)}
      >
        {/* Timeline spine */}
        <div className="flex flex-col items-center w-4 shrink-0">
          <div className={`w-px flex-1 ${isFirst ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
          <Dot variant={variant} large={!sub} pulse={isFirst && index === 0 && !sub} />
          <div className={`w-px flex-1 ${isLast ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
        </div>

        {/* Content */}
        <div className="pb-3 pt-0.5 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs leading-snug ${sub ? 'text-zinc-400' : 'text-zinc-100 font-medium'}`}>
              {narrative}
            </p>
            <span
              className="text-xs font-bold tabular-nums shrink-0 text-purple-300"
              title={totalStr ?? undefined}
            >
              {costStr}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-500">
            <span title={timeFull}>{timeShort}</span>
            {model && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="font-mono text-purple-500/70 bg-purple-500/10 px-1 rounded">
                  {model}
                </span>
              </>
            )}
            {phase && phase !== 'unknown' && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-500">{phase}</span>
              </>
            )}
            {receipt.modelInfo && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-purple-400/50 group-hover:text-purple-400 transition-colors">
                  ⚡ details
                </span>
              </>
            )}
          </div>
        </div>
      </div>

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
// Grouped Inference chapter node
// ---------------------------------------------------------------------------

function GroupedInferenceNode({
  receipts,
  index,
  isFirst,
  isLast,
  totalInferenceCost,
}: {
  receipts: Receipt[]
  index: number
  isFirst: boolean
  isLast: boolean
  totalInferenceCost?: number
}) {
  if (typeof window !== 'undefined') ensureStyles()

  const [expanded, setExpanded] = useState(false)
  const variant: DotVariant = 'group-inference'
  const narrative = buildGroupNarrative(receipts)
  const first = receipts[0]
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const totalStr = `$${total.toFixed(total < 0.1 ? 3 : 2)}`

  const delay = Math.min(index * 20, 300)

  return (
    <div
      className="tl-node-animate"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Chapter header node */}
      <div
        className="flex gap-3 group cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Timeline spine */}
        <div className="flex flex-col items-center w-4 shrink-0">
          <div className={`w-px flex-1 ${isFirst ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
          <Dot variant={variant} large pulse={isFirst && index === 0} />
          <div className={`w-px flex-1 ${(isLast && !expanded) ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
        </div>

        {/* Chapter summary */}
        <div className="pb-3 pt-0.5 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-zinc-100 font-semibold leading-snug">
              {narrative}
            </p>
            <span className="text-xs font-bold tabular-nums shrink-0 text-purple-300">
              {totalStr}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
            {expanded
              ? <ChevronDown className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
            }
            <span>{expanded ? 'collapse' : `show ${receipts.length} calls`}</span>
          </div>
        </div>
      </div>

      {/* Expanded sub-nodes */}
      {expanded && (
        <div className="ml-4 pl-1 border-l border-purple-500/10">
          {receipts.map((r, i) => (
            <InferenceNode
              key={r.hash}
              receipt={r}
              index={i}
              isFirst={i === 0}
              isLast={i === receipts.length - 1}
              totalInferenceCost={totalInferenceCost}
              sub
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouped USDC chapter node
// ---------------------------------------------------------------------------

function GroupedUSDCNode({
  receipts,
  index,
  isFirst,
  isLast,
}: {
  receipts: Receipt[]
  index: number
  isFirst: boolean
  isLast: boolean
}) {
  if (typeof window !== 'undefined') ensureStyles()

  const [expanded, setExpanded] = useState(false)
  const first = receipts[0]
  const isSent = first.direction === 'sent'
  const variant: DotVariant = isSent ? 'group-sent' : 'group-received'
  const narrative = buildGroupNarrative(receipts)
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const totalStr = (isSent ? '−' : '+') + total.toFixed(2) + ' USDC'
  const amountColor = isSent ? 'text-red-400' : 'text-green-400'

  const delay = Math.min(index * 20, 300)

  return (
    <div
      className="tl-node-animate"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Chapter header */}
      <div
        className="flex gap-3 group cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Timeline spine */}
        <div className="flex flex-col items-center w-4 shrink-0">
          <div className={`w-px flex-1 ${isFirst ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
          <Dot variant={variant} large pulse={isFirst && index === 0} />
          <div className={`w-px flex-1 ${(isLast && !expanded) ? 'bg-transparent' : `border-l ${lineColorClass(variant)}`}`} />
        </div>

        {/* Chapter summary */}
        <div className="pb-3 pt-0.5 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-zinc-100 font-semibold leading-snug">
              {narrative}
            </p>
            <span className={`text-xs font-bold tabular-nums shrink-0 ${amountColor}`}>
              {totalStr}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
            {expanded
              ? <ChevronDown className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
            }
            <span>{expanded ? 'collapse' : `show ${receipts.length} transactions`}</span>
          </div>
        </div>
      </div>

      {/* Expanded sub-nodes */}
      {expanded && (
        <div className="ml-4 pl-1 border-l border-zinc-700/20">
          {receipts.map((r, i) => (
            <USDCNode
              key={r.hash}
              receipt={r}
              index={i}
              isFirst={i === 0}
              isLast={i === receipts.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouping logic (identical to original)
// ---------------------------------------------------------------------------

type DisplayItem =
  | { kind: 'single'; receipt: Receipt }
  | { kind: 'grouped'; receipts: Receipt[] }
  | { kind: 'grouped-inference'; receipts: Receipt[] }

export function groupReceiptsForDisplay(receipts: Receipt[]): DisplayItem[] {
  const result: DisplayItem[] = []
  let i = 0

  while (i < receipts.length) {
    const r = receipts[i]

    // Group consecutive inference receipts with same task name (2+)
    if (isInferenceReceipt(r)) {
      const taskKey = extractTaskName(r.service)
      let j = i + 1
      while (
        j < receipts.length &&
        isInferenceReceipt(receipts[j]) &&
        extractTaskName(receipts[j].service) === taskKey
      ) {
        j++
      }
      const count = j - i
      if (count >= 2) {
        result.push({ kind: 'grouped-inference', receipts: receipts.slice(i, j) })
        i = j
      } else {
        result.push({ kind: 'single', receipt: r })
        i++
      }
      continue
    }

    // Count consecutive receipts with same direction+counterparty
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
// Public exports — same signatures as ReceiptCard.tsx
// ---------------------------------------------------------------------------

/** Single receipt card — renders as a timeline node */
export function ReceiptCard({
  receipt,
  index = 0,
}: {
  receipt: Receipt
  index?: number
  isFirstInference?: boolean
}) {
  if (isInferenceReceipt(receipt)) {
    return (
      <div className="relative">
        <InferenceNode
          receipt={receipt}
          index={index}
          isFirst
          isLast
        />
      </div>
    )
  }
  return (
    <div className="relative">
      <USDCNode receipt={receipt} index={index} isFirst isLast />
    </div>
  )
}

/** Timeline receipt list with narrative nodes and chapter grouping */
export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  const totalInferenceCost = receipts
    .filter(isInferenceReceipt)
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)

  return (
    <div className="relative px-1">
      {/* Gradient fade overlay at the bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--background, #09090b))',
        }}
      />

      {/* Timeline feed */}
      <div>
        {items.map((item, i) => {
          const isFirst = i === 0
          const isLast = i === items.length - 1

          if (item.kind === 'grouped') {
            return (
              <GroupedUSDCNode
                key={item.receipts[0].hash}
                receipts={item.receipts}
                index={i}
                isFirst={isFirst}
                isLast={isLast}
              />
            )
          }

          if (item.kind === 'grouped-inference') {
            return (
              <GroupedInferenceNode
                key={item.receipts[0].hash}
                receipts={item.receipts}
                index={i}
                isFirst={isFirst}
                isLast={isLast}
                totalInferenceCost={totalInferenceCost}
              />
            )
          }

          const receipt = item.receipt
          const isInference = isInferenceReceipt(receipt)
          if (isInference) {
            return (
              <InferenceNode
                key={receipt.hash}
                receipt={receipt}
                index={i}
                isFirst={isFirst}
                isLast={isLast}
                totalInferenceCost={totalInferenceCost}
              />
            )
          }

          return (
            <USDCNode
              key={receipt.hash}
              receipt={receipt}
              index={i}
              isFirst={isFirst}
              isLast={isLast}
            />
          )
        })}
      </div>
    </div>
  )
}
