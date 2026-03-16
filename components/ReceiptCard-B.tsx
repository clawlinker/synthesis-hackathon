'use client'

/**
 * ReceiptCard-B — Premium Fintech Design
 * Philosophy: Revolut × Mercury × Phantom Wallet
 * 5-pass refinement: card, gradients, status, grouping, animations
 */

import { type Receipt } from '@/app/types'
import { useState, useEffect, useRef } from 'react'
import { InferenceModal } from './InferenceModal'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Check,
  Layers,
} from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ---------------------------------------------------------------------------
// Animation styles — injected once into the document
// ---------------------------------------------------------------------------

const ANIMATION_CSS = `
  @keyframes springIn {
    0%   { opacity: 0; transform: translateY(14px) scale(0.97); }
    55%  { opacity: 1; transform: translateY(-3px) scale(1.008); }
    75%  { transform: translateY(1px) scale(0.998); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
  @keyframes confirmSlide {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
`

let stylesInjected = false

function InjectAnimationStyles() {
  useEffect(() => {
    if (stylesInjected) return
    const el = document.createElement('style')
    el.textContent = ANIMATION_CSS
    document.head.appendChild(el)
    stylesInjected = true
  }, [])
  return null
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Count-up from 0 to target with ease-out-expo, starts after `delayMs` */
function useCountUp(target: number, durationMs = 650, delayMs = 0): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = performance.now()
      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / durationMs, 1)
        // ease-out-expo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        setValue(target * eased)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      clearTimeout(timer)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs, delayMs])

  return value
}

// ---------------------------------------------------------------------------
// Helpers (same logic as original ReceiptCard.tsx)
// ---------------------------------------------------------------------------

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
      short =
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' · ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else {
      short = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
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

function groupKey(receipt: Receipt): string {
  const addr = receipt.direction === 'sent' ? receipt.to : receipt.from
  return `${receipt.direction}:${addr.toLowerCase()}`
}

function formatCost(amount: string): string {
  const val = parseFloat(amount)
  return `$${val.toFixed(val < 0.01 ? 4 : val < 0.1 ? 3 : 2)}`
}

// ---------------------------------------------------------------------------
// Design tokens & sub-components
// ---------------------------------------------------------------------------

type TxType = 'received' | 'sent' | 'inference'

interface IconConfig {
  gradientFrom: string
  gradientTo: string
  borderColor: string
  glowColor: string
  textColor: string
}

const ICON_CONFIGS: Record<TxType, IconConfig> = {
  received: {
    gradientFrom: 'rgba(34,197,94,0.18)',
    gradientTo: 'rgba(16,185,129,0.04)',
    borderColor: 'rgba(34,197,94,0.25)',
    glowColor: 'rgba(34,197,94,0.12)',
    textColor: '#4ade80',
  },
  sent: {
    gradientFrom: 'rgba(239,68,68,0.18)',
    gradientTo: 'rgba(220,38,38,0.04)',
    borderColor: 'rgba(239,68,68,0.25)',
    glowColor: 'rgba(239,68,68,0.12)',
    textColor: '#f87171',
  },
  inference: {
    gradientFrom: 'rgba(168,85,247,0.18)',
    gradientTo: 'rgba(139,92,246,0.04)',
    borderColor: 'rgba(168,85,247,0.25)',
    glowColor: 'rgba(168,85,247,0.12)',
    textColor: '#c084fc',
  },
}

function TxIcon({ type }: { type: TxType }) {
  const cfg = ICON_CONFIGS[type]
  return (
    <div
      className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
        border: `1px solid ${cfg.borderColor}`,
        boxShadow: `0 0 12px ${cfg.glowColor}`,
      }}
    >
      {type === 'received' && (
        <ArrowDownLeft style={{ color: cfg.textColor }} className="h-4 w-4" strokeWidth={2.5} />
      )}
      {type === 'sent' && (
        <ArrowUpRight style={{ color: cfg.textColor }} className="h-4 w-4" strokeWidth={2.5} />
      )}
      {type === 'inference' && (
        <Bot style={{ color: cfg.textColor }} className="h-4 w-4" strokeWidth={2} />
      )}
    </div>
  )
}

function NetworkBadge() {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
      style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
      }}
    >
      {/* Base network circle */}
      <div
        className="h-2 w-2 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          boxShadow: '0 0 4px rgba(59,130,246,0.4)',
        }}
      />
      <span className="text-[9px] font-semibold tracking-wide" style={{ color: '#60a5fa' }}>
        Base
      </span>
    </div>
  )
}

function ConfirmedBadge() {
  return (
    <div
      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
      style={{
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.2)',
      }}
    >
      <Check className="h-2.5 w-2.5" style={{ color: '#4ade80' }} strokeWidth={3} />
      <span
        className="text-[9px] font-bold tracking-widest uppercase"
        style={{ color: '#4ade80', letterSpacing: '0.08em' }}
      >
        Confirmed
      </span>
    </div>
  )
}

/** 1px gradient status bar at the bottom of each card */
function StatusBar({ txType }: { txType: TxType }) {
  const colors: Record<TxType, string> = {
    received: 'from-transparent via-green-500/50 to-transparent',
    sent: 'from-transparent via-red-500/50 to-transparent',
    inference: 'from-transparent via-purple-500/50 to-transparent',
  }
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r ${colors[txType]}`}
      style={{
        animation: 'confirmSlide 0.6s ease-out 0.3s both',
        transformOrigin: 'left center',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Card wrapper — handles hover glow + spring entrance
// ---------------------------------------------------------------------------

interface CardWrapperProps {
  children: React.ReactNode
  txType: TxType
  index: number
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

function CardWrapper({ children, txType, index, onClick, className = '', style }: CardWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const delay = Math.min(index * 40, 500)

  const glowColors: Record<TxType, string> = {
    received: 'rgba(34,197,94,0.08)',
    sent: 'rgba(239,68,68,0.08)',
    inference: 'rgba(168,85,247,0.10)',
  }

  const borderColors: Record<TxType, string> = {
    received: hovered ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.15)',
    sent: hovered ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)',
    inference: hovered ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.15)',
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-xl ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(39,39,42,0.6) 0%, rgba(30,30,32,0.35) 100%)',
        border: `1px solid ${borderColors[txType]}`,
        boxShadow: hovered
          ? `0 0 20px ${glowColors[txType]}, 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
        transform: hovered ? 'translateY(-2px) scale(1.005)' : 'translateY(0) scale(1)',
        transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: `springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`,
        backdropFilter: 'blur(8px)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// USDC Receipt Card — Pass 1-5
// ---------------------------------------------------------------------------

function USDCCard({ receipt, index }: { receipt: Receipt; index: number }) {
  const isSent = receipt.direction === 'sent'
  const txType: TxType = isSent ? 'sent' : 'received'
  const [timeShort, timeFull] = formatTimestamp(receipt.timestamp)
  const counterpartyName = getCounterpartyName(receipt)
  const counterpartyAddr = getCounterpartyAddress(receipt)

  const numericValue = parseFloat(receipt.amount)
  const animatedValue = useCountUp(numericValue, 650, Math.min(index * 40 + 150, 600))
  const amountStr = animatedValue.toFixed(2)
  const sign = isSent ? '−' : '+'

  const amountColor = isSent ? '#f87171' : '#4ade80'

  return (
    <CardWrapper txType={txType} index={index}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Left: circular icon */}
          <TxIcon type={txType} />

          {/* Center: counterparty info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-zinc-100 truncate leading-tight">
              {counterpartyName}
            </div>
            {counterpartyAddr && (
              <div className="text-[10px] font-mono text-zinc-500 truncate leading-snug mt-0.5">
                {counterpartyAddr}
              </div>
            )}
            {receipt.service && (
              <div className="text-[10px] text-zinc-600 truncate leading-snug mt-0.5">
                {receipt.service}
              </div>
            )}
          </div>

          {/* Right: amount */}
          <div className="shrink-0 text-right">
            <div
              className="text-base font-bold tabular-nums leading-tight"
              style={{
                color: amountColor,
                textShadow: `0 0 12px ${amountColor}40`,
              }}
            >
              {sign}{amountStr}
            </div>
            <div className="text-[10px] font-medium text-zinc-500 leading-tight mt-0.5">
              USDC
            </div>
          </div>
        </div>

        {/* Bottom meta row */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-1.5">
            <ConfirmedBadge />
            <NetworkBadge />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 shrink-0">
            <span title={timeFull}>{timeShort}</span>
            {receipt.hash && !receipt.hash.startsWith('inference-') && (
              <Link
                href={`/receipt/${receipt.hash}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {receipt.hash.slice(0, 8)}…
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar txType={txType} />
    </CardWrapper>
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
  const [timeShort, timeFull] = formatTimestamp(receipt.timestamp)
  const modelName = extractModelName(receipt.service)
  const rawTask = extractTaskName(receipt.service)
  const taskName = humanizeTaskName(rawTask)
  const phase = extractPhase(receipt.notes)

  const numericValue = parseFloat(receipt.amount)
  const animatedValue = useCountUp(numericValue, 650, Math.min(index * 40 + 150, 600))
  const costStr = `$${animatedValue.toFixed(
    numericValue < 0.01 ? 4 : numericValue < 0.1 ? 3 : 2
  )}`

  const totalStr =
    totalInferenceCost != null
      ? `$${totalInferenceCost.toFixed(totalInferenceCost < 0.1 ? 3 : 2)}`
      : null

  return (
    <>
      <CardWrapper
        txType="inference"
        index={index}
        onClick={receipt.modelInfo ? () => setIsModalOpen(true) : undefined}
      >
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Left: inference icon */}
            <TxIcon type="inference" />

            {/* Center: task info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-100 truncate leading-tight">
                {taskName}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {modelName && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-px text-[9px] font-mono font-semibold"
                    style={{
                      background: 'rgba(168,85,247,0.12)',
                      border: '1px solid rgba(168,85,247,0.25)',
                      color: '#c084fc',
                    }}
                  >
                    {modelName}
                  </span>
                )}
                {phase && phase !== 'unknown' && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-px text-[9px]"
                    style={{
                      background: 'rgba(113,113,122,0.2)',
                      border: '1px solid rgba(113,113,122,0.3)',
                      color: '#a1a1aa',
                    }}
                  >
                    {phase}
                  </span>
                )}
                {receipt.modelInfo && (
                  <span className="text-[9px] text-purple-400/60 hover:text-purple-400 transition-colors">
                    ⚡ breakdown
                  </span>
                )}
              </div>
            </div>

            {/* Right: cost */}
            <div className="shrink-0 text-right">
              <div
                className="text-base font-bold tabular-nums leading-tight"
                style={{
                  color: '#c084fc',
                  textShadow: '0 0 12px rgba(192,132,252,0.35)',
                }}
                title={totalStr ? `${costStr} of ${totalStr} total inference` : undefined}
              >
                {costStr}
              </div>
              <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">inference</div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-1.5">
              <NetworkBadge />
            </div>
            <span className="text-[10px] text-zinc-500 shrink-0" title={timeFull}>
              {timeShort}
            </span>
          </div>
        </div>

        <StatusBar txType="inference" />
      </CardWrapper>

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
// Grouped Inference Card — stacked cards visual (Pass 4)
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

  const animatedTotal = useCountUp(total, 700, Math.min(index * 40 + 150, 600))
  const totalStr = `$${animatedTotal.toFixed(total < 0.1 ? 3 : 2)}`
  const grandTotalStr =
    totalInferenceCost != null
      ? `$${totalInferenceCost.toFixed(totalInferenceCost < 0.1 ? 3 : 2)}`
      : null

  const delay = Math.min(index * 40, 500)

  return (
    <div
      style={{ animation: `springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both` }}
    >
      {/* Stacked cards effect — 2 fake card edges behind */}
      <div className="relative">
        {/* Deepest card edge */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            transform: 'translateY(5px) translateX(3px) scale(0.97)',
            background: 'rgba(20,20,22,0.6)',
            border: '1px solid rgba(168,85,247,0.08)',
            zIndex: 0,
          }}
        />
        {/* Middle card edge */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            transform: 'translateY(2.5px) translateX(1.5px) scale(0.985)',
            background: 'rgba(25,25,28,0.7)',
            border: '1px solid rgba(168,85,247,0.12)',
            zIndex: 1,
          }}
        />

        {/* Top card — actual content */}
        <div className="relative" style={{ zIndex: 2 }}>
          {/* Count badge */}
          <div
            className="absolute -top-2 -right-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(139,92,246,0.8))',
              border: '1px solid rgba(168,85,247,0.4)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(168,85,247,0.4)',
            }}
          >
            {receipts.length}
          </div>

          <div
            className="relative overflow-hidden rounded-xl cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background:
                'linear-gradient(135deg, rgba(39,39,42,0.7) 0%, rgba(30,30,32,0.4) 100%)',
              border: '1px solid rgba(168,85,247,0.2)',
              boxShadow:
                '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow =
                '0 0 20px rgba(168,85,247,0.12), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
              el.style.transform = 'translateY(-2px) scale(1.005)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow =
                '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
              el.style.transform = 'translateY(0) scale(1)'
            }}
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <TxIcon type="inference" />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 truncate leading-tight">
                    {taskName}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-500">
                    {expanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span>{receipts.length} calls · {expanded ? 'collapse' : 'show all'}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div
                    className="text-base font-bold tabular-nums leading-tight"
                    style={{
                      color: '#c084fc',
                      textShadow: '0 0 12px rgba(192,132,252,0.35)',
                    }}
                    title={
                      grandTotalStr
                        ? `${totalStr} of ${grandTotalStr} total inference`
                        : undefined
                    }
                  >
                    {totalStr}
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">total</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 gap-2">
                <NetworkBadge />
                <span className="text-[10px] text-zinc-500">
                  {receipts.length} calls
                </span>
              </div>
            </div>

            <StatusBar txType="inference" />
          </div>
        </div>
      </div>

      {/* Expanded child receipts */}
      {expanded && (
        <div className="mt-2 ml-4 pl-3 border-l border-purple-700/25 space-y-1.5">
          {receipts.map((r, i) => (
            <InferenceCard
              key={r.hash}
              receipt={r}
              index={i}
              totalInferenceCost={totalInferenceCost}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouped USDC Card — stacked cards visual (Pass 4)
// ---------------------------------------------------------------------------

function GroupedCard({ receipts, index }: { receipts: Receipt[]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const first = receipts[0]
  const isSent = first.direction === 'sent'
  const txType: TxType = isSent ? 'sent' : 'received'
  const counterpartyName = getCounterpartyName(first)
  const total = receipts.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const sign = isSent ? '−' : '+'

  const animatedTotal = useCountUp(total, 700, Math.min(index * 40 + 150, 600))
  const amountStr = animatedTotal.toFixed(2)

  const delay = Math.min(index * 40, 500)

  const amountColor = isSent ? '#f87171' : '#4ade80'
  const stackBorderColor = isSent
    ? 'rgba(239,68,68,0.08)'
    : 'rgba(34,197,94,0.08)'
  const stackBorderColorMid = isSent
    ? 'rgba(239,68,68,0.12)'
    : 'rgba(34,197,94,0.12)'
  const cardBorderColor = isSent
    ? 'rgba(239,68,68,0.2)'
    : 'rgba(34,197,94,0.2)'
  const glowColor = isSent
    ? 'rgba(239,68,68,0.1)'
    : 'rgba(34,197,94,0.08)'

  return (
    <div
      style={{ animation: `springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both` }}
    >
      <div className="relative">
        {/* Deepest card edge */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            transform: 'translateY(5px) translateX(3px) scale(0.97)',
            background: 'rgba(20,20,22,0.6)',
            border: `1px solid ${stackBorderColor}`,
            zIndex: 0,
          }}
        />
        {/* Middle card edge */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            transform: 'translateY(2.5px) translateX(1.5px) scale(0.985)',
            background: 'rgba(25,25,28,0.7)',
            border: `1px solid ${stackBorderColorMid}`,
            zIndex: 1,
          }}
        />

        {/* Top card */}
        <div className="relative" style={{ zIndex: 2 }}>
          {/* Count badge */}
          <div
            className="absolute -top-2 -right-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
            style={{
              background: isSent
                ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.8))'
                : 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.8))',
              border: `1px solid ${isSent ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
              color: '#fff',
              boxShadow: `0 2px 8px ${isSent ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
            }}
          >
            {receipts.length}
          </div>

          <div
            className="relative overflow-hidden rounded-xl cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background:
                'linear-gradient(135deg, rgba(39,39,42,0.7) 0%, rgba(30,30,32,0.4) 100%)',
              border: `1px solid ${cardBorderColor}`,
              boxShadow:
                '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = `0 0 20px ${glowColor}, 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`
              el.style.transform = 'translateY(-2px) scale(1.005)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow =
                '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
              el.style.transform = 'translateY(0) scale(1)'
            }}
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <TxIcon type={txType} />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 truncate leading-tight">
                    {counterpartyName}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-500">
                    {expanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span>
                      {receipts.length} transactions · {expanded ? 'collapse' : 'show all'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div
                    className="text-base font-bold tabular-nums leading-tight"
                    style={{
                      color: amountColor,
                      textShadow: `0 0 12px ${amountColor}40`,
                    }}
                  >
                    {sign}{amountStr}
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                    USDC total
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <ConfirmedBadge />
                  <NetworkBadge />
                </div>
                <span className="text-[10px] text-zinc-500">
                  {receipts.length} txns
                </span>
              </div>
            </div>

            <StatusBar txType={txType} />
          </div>
        </div>
      </div>

      {/* Expanded children */}
      {expanded && (
        <div
          className={`mt-2 ml-4 pl-3 space-y-1.5 ${
            isSent ? 'border-l border-red-700/25' : 'border-l border-green-700/25'
          }`}
        >
          {receipts.map((r, i) => (
            <USDCCard key={r.hash} receipt={r} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouping logic (same algorithm as original)
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
export function ReceiptCard({
  receipt,
  index = 0,
}: {
  receipt: Receipt
  index?: number
  isFirstInference?: boolean
}) {
  return (
    <>
      <InjectAnimationStyles />
      {isInferenceReceipt(receipt) ? (
        <InferenceCard receipt={receipt} index={index} />
      ) : (
        <USDCCard receipt={receipt} index={index} />
      )}
    </>
  )
}

/** Receipt list with automatic grouping of consecutive duplicates */
export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  const totalInferenceCost = receipts
    .filter(isInferenceReceipt)
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)

  return (
    <>
      <InjectAnimationStyles />
      <div className="space-y-2.5">
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
    </>
  )
}
