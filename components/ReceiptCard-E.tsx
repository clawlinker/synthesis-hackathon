'use client'

import { type Receipt } from '@/app/types'
import { useState } from 'react'
import { InferenceModal } from './InferenceModal'
import { Card } from '@/components/ui/card'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  ChevronDown,
  ChevronRight,
  Bot,
  ShieldCheck,
  Activity,
  Clock,
  ExternalLink,
  Play,
} from 'lucide-react'
import Link from 'next/link'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Chain colors (brand colors from Etherscan/Zerion)
const CHAIN_COLORS = {
  base: '#1686D3', // Base blue
  ethereum: '#627EEA', // Ethereum purple
} as const

const CHAIN_BADGE_COLORS = {
  base: { bg: 'bg-[#1686D3]/10', text: 'text-[#1686D3]', border: 'border-[#1686D3]/20' },
  ethereum: { bg: 'bg-[#627EEA]/10', text: 'text-[#627EEA]', border: 'border-[#627EEA]/20' },
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function shortenAddress(addr: string): string {
  if (!addr || addr === ZERO_ADDRESS) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTimestamp(ts: number): [string, string, boolean] {
  const now = Date.now()
  const date = new Date(ts * 1000)
  const diffMs = now - ts * 1000
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const full = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Receipt is "new" if within last hour ( Stripe-style fresh indicator )
  const isNew = diffHour < 1

  let short: string
  if (diffSec < 60) {
    short = 'just now'
  } else if (diffMin < 60) {
    short = `${diffMin}m ago`
  } else if (diffHour < 24) {
    short = `${diffHour}h ago`
  } else if (diffDay < 7) {
    short = date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else {
    const thisYear = new Date().getFullYear()
    const sameYear = date.getFullYear() === thisYear
    if (sameYear) {
      short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return [short, full, isNew]
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

/** Humanize task names: underscores → spaces, title-case, truncate at 35 chars */
function humanizeTaskName(raw: string): string {
  const spaced = raw.replace(/_/g, ' ')
  const titled = spaced.replace(/\b\w/g, (c) => c.toUpperCase())
  if (titled.length <= 35) return titled
  return titled.slice(0, 34).trimEnd() + '…'
}

/** Extract phase from notes field: "phase:execute|description..." → "execute" */
function extractPhase(notes: string | undefined): string | null {
  if (!notes) return null
  const match = notes.match(/^phase:([^|]+)/)
  return match ? match[1].trim() : null
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

/** Humanize service names: replace underscores with spaces, title-case */
function humanizeService(service: string): string {
  return service
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Extract chain ID from receipt (default to Base) */
function getChainId(receipt: Receipt): 'base' | 'ethereum' {
  // Try to infer from address patterns or service context
  // For now, default to Base as that's the primary chain
  return 'base'
}

/** Stable key for grouping consecutive receipts to the same counterparty */
function groupKey(receipt: Receipt): string {
  const addr = receipt.direction === 'sent' ? receipt.to : receipt.from
  return `${receipt.direction}:${addr.toLowerCase()}`
}

/** Format cost string from amount */
function formatCost(amount: string): string {
  const val = parseFloat(amount)
  return `$${val.toFixed(val < 0.01 ? 4 : val < 0.1 ? 3 : 2)}`
}

/** Format amount with proper decimal places and alignment */
function formatAmount(amount: string): string {
  const val = parseFloat(amount)
  if (val < 0.01) return val.toFixed(4)
  if (val < 0.1) return val.toFixed(3)
  return val.toFixed(2)
}

// ---------------------------------------------------------------------------
// Network Badge Component (Pass 3: Zerion/Rainbow style network badge)
// ---------------------------------------------------------------------------

function NetworkBadge({ chain }: { chain: 'base' | 'ethereum' }) {
  const colors = CHAIN_BADGE_COLORS[chain]
  const label = chain.toUpperCase()

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border
        px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider shadow-sm`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${chain === 'base' ? 'bg-[#1686D3]' : 'bg-[#627EEA]'}`} />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// New Receipt Indicator (Pass 5: Stripe-style fresh indicator)
// ---------------------------------------------------------------------------

function NewIndicator() {
  return (
    <span className="group relative inline-flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Individual USDC Receipt Card
// ---------------------------------------------------------------------------

function USDCCard({ receipt, index, totalCount }: { receipt: Receipt; index: number; totalCount: number }) {
  const isSent = receipt.direction === 'sent'
  const [timeShort, timeFull, isNew] = formatTimestamp(receipt.timestamp)
  const counterpartyName = getCounterpartyName(receipt)
  const counterpartyAddr = getCounterpartyAddress(receipt)
  const chain = getChainId(receipt)
  const isCompact = totalCount > 20 // Pass 2: Smart density detection

  const val = parseFloat(receipt.amount)
  const amountStr = formatAmount(receipt.amount)
  const sign = isSent ? '−' : '+'

  const borderColor = isSent ? 'border-red-500/60' : 'border-green-500/60'
  const amountColor = isSent ? 'text-red-400' : 'text-green-400'
  const iconColor = isSent ? 'text-red-400' : 'text-green-400'
  const hoverShadow = isSent ? 'shadow-red-900/10' : 'shadow-green-900/10'

  const delay = Math.min(index * 25, 400)

  // Pass 1: Clean 2-row layout for spacious view
  if (!isCompact) {
    return (
      <Card
        className={`group relative cursor-default border-l-4 ${borderColor} px-4 py-3
          hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 hover:border-l-${isSent ? 'red-400' : 'green-400'}
          active:scale-[0.99] transition-all duration-200 ease-out`}
        style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}
      >
        {/* Pass 5: New indicator pulse */}
        {isNew && (
          <div className="absolute top-3 right-4">
            <NewIndicator />
          </div>
        )}

        {/* Row 1: icon + counterparty + amount (Pass 1: 2-row design) */}
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Left: icon + counterparty */}
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className={`shrink-0 mt-0.5 ${iconColor}`}>
              {isSent ? (
                <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <ArrowDownLeft className="h-5 w-5" strokeWidth={2.5} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="text-sm font-bold text-zinc-100 truncate leading-tight">
                  {counterpartyName}
                </div>
                {/* Pass 3: Network badge */}
                <NetworkBadge chain={chain} />
              </div>
              {counterpartyAddr && (
                <div className="text-[10px] font-mono text-zinc-500 truncate leading-tight flex items-center gap-1">
                  {counterpartyAddr}
                </div>
              )}
            </div>
          </div>

          {/* Right: amount */}
          <div className="shrink-0 text-right">
            <div className={`text-base font-bold tabular-nums leading-none ${amountColor}`}>
              {sign}{amountStr}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium leading-none mt-0.5">USDC</div>
          </div>
        </div>

        {/* Row 2: meta (service, time, hash) - Pass 1: Clean 2-row layout */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-500 gap-3">
          {/* Service name from Etherscan style */}
          {receipt.service ? (
            <div className="flex items-center gap-2 truncate flex-1">
              <span className="truncate text-zinc-400">{receipt.service}</span>
            </div>
          ) : (
            <span className="flex-1" />
          )}

          <div className="flex items-center gap-3 shrink-0">
            {/* Timestamp with tooltip */}
            <div className="flex items-center gap-1.5 min-w-0" title={timeFull}>
              <Clock className="h-3 w-3 text-zinc-600" />
              <span className="truncate">{timeShort}</span>
            </div>

            {/* Pass 5: Working hash link to basescan.org */}
            {receipt.hash && !receipt.hash.startsWith('inference-') && (
              <a
                href={`https://basescan.org/tx/${receipt.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-zinc-600 hover:text-[#1686D3] hover:underline transition-colors flex items-center gap-1 group/link"
                title={receipt.hash}
              >
                {receipt.hash.slice(0, 8)}…
                <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-60 transition-opacity" />
              </a>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Pass 2: Compact single-row layout for dense view
  return (
    <Card
      className={`group relative cursor-default border-l-4 ${borderColor} px-3 py-2
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-l-${isSent ? 'red-400' : 'green-400'}
        active:scale-[0.98] transition-all duration-200 ease-out`}
      style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}
    >
      {/* Pass 5: New indicator pulse */}
      {isNew && (
        <div className="absolute top-2 right-3">
          <NewIndicator />
        </div>
      )}

      {/* Single row: counterparty · service · amount */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: icon + counterparty */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`shrink-0 ${iconColor}`}>
            {isSent ? (
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ArrowDownLeft className="h-4 w-4" strokeWidth={2.5} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="text-xs font-semibold text-zinc-100 truncate leading-tight">
                {counterpartyName}
              </div>
              {/* Pass 3: Network badge in compact view */}
              <NetworkBadge chain={chain} />
            </div>
            {counterpartyAddr && (
              <div className="text-[9px] font-mono text-zinc-500 truncate leading-tight">
                {counterpartyAddr}
              </div>
            )}
          </div>
        </div>

        {/* Right: service · amount */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Service */}
          {receipt.service && (
            <span className="text-[9px] text-zinc-600 truncate hidden sm:inline">{receipt.service}</span>
          )}
          {/* Amount */}
          <div className="text-right min-w-[50px]">
            <div className={`text-sm font-bold tabular-nums leading-none ${amountColor}`}>
              {sign}{amountStr}
            </div>
            <div className="text-[9px] text-zinc-500 leading-none">USDC</div>
          </div>
          {/* Clock icon */}
          <div className="flex items-center gap-2 shrink-0" title={timeFull}>
            <Clock className="h-3 w-3 text-zinc-600" />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Inference Receipt Card
// ---------------------------------------------------------------------------

function InferenceCard({
  receipt,
  index,
  totalInferenceCost,
}: {
  receipt: Receipt
  index: number
  totalInferenceCost?: number
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [timeShort, timeFull, isNew] = formatTimestamp(receipt.timestamp)
  const modelName = extractModelName(receipt.service)
  const rawTask = extractTaskName(receipt.service)
  const taskName = humanizeTaskName(rawTask)
  const phase = extractPhase(receipt.notes)

  const val = parseFloat(receipt.amount)
  const costStr = formatCost(receipt.amount)
  const totalStr = totalInferenceCost != null
    ? `$${totalInferenceCost.toFixed(totalInferenceCost < 0.1 ? 3 : 2)}`
    : null

  const delay = Math.min(index * 25, 400)

  return (
    <>
      <Card
        onClick={() => receipt.modelInfo && setIsModalOpen(true)}
        className={`group border-l-4 border-purple-500/60 bg-purple-500/[0.04]
          hover:bg-purple-500/[0.08] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-900/20
          active:scale-[0.99] transition-all duration-200 px-4 py-3
          ${receipt.modelInfo ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}
      >
        {/* Pass 5: New indicator pulse */}
        {isNew && (
          <div className="absolute top-3 right-4">
            <NewIndicator />
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          {/* Left: Bot icon + task name (Rainbow style playful colors) */}
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Bot className="h-5 w-5 shrink-0 text-purple-400 mt-0.5" strokeWidth={2} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-zinc-100 truncate leading-tight">
                  {taskName}
                </span>
                <NetworkBadge chain="base" />
              </div>
              {/* Pass 4: Phase badge (Stripe-style event log) */}
              {phase && phase !== 'unknown' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="h-3 w-3 text-zinc-600" />
                  <span className="text-[10px] font-medium text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded-full">
                    {phase}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: cost with total context on hover (Zerion clean display) */}
          <div className="shrink-0 text-right">
            <span
              className="text-base font-bold tabular-nums text-purple-300"
              title={totalStr ? `${costStr} of ${totalStr} total inference` : undefined}
            >
              {costStr}
            </span>
            <div className="text-[10px] text-zinc-500 font-medium leading-none mt-0.5">inference</div>
          </div>
        </div>

        {/* Bottom row: model pill + time */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-500 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {modelName && (
              <span className="inline-flex items-center rounded-lg bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-[9px] font-mono text-purple-400 shrink-0">
                {modelName}
              </span>
            )}
            {receipt.modelInfo && (
              <span className="text-purple-400/60 hover:text-purple-400/90 transition-colors text-[10px] shrink-0 flex items-center gap-1 cursor-pointer">
                <Activity className="h-3 w-3" />
                breakdown
              </span>
            )}
          </div>
          {/* Pass 5: Timestamp with new indicator */}
          <div className="flex items-center gap-2 shrink-0" title={timeFull}>
            <Clock className="h-3 w-3 text-zinc-600" />
            <span className="truncate">{timeShort}</span>
            {isNew && <Play className="h-2 w-2 text-emerald-500 animate-pulse" />}
          </div>
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
// Grouped Inference Card (same task name, 2+ calls)
// Pass 4: Accordion style with smooth expansion (Rainbow + Stripe hybrid)
// ---------------------------------------------------------------------------

function GroupedInferenceCard({
  receipts,
  index,
  totalInferenceCost,
}: {
  receipts: Receipt[]
  index: number
  totalInferenceCost?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const first = receipts[0]
  const rawTask = extractTaskName(first.service)
  const taskName = humanizeTaskName(rawTask)
  const total = receipts.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const totalStr = `$${total.toFixed(total < 0.1 ? 3 : 2)}`
  const grandTotalStr = totalInferenceCost != null
    ? `$${totalInferenceCost.toFixed(totalInferenceCost < 0.1 ? 3 : 2)}`
    : null

  const delay = Math.min(index * 25, 400)

  return (
    <div style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}>
      <Card
        onClick={() => setExpanded((v) => !v)}
        className="group cursor-pointer border-l-4 border-purple-500/60 bg-purple-500/[0.04]
          hover:bg-purple-500/[0.08] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-900/20
          active:scale-[0.99] transition-all duration-200 px-4 py-3
          overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Bot icon + summary (Rainbow style with counterparty icon) */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="shrink-0">
              <Bot className="h-5 w-5 text-purple-400" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-zinc-100 truncate leading-tight">
                  {receipts.length} calls · {taskName}
                </span>
                <NetworkBadge chain="base" />
              </div>
              <div className="flex items-center gap-2">
                {/* Pass 4: Accordion expansion indicator */}
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                  {expanded ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      collapse
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      expand
                    </>
                  )}
                </span>
                {/* Total count badge */}
                <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded-full">
                  Total: {totalStr}
                </span>
              </div>
            </div>
          </div>

          {/* Right: total cost */}
          <div className="shrink-0 text-right">
            <div
              className="text-base font-bold tabular-nums leading-none text-purple-300"
              title={grandTotalStr ? `${totalStr} of ${grandTotalStr} total inference` : undefined}
            >
              {totalStr}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium leading-none mt-0.5">inference</div>
          </div>
        </div>
      </Card>

      {/* Pass 4: Smooth height animation on expand/collapse */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: expanded ? 'auto' : 0 }}
      >
        <div className="mt-2 ml-3 pl-3 border-l border-purple-700/30 space-y-1">
          {receipts.map((r, i) => (
            <div
              key={r.hash}
              className="animate-slideIn"
              style={{ animation: `slideIn 0.25s ease-out ${i * 0.05}s both` }}
            >
              <InferenceCard
                receipt={r}
                index={0}
                totalInferenceCost={totalInferenceCost}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouped Receipt Card (3+ consecutive receipts to same counterparty)
// Pass 4: Accordion style with smooth expansion
// ---------------------------------------------------------------------------

function GroupedCard({ receipts, index }: { receipts: Receipt[]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const first = receipts[0]
  const isSent = first.direction === 'sent'
  const counterpartyName = getCounterpartyName(first)
  const total = receipts.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const sign = isSent ? '−' : '+'

  const borderColor = isSent ? 'border-red-500/60' : 'border-green-500/60'
  const amountColor = isSent ? 'text-red-400' : 'text-green-400'
  const iconColor = isSent ? 'text-red-400' : 'text-green-400'
  const hoverShadow = isSent ? 'shadow-red-900/10' : 'shadow-green-900/10'

  const delay = Math.min(index * 25, 400)

  return (
    <div style={{ animation: `fadeIn 0.35s ease-out ${delay}ms both` }}>
      <Card
        onClick={() => setExpanded((v) => !v)}
        className={`group cursor-pointer border-l-4 ${borderColor} px-4 py-3
          hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 hover:border-l-${isSent ? 'red-400' : 'green-400'}
          active:scale-[0.99] transition-all duration-200 overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: stacked icon + summary (Rainbow style counterparty icon) */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`shrink-0 ${iconColor}`}>
              <Layers className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-zinc-100 truncate leading-tight">
                  {receipts.length} transactions · {counterpartyName}
                </span>
                <NetworkBadge chain="base" />
              </div>
              <div className="flex items-center gap-2">
                {/* Pass 4: Accordion expansion indicator */}
                <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                  {expanded ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      collapse
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      expand
                    </>
                  )}
                </span>
                {/* Total count badge */}
                <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded-full">
                  Total: {sign}{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: total */}
          <div className="shrink-0 text-right">
            <div className={`text-base font-bold tabular-nums leading-none ${amountColor}`}>
              {sign}{total.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium leading-none mt-0.5">USDC</div>
          </div>
        </div>
      </Card>

      {/* Pass 4: Smooth height animation on expand/collapse */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: expanded ? 'auto' : 0 }}
      >
        <div className="mt-2 ml-3 pl-3 border-l border-zinc-700/40 space-y-1">
          {receipts.map((r, i) => (
            <div
              key={r.hash}
              className="animate-slideIn"
              style={{ animation: `slideIn 0.25s ease-out ${i * 0.05}s both` }}
            >
              <USDCCard key={r.hash} receipt={r} index={0} totalCount={receipts.length} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouping logic
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

    // Group consecutive inference receipts with the same task name (2+)
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
export function ReceiptCard({ receipt, index = 0, isFirstInference }: { receipt: Receipt; index?: number; isFirstInference?: boolean }) {
  // Determine total count for density logic - if we're in a list context
  // we'd need to pass this, but for standalone cards, assume spacious view
  if (isInferenceReceipt(receipt)) {
    return <InferenceCard receipt={receipt} index={index} />
  }
  return <USDCCard receipt={receipt} index={index} totalCount={1} />
}

/** Receipt list with automatic grouping of consecutive duplicates */
export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)
  const totalCount = receipts.length
  const isDense = totalCount > 20 // Pass 2: Smart density

  // Compute total inference cost for cost context
  const totalInferenceCost = receipts
    .filter(isInferenceReceipt)
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)

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
        if (item.kind === 'grouped-inference') {
          return (
            <GroupedInferenceCard
              key={item.receipts[0].hash}
              receipts={item.receipts}
              index={i}
              totalInferenceCost={totalInferenceCost}
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
