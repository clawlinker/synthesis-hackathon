'use client'

/**
 * ReceiptCard — Final Production Version (Best-of-Breed)
 * 
 * Summary: Narrative-focused timeline UI with compact cards, gradient icons,
 * hover tooltips, and smart amount formatting. Designed for hackathon impact.
 * 
 * From A (Minimalist): fixed-column amounts, cursor tooltip, compact height
 * From B (Fintech): gradient icons, border glow, spring animations, status bar
 * From C (Timeline): NARRATIVE TEXT (the killer feature!), colored dots
 * From Original: groupReceiptsForDisplay, InferenceModal, helpers
 */

import { type Receipt } from '@/app/types'
import { useState, useCallback } from 'react'
import { InferenceModal } from './InferenceModal'
import { ChevronRight, ChevronDown, Layers, Bot } from 'lucide-react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — From Original + A + B
// ─────────────────────────────────────────────────────────────────────────────

function shortenAddress(addr: string): string {
  if (!addr || addr === ZERO_ADDRESS) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function isZeroAddress(addr: string): boolean {
  return !addr || addr === ZERO_ADDRESS || addr.replace(/0x0+/, '0x0') === '0x0'
}

function isInferenceReceipt(r: Receipt): boolean {
  return r.hash?.startsWith('inference-') || r.tokenSymbol === 'USD'
}

function extractTaskName(service: string | undefined): string {
  if (!service) return 'Inference'
  const withoutParen = service.split('(')[0].trim()
  const afterDash = withoutParen.split('—')[1]?.trim()
  return afterDash || withoutParen || 'Inference'
}

function extractModelName(service: string | undefined): string | null {
  if (!service) return null
  const m = service.match(/\(([^)]+)\)\s*$/)
  return m ? m[1] : null
}

function humanizeTaskName(raw: string): string {
  const s = raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return s.length <= 44 ? s : s.slice(0, 43).trimEnd() + '…'
}

function getCounterpartyName(r: Receipt): string {
  if (r.direction === 'sent') {
    return r.toAgent?.name || r.toLabel || shortenAddress(r.to)
  }
  if (isZeroAddress(r.from)) return 'Bankr LLM'
  return r.fromAgent?.name || r.fromLabel || shortenAddress(r.from)
}

function getCounterpartyAddress(r: Receipt): string | null {
  if (r.direction === 'sent') {
    const hasName = !!(r.toAgent?.name || r.toLabel)
    return hasName ? shortenAddress(r.to) : null
  } else {
    if (isZeroAddress(r.from)) return null
    const hasName = !!(r.fromAgent?.name || r.fromLabel)
    return hasName ? shortenAddress(r.from) : null
  }
}

function formatTimestamp(ts: number): [string, string] {
  const date = new Date(ts * 1000)
  const diff = Date.now() - ts * 1000
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)

  const full = date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  let short: string
  if (sec < 60) short = 'now'
  else if (min < 60) short = `${min}m`
  else if (hour < 24) short = `${hour}h`
  else {
    const sameYear = date.getFullYear() === new Date().getFullYear()
    short = sameYear
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  }

  return [short, full]
}

// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVE TEXT GENERATORS — From C (Timeline) — KILLER FEATURE
// ─────────────────────────────────────────────────────────────────────────────

function buildUSDCNarrative(r: Receipt): string {
  const sign = r.direction === 'sent' ? 'Paid' : 'Received'
  const amt = formatAmount(r.amount)

  if (r.direction === 'sent') {
    const cp = getCounterpartyName(r)
    // CRITICAL: Don't repeat if service matches counterparty
    if (r.service && r.service.toLowerCase() === cp.toLowerCase()) {
      return `${sign} ${amt} to ${cp}`
    }
    return r.service ? `${sign} ${amt} to ${cp} — ${r.service}` : `${sign} ${amt} USDC to ${cp}`
  } else {
    const cp = getCounterpartyName(r)
    if (r.service && r.service.toLowerCase() === cp.toLowerCase()) {
      return `${sign} ${amt} from ${cp}`
    }
    return r.service ? `${sign} ${amt} from ${cp} — ${r.service}` : `${sign} ${amt} USDC from ${cp}`
  }
}

function buildInferenceNarrative(r: Receipt): string {
  const task = humanizeTaskName(extractTaskName(r.service))
  const model = extractModelName(r.service)
  const amt = formatAmount(r.amount)
  return model ? `Spent ${amt} on ${task} (${model})` : `Spent ${amt} on ${task}`
}

function formatAmount(amount: string): string {
  const v = parseFloat(amount)
  if (v < 0.01) return v.toFixed(4)
  if (v < 0.1) return v.toFixed(3)
  return v.toFixed(2)
}

function groupKey(r: Receipt): string {
  const addr = r.direction === 'sent' ? r.to : r.from
  return `${r.direction}:${addr.toLowerCase()}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Gradient Icon Component — From B (Fintech) — Premium look
// ─────────────────────────────────────────────────────────────────────────────

interface IconConfig {
  gradientFrom: string
  gradientTo: string
  borderColor: string
  glowColor: string
  textColor: string
}

const ICON_CONFIGS: Record<'received' | 'sent' | 'inference' | 'group', IconConfig> = {
  received: {
    gradientFrom: 'rgba(34,197,94,0.20)',
    gradientTo: 'rgba(16,185,129,0.05)',
    borderColor: 'rgba(34,197,94,0.30)',
    glowColor: 'rgba(34,197,94,0.15)',
    textColor: '#4ade80',
  },
  sent: {
    gradientFrom: 'rgba(239,68,68,0.20)',
    gradientTo: 'rgba(220,38,38,0.05)',
    borderColor: 'rgba(239,68,68,0.30)',
    glowColor: 'rgba(239,68,68,0.15)',
    textColor: '#f87171',
  },
  inference: {
    gradientFrom: 'rgba(168,85,247,0.20)',
    gradientTo: 'rgba(139,92,246,0.05)',
    borderColor: 'rgba(168,85,247,0.30)',
    glowColor: 'rgba(168,85,247,0.15)',
    textColor: '#c084fc',
  },
  group: {
    gradientFrom: 'rgba(148,163,184,0.20)',
    gradientTo: 'rgba(100,116,139,0.05)',
    borderColor: 'rgba(148,163,184,0.30)',
    glowColor: 'rgba(148,163,184,0.15)',
    textColor: '#94a3b8',
  },
}

function TxIcon({ type, className = '' }: { type: 'received' | 'sent' | 'inference' | 'group'; className?: string }) {
  const cfg = ICON_CONFIGS[type]
  
  const getIcon = () => {
    switch (type) {
      case 'inference': return <Bot className={`h-4 w-4 ${className}`} style={{ color: cfg.textColor }} strokeWidth={2} />
      case 'group': return <Layers className={`h-4 w-4 ${className}`} style={{ color: cfg.textColor }} strokeWidth={2} />
      case 'sent': return <ChevronRight className={`h-4 w-4 ${className}`} style={{ color: cfg.textColor }} strokeWidth={2} />
      case 'received': return <ChevronDown className={`h-4 w-4 ${className}`} style={{ color: cfg.textColor }} strokeWidth={2} />
    }
  }

  return (
    <div
      className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
        border: `1px solid ${cfg.borderColor}`,
        boxShadow: `0 0 8px ${cfg.glowColor}`,
      }}
    >
      {getIcon()}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Network Badge — From B
// ─────────────────────────────────────────────────────────────────────────────

function NetworkBadge() {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
      style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
      }}
    >
      <div
        className="h-1.5 w-1.5 rounded-full"
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

// ─────────────────────────────────────────────────────────────────────────────
// Hover Tooltip — From A — Cursor-tracking, no navigation needed
// ─────────────────────────────────────────────────────────────────────────────

interface TPos { x: number; y: number }

function ReceiptTooltip({ receipt, pos }: { receipt: Receipt; pos: TPos }) {
  const isInf = isInferenceReceipt(receipt)
  const isSent = receipt.direction === 'sent'
  const [, timeFull] = formatTimestamp(receipt.timestamp)
  const amt = formatAmount(receipt.amount)
  const sign = isInf ? '' : isSent ? '−' : '+'

  const W = 320
  const H = 200
  let left = pos.x + 14
  let top = pos.y - 10

  if (typeof window !== 'undefined') {
    if (left + W > window.innerWidth - 8) left = pos.x - W - 14
    if (top + H > window.innerHeight - 8) top = window.innerHeight - H - 8
    if (top < 8) top = 8
  }

  const amtColor = isInf
    ? 'text-purple-300'
    : isSent ? 'text-red-400' : 'text-emerald-400'

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left, top, width: W }}
    >
      <div className="rounded-lg border border-zinc-700/70 bg-zinc-950 shadow-2xl shadow-black/80 overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/60 border-b border-zinc-800">
          <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-zinc-500 select-none">
            {isInf ? 'inference cost' : isSent ? 'sent' : 'received'}
          </span>
          <span className={`font-mono text-sm font-bold tabular-nums ${amtColor}`}>
            {sign}${amt} {receipt.tokenSymbol !== 'USD' ? receipt.tokenSymbol : 'USD'}
          </span>
        </div>

        {/* rows */}
        <div className="px-3 py-2.5 space-y-2">
          {!isInf && (
            <>
              <TRow l="FROM" v={receipt.from} mono />
              <TRow l="TO" v={receipt.to} mono />
            </>
          )}
          {receipt.service && (
            <TRow l="SERVICE" v={receipt.service} />
          )}
          {receipt.notes && (
            <TRow l="NOTES" v={receipt.notes.slice(0, 60) + (receipt.notes.length > 60 ? '…' : '')} />
          )}
          {receipt.hash && !receipt.hash.startsWith('inference-') && (
            <TRow l="TX" v={`${receipt.hash.slice(0, 12)}…${receipt.hash.slice(-6)}`} mono />
          )}
          {receipt.blockNumber && (
            <TRow l="BLOCK" v={`#${parseInt(receipt.blockNumber).toLocaleString()}`} mono />
          )}
          <TRow l="TIME" v={timeFull} />
        </div>
      </div>
    </div>
  )
}

function TRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-zinc-600 pt-[1px] w-[52px] shrink-0">
        {l}
      </span>
      <span className={`text-[10px] text-zinc-300 leading-snug break-all ${mono ? 'font-mono' : ''}`}>
        {v}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Wrapper — From B — Subtle glow, spring animation
// ─────────────────────────────────────────────────────────────────────────────

interface CardWrapperProps {
  children: React.ReactNode
  type: 'received' | 'sent' | 'inference'
  index: number
  className?: string
  onClick?: () => void
}

function CardWrapper({ children, type, index, className = '', onClick }: CardWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const delay = Math.min(index * 30, 400)

  const glowColors: Record<typeof type, string> = {
    received: 'rgba(34,197,94,0.06)',
    sent: 'rgba(239,68,68,0.06)',
    inference: 'rgba(168,85,247,0.08)',
  }

  const borderColors: Record<typeof type, string> = {
    received: hovered ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.15)',
    sent: hovered ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)',
    inference: hovered ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)',
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-lg border ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
      style={{
        border: `2px solid ${borderColors[type]}`,
        boxShadow: hovered
          ? `0 0 12px ${glowColors[type]}, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`
          : '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: `springIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`,
        backdropFilter: 'blur(4px)',
      }}
    >
      {children}
    </div>
  )
}

// CSS injected once for spring animation
if (typeof document !== 'undefined') {
  if (!document.getElementById('spring-anim')) {
    const style = document.createElement('style')
    style.id = 'spring-anim'
    style.textContent = `
      @keyframes springIn {
        0% { opacity: 0; transform: translateY(8px) scale(0.98); }
        55% { opacity: 1; transform: translateY(-2px) scale(1.005); }
        75% { transform: translateY(1px) scale(0.998); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
    `
    document.head.appendChild(style)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USDC Receipt Card — ~50px compact, narrative text
// ─────────────────────────────────────────────────────────────────────────────

function USDCRow({ receipt, index, nested = false }: { receipt: Receipt; index: number; nested?: boolean }) {
  const [tip, setTip] = useState<TPos | null>(null)
  const isSent = receipt.direction === 'sent'
  const [tShort, tFull] = formatTimestamp(receipt.timestamp)
  const narrative = buildUSDCNarrative(receipt)
  const addr = getCounterpartyAddress(receipt)
  const amt = formatAmount(receipt.amount)
  const sign = isSent ? '−' : '+'

  const type = isSent ? 'sent' : 'received'
  const hoverBg = nested ? 'hover:bg-zinc-800/20' : 'hover:bg-zinc-800/30'
  const padding = nested ? 'pl-8' : 'px-3'

  const onMove = useCallback((e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY }), [])
  const onLeave = useCallback(() => setTip(null), [])

  return (
    <CardWrapper type={type} index={index} className={`${padding} ${hoverBg}`} onClick={nested ? undefined : onLeave}>
      {/* Line 1: icon + narrative + timestamp + badge */}
      <div className={`flex items-center gap-3 ${nested ? 'mt-1' : 'py-2'}`}>
        {/* Colored dot (inside card, not timeline) */}
        <div
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: isSent ? '#ef4444' : '#22c55e' }}
        />
        
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-zinc-100 truncate leading-tight">{narrative}</p>
        </div>
        
        <span
          className="text-xs font-bold tabular-nums text-right shrink-0 w-16"
          style={{ color: isSent ? '#f87171' : '#4ade80' }}
          title={tFull}
        >
          {sign}${amt}
        </span>
        
        <div className="shrink-0">
          <NetworkBadge />
        </div>
      </div>
      
      {/* Line 2: address + tx hash (subtle) */}
      <div className={`flex items-center gap-2 text-[11px] text-zinc-500 mt-1 ${nested ? 'mb-1.5' : 'pb-1'}`}>
        {addr && <span className="font-mono truncate">{addr}</span>}
        {receipt.hash && !receipt.hash.startsWith('inference-') && (
          <>
            <span className="text-zinc-700">·</span>
            <Link
              href={`/receipt/${receipt.hash}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono hover:text-zinc-300 transition-colors"
            >
              {receipt.hash.slice(0, 6)}…
            </Link>
          </>
        )}
      </div>

      {tip && <ReceiptTooltip receipt={receipt} pos={tip} />}
    </CardWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inference Receipt Card — ~50px with model pill, breakdown link
// ─────────────────────────────────────────────────────────────────────────────

function InferenceRow({ receipt, index, nested = false }: { receipt: Receipt; index: number; nested?: boolean }) {
  const [modal, setModal] = useState(false)
  const [tip, setTip] = useState<TPos | null>(null)
  const [tShort, tFull] = formatTimestamp(receipt.timestamp)
  const narrative = buildInferenceNarrative(receipt)
  const model = extractModelName(receipt.service)
  const amt = formatAmount(receipt.amount)

  const clickable = !!receipt.modelInfo
  const hoverBg = nested ? 'hover:bg-violet-900/15' : 'hover:bg-violet-900/20'
  const padding = nested ? 'pl-8' : 'px-3'

  const onMove = useCallback((e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY }), [])
  const onLeave = useCallback(() => setTip(null), [])

  return (
    <>
      <CardWrapper type="inference" index={index} className={`${padding} ${hoverBg}`} onClick={nested ? undefined : onLeave}>
        {/* Line 1: bot icon + narrative + model pill + timestamp */}
        <div className={`flex items-center gap-3 ${nested ? 'mt-1' : 'py-2'}`}>
          {/* Bot icon with gradient */}
          <TxIcon type="inference" className={nested ? 'h-3 w-3' : 'h-4 w-4'} />
          
          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-medium truncate leading-tight ${nested ? 'text-zinc-400' : 'text-zinc-100'}`}>
              {narrative}
            </p>
          </div>
          
          <span
            className="text-xs font-bold tabular-nums text-right shrink-0 w-16 text-purple-300"
            title={tFull}
          >
            ${amt}
          </span>
          
          {/* Model pill */}
          {model && (
            <div
              className="rounded-full px-1.5 py-0.5 text-[9px] font-mono border"
              style={{
                background: 'rgba(168,85,247,0.12)',
                borderColor: 'rgba(168,85,247,0.25)',
                color: '#c084fc',
              }}
            >
              {model}
            </div>
          )}
        </div>
        
        {/* Line 2: breakdown link (only if modelInfo exists) */}
        <div className={`flex items-center gap-2 text-[11px] text-zinc-500 mt-1 ${nested ? 'mb-1.5' : 'pb-1'}`}>
          {clickable && (
            <span
              className="flex items-center gap-1 hover:text-purple-400 transition-colors cursor-pointer"
              onClick={() => setModal(true)}
            >
              <span className="w-3 h-3" style={{ color: '#a855f7' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 3v18M3 12h18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              breakdown
            </span>
          )}
        </div>

        {tip && <ReceiptTooltip receipt={receipt} pos={tip} />}
      </CardWrapper>

      <InferenceModal
        isOpen={modal}
        onClose={() => setModal(false)}
        receipt={
          receipt.modelInfo
            ? {
                timestamp: receipt.timestamp,
                service: receipt.service ?? '',
                amount: receipt.amount,
                modelInfo: receipt.modelInfo,
              }
            : null
        }
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouped Receipt Card — with layers icon, expand/collapse
// ─────────────────────────────────────────────────────────────────────────────

function GroupedRow({ items, index }: { items: { receipts: Receipt[]; isInf: boolean }; index: number }) {
  const [open, setOpen] = useState(false)

  const first = items.receipts[0]
  const total = items.receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const count = items.receipts.length

  const isInf = items.isInf
  const type = isInf ? 'inference' : first.direction === 'sent' ? 'sent' : 'received'
  const sign = type === 'sent' ? '−' : '+'
  const amt = formatAmount(total.toString())

  return (
    <div>
      {/* Summary row */}
      <div
        className={`
          px-3 py-3 rounded-lg cursor-pointer
          ${open ? 'bg-zinc-800/20' : 'hover:bg-zinc-800/30'}
          ${isInf ? 'hover:bg-violet-900/20' : ''}
        `}
        onClick={() => setOpen(v => !v)}
      >
        {/* Line 1: layers icon + narrative + total + timestamp */}
        <div className="flex items-center gap-2 py-1">
          {/* Layers icon with gradient */}
          <TxIcon type="group" className="h-4 w-4" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-100">
              {count} {isInf ? 'calls' : 'transactions'} · {getCounterpartyName(first)} · {sign}${amt}
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-xs font-bold tabular-nums" style={{ color: isInf ? '#c084fc' : type === 'sent' ? '#f87171' : '#4ade80' }}>
              {sign}${amt}
            </span>
            {isInf && <NetworkBadge />}
          </div>
        </div>
        
        {/* Line 2: expand/collapse indicator */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
          <span className="flex items-center gap-0.5">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span>{open ? 'collapse' : `show ${count}`}</span>
          </span>
        </div>
      </div>

      {/* Expanded — indented with subtle left border */}
      {open && (
        <div className="border-l-2 border-zinc-700/25 ml-[36px] pl-3 mt-2 space-y-1.5">
          {items.receipts.map((r, i) => (
            isInf
              ? <InferenceRow key={r.hash} receipt={r} index={i} nested />
              : <USDCRow key={r.hash} receipt={r} index={i} nested />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouping logic — From Original, same signatures
// ─────────────────────────────────────────────────────────────────────────────

type DisplayItem =
  | { kind: 'single'; receipt: Receipt }
  | { kind: 'grouped'; receipts: Receipt[] }
  | { kind: 'grouped-inference'; receipts: Receipt[] }

export function groupReceiptsForDisplay(receipts: Receipt[]): DisplayItem[] {
  const out: DisplayItem[] = []
  let i = 0

  while (i < receipts.length) {
    const r = receipts[i]

    // Group consecutive inference receipts (same task name)
    if (isInferenceReceipt(r)) {
      const tk = extractTaskName(r.service)
      let j = i + 1
      while (
        j < receipts.length &&
        isInferenceReceipt(receipts[j]) &&
        extractTaskName(receipts[j].service) === tk
      ) j++

      if (j - i >= 2) {
        out.push({ kind: 'grouped-inference', receipts: receipts.slice(i, j) })
      } else {
        out.push({ kind: 'single', receipt: r })
      }
      i = j
      continue
    }

    // Group USDC (3+ consecutive, same direction+address)
    const k = groupKey(r)
    let j = i + 1
    while (j < receipts.length) {
      const nxt = receipts[j]
      if (isInferenceReceipt(nxt) || groupKey(nxt) !== k) break
      j++
    }

    if (j - i >= 3) {
      out.push({ kind: 'grouped', receipts: receipts.slice(i, j) })
      i = j
    } else {
      out.push({ kind: 'single', receipt: r })
      i++
    }
  }

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Exports — Same signatures as original
// ─────────────────────────────────────────────────────────────────────────────

/** Single receipt card — renders one receipt directly. */
export function ReceiptCard({
  receipt,
  index = 0,
}: {
  receipt: Receipt
  index?: number
  isFirstInference?: boolean
}) {
  if (isInferenceReceipt(receipt)) return <InferenceRow receipt={receipt} index={index} />
  return <USDCRow receipt={receipt} index={index} />
}

/** Receipt list with automatic grouping. */
export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 overflow-hidden divide-y divide-zinc-800/30">
      {items.length === 0 && (
        <div className="h-10 flex items-center justify-center text-xs text-zinc-600 tabular-nums">
          no transactions
        </div>
      )}

      {items.map((item, idx) => {
        if (item.kind === 'grouped') {
          return <GroupedRow key={item.receipts[0].hash} items={{ receipts: item.receipts, isInf: false }} index={idx} />
        }
        if (item.kind === 'grouped-inference') {
          return <GroupedRow key={item.receipts[0].hash} items={{ receipts: item.receipts, isInf: true }} index={idx} />
        }
        return isInferenceReceipt(item.receipt)
          ? <InferenceRow key={item.receipt.hash} receipt={item.receipt} index={idx} />
          : <USDCRow key={item.receipt.hash} receipt={item.receipt} index={idx} />
      })}
    </div>
  )
}
