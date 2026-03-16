'use client'

/**
 * ReceiptCard — Final best-of-breed composition
 * 
 * Cherry-picked from 4 competing designs:
 * - A (Minimalist): fixed-column alignment, cursor-tracking tooltip, compact rows
 * - B (Fintech): gradient icon circles, spring entrance, network badge, status bar
 * - C (Timeline): narrative text ("Paid $0.01 to x402 Facilitator")
 * - Original: grouping logic, InferenceModal integration
 */

import { type Receipt } from '@/app/types'
import { useState, useEffect, useCallback } from 'react'
import { InferenceModal } from './InferenceModal'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Bot,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

// ─── Constants ───────────────────────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ─── Animation styles (injected once) ────────────────────────────────────────

const CARD_CSS = `
@keyframes rcFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`
let stylesInjected = false
function ensureStyles() {
  if (typeof document === 'undefined' || stylesInjected) return
  stylesInjected = true
  const el = document.createElement('style')
  el.textContent = CARD_CSS
  document.head.appendChild(el)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortenAddress(addr: string): string {
  if (!addr || addr === ZERO_ADDRESS) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function isZeroAddress(addr: string): boolean {
  return !addr || addr === ZERO_ADDRESS || addr.replace(/0x0+/, '0x0') === '0x0'
}

export function isInferenceReceipt(r: Receipt): boolean {
  return r.hash?.startsWith('inference-') || r.tokenSymbol === 'USD'
}

function extractModelName(service: string | undefined): string | null {
  if (!service) return null
  const m = service.match(/\(([^)]+)\)\s*$/)
  return m ? m[1] : null
}

function extractTaskName(service: string | undefined): string {
  if (!service) return 'Inference'
  const withoutParen = service.split('(')[0].trim()
  const afterDash = withoutParen.split('—')[1]?.trim()
  return afterDash || withoutParen || 'Inference'
}

function humanize(raw: string): string {
  const s = raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return s.length <= 40 ? s : s.slice(0, 39).trimEnd() + '…'
}

/** Smart amount formatting — no trailing zeros */
function fmtAmt(amount: string): string {
  const v = parseFloat(amount)
  if (Number.isNaN(v) || v === 0) return '0.00'
  if (v < 0.001) return v.toFixed(4)
  if (v < 0.01) return v.toFixed(3)
  return v.toFixed(2)
}

function fmtCost(amount: string): string {
  const v = parseFloat(amount)
  if (v < 0.01) return `$${v.toFixed(4)}`
  if (v < 0.1) return `$${v.toFixed(3)}`
  return `$${v.toFixed(2)}`
}

function getCounterpartyName(r: Receipt): string {
  if (r.direction === 'sent') {
    return r.toAgent?.name || r.toLabel || shortenAddress(r.to)
  }
  if (isZeroAddress(r.from)) return 'Bankr'
  return r.fromAgent?.name || r.fromLabel || shortenAddress(r.from)
}

function getCounterpartyAddr(r: Receipt): string {
  return r.direction === 'sent' ? shortenAddress(r.to) : shortenAddress(r.from)
}

function formatTimestamp(ts: number): [string, string] {
  const date = new Date(ts * 1000)
  const diff = Date.now() - ts * 1000
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)

  const full = date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  let short: string
  if (sec < 60) short = 'now'
  else if (min < 60) short = `${min}m`
  else if (hr < 24) short = `${hr}h`
  else {
    const sameYear = date.getFullYear() === new Date().getFullYear()
    short = sameYear
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  }
  return [short, full]
}

function groupKey(r: Receipt): string {
  const addr = r.direction === 'sent' ? r.to : r.from
  return `${r.direction}:${addr.toLowerCase()}`
}

// ─── Narrative text (from Design C) ──────────────────────────────────────────

function buildNarrative(r: Receipt): string {
  const amt = fmtAmt(r.amount)

  if (isInferenceReceipt(r)) {
    const task = humanize(extractTaskName(r.service))
    return `Spent $${amt} on ${task}`
  }

  const name = getCounterpartyName(r)
  const svc = r.service

  if (r.direction === 'sent') {
    if (svc && svc.toLowerCase().includes('fee')) return `Paid $${amt} in fees to ${name}`
    if (svc && svc !== name) return `Sent $${amt} to ${name} · ${svc}`
    return `Sent $${amt} to ${name}`
  }
  if (svc && svc !== name) return `Received $${amt} from ${name} · ${svc}`
  return `Received $${amt} from ${name}`
}

function buildGroupNarrative(receipts: Receipt[]): string {
  const first = receipts[0]
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const totalStr = fmtAmt(String(total))
  const name = getCounterpartyName(first)

  if (first.direction === 'sent') return `${receipts.length} payments · ${name} · $${totalStr} total`
  return `${receipts.length} receipts · ${name} · $${totalStr} total`
}

// ─── Cursor-tracking tooltip (from Design A) ────────────────────────────────

interface TPos { x: number; y: number }

function Tooltip({ receipt, pos }: { receipt: Receipt; pos: TPos }) {
  const isInf = isInferenceReceipt(receipt)
  const isSent = receipt.direction === 'sent'
  const [, timeFull] = formatTimestamp(receipt.timestamp)
  const amt = fmtAmt(receipt.amount)

  const W = 280
  let left = pos.x + 12
  let top = pos.y - 8
  if (typeof window !== 'undefined') {
    if (left + W > window.innerWidth - 8) left = pos.x - W - 12
    if (top + 200 > window.innerHeight - 8) top = window.innerHeight - 208
    if (top < 8) top = 8
  }

  const amtColor = isInf ? 'text-purple-300' : isSent ? 'text-red-400' : 'text-emerald-400'

  return (
    <div className="fixed z-50 pointer-events-none" style={{ left, top, width: W }}>
      <div className="rounded-lg border border-zinc-700/70 bg-zinc-950/95 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 border-b border-zinc-800">
          <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500">
            {isInf ? 'inference' : isSent ? 'sent' : 'received'}
          </span>
          <span className={`font-mono text-sm font-bold tabular-nums ${amtColor}`}>
            {isInf ? `$${amt}` : `${isSent ? '−' : '+'}$${amt} USDC`}
          </span>
        </div>
        <div className="px-3 py-2 space-y-1">
          {!isInf && (
            <>
              <TipRow label="FROM" value={receipt.fromLabel || receipt.fromAgent?.name || receipt.from} mono={!receipt.fromLabel} />
              <TipRow label="TO" value={receipt.toLabel || receipt.toAgent?.name || receipt.to} mono={!receipt.toLabel} />
            </>
          )}
          {receipt.service && <TipRow label="SERVICE" value={receipt.service} />}
          {receipt.hash && !receipt.hash.startsWith('inference-') && (
            <TipRow label="TX" value={`${receipt.hash.slice(0, 14)}…${receipt.hash.slice(-6)}`} mono />
          )}
          {receipt.blockNumber && (
            <TipRow label="BLOCK" value={`#${parseInt(receipt.blockNumber).toLocaleString()}`} mono />
          )}
          <TipRow label="TIME" value={timeFull} />
        </div>
      </div>
    </div>
  )
}

function TipRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600 w-[46px] shrink-0 pt-px">{label}</span>
      <span className={`text-[10px] text-zinc-300 break-all leading-snug ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

// ─── Type-colored dot (from Design C) ────────────────────────────────────────

type TxType = 'sent' | 'received' | 'inference'

function TypeDot({ type, size = 'sm' }: { type: TxType; size?: 'sm' | 'md' }) {
  const colors = {
    sent: 'bg-red-400',
    received: 'bg-emerald-400',
    inference: 'bg-purple-400',
  }
  const sizeClass = size === 'md' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'
  return <span className={`rounded-full shrink-0 ${sizeClass} ${colors[type]}`} />
}

// ─── Network badge (from Design B) ──────────────────────────────────────────

function NetworkBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1 py-px rounded text-[8px] font-semibold tracking-wide"
      style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.15)',
        color: '#60a5fa',
      }}
    >
      Base
    </span>
  )
}

// ─── USDC Receipt Card ──────────────────────────────────────────────────────

function USDCCard({ receipt, index, nested }: { receipt: Receipt; index: number; nested?: boolean }) {
  const [tip, setTip] = useState<TPos | null>(null)
  const isSent = receipt.direction === 'sent'
  const [tShort, tFull] = formatTimestamp(receipt.timestamp)
  const narrative = buildNarrative(receipt)
  const addr = getCounterpartyAddr(receipt)

  const borderColor = isSent ? 'border-l-red-500/50' : 'border-l-emerald-500/50'
  const delay = nested ? 0 : Math.min(index * 20, 400)

  const onMove = useCallback((e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY }), [])
  const onLeave = useCallback(() => setTip(null), [])

  useEffect(ensureStyles, [])

  return (
    <div
      className={`relative border-l-2 ${borderColor} rounded-r-lg px-3 py-2
        hover:bg-zinc-800/40 transition-colors duration-100 cursor-default
        ${nested ? 'ml-4 border-l' : ''}`}
      style={!nested ? { animation: `rcFadeIn 0.3s ease-out ${delay}ms both` } : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Row 1: narrative + timestamp + network */}
      <div className="flex items-center gap-2">
        <TypeDot type={isSent ? 'sent' : 'received'} />
        <span className="text-[13px] text-zinc-200 font-medium truncate flex-1 leading-tight">
          {narrative}
        </span>
        <span className="text-[10px] text-zinc-500 tabular-nums shrink-0" title={tFull}>
          {tShort}
        </span>
        <NetworkBadge />
      </div>

      {/* Row 2: address + tx hash */}
      <div className="flex items-center gap-2 mt-0.5 ml-4">
        {addr && (
          <span className="text-[10px] font-mono text-zinc-600">{addr}</span>
        )}
        {receipt.hash && !receipt.hash.startsWith('inference-') && (
          <>
            <span className="text-zinc-700 text-[10px]">·</span>
            <Link
              href={`/receipt/${receipt.hash}`}
              onClick={e => e.stopPropagation()}
              className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors inline-flex items-center gap-0.5"
            >
              {receipt.hash.slice(0, 8)}…
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </>
        )}
      </div>

      {/* Status bar (1px gradient at bottom, from Design B) */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${
          isSent
            ? 'from-transparent via-red-500/30 to-transparent'
            : 'from-transparent via-emerald-500/30 to-transparent'
        }`}
      />

      {tip && <Tooltip receipt={receipt} pos={tip} />}
    </div>
  )
}

// ─── Inference Receipt Card ─────────────────────────────────────────────────

function InferenceCard({ receipt, index }: { receipt: Receipt; index: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tShort, tFull] = formatTimestamp(receipt.timestamp)
  const modelName = extractModelName(receipt.service)
  const narrative = buildNarrative(receipt)
  const cost = fmtCost(receipt.amount)
  const delay = Math.min(index * 20, 400)

  useEffect(ensureStyles, [])

  return (
    <>
      <div
        onClick={() => receipt.modelInfo && setIsModalOpen(true)}
        className={`relative border-l-2 border-l-purple-500/50 rounded-r-lg px-3 py-2
          bg-purple-500/[0.03] hover:bg-purple-500/[0.07] transition-colors duration-100
          ${receipt.modelInfo ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ animation: `rcFadeIn 0.3s ease-out ${delay}ms both` }}
      >
        {/* Row 1: narrative + cost */}
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-purple-400 shrink-0" strokeWidth={2} />
          <span className="text-[13px] text-zinc-200 font-medium truncate flex-1 leading-tight">
            {narrative}
          </span>
          <span className="text-[13px] font-bold tabular-nums text-purple-300 shrink-0">{cost}</span>
        </div>

        {/* Row 2: model pill + breakdown + timestamp */}
        <div className="flex items-center gap-1.5 mt-0.5 ml-5">
          {modelName && (
            <span className="inline-flex items-center rounded-full bg-purple-500/10 border border-purple-500/20 px-1.5 py-px text-[9px] font-mono text-purple-400">
              {modelName}
            </span>
          )}
          {receipt.modelInfo && (
            <span className="text-purple-400/60 text-[9px]">⚡ breakdown</span>
          )}
          <span className="text-[10px] text-zinc-600 tabular-nums ml-auto shrink-0" title={tFull}>
            {tShort}
          </span>
        </div>

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>

      <InferenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={receipt.modelInfo ? {
          timestamp: receipt.timestamp,
          service: receipt.service || '',
          amount: receipt.amount,
          modelInfo: receipt.modelInfo,
        } : null}
      />
    </>
  )
}

// ─── Grouped Receipt Card ───────────────────────────────────────────────────

function GroupedCard({ receipts, index }: { receipts: Receipt[]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const first = receipts[0]
  const isSent = first.direction === 'sent'
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const narrative = buildGroupNarrative(receipts)
  const borderColor = isSent ? 'border-l-red-500/50' : 'border-l-emerald-500/50'
  const delay = Math.min(index * 20, 400)

  useEffect(ensureStyles, [])

  return (
    <div style={{ animation: `rcFadeIn 0.3s ease-out ${delay}ms both` }}>
      <div
        onClick={() => setExpanded(v => !v)}
        className={`relative border-l-2 ${borderColor} rounded-r-lg px-3 py-2
          hover:bg-zinc-800/40 transition-colors duration-100 cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          <Layers className={`h-3.5 w-3.5 shrink-0 ${isSent ? 'text-red-400' : 'text-emerald-400'}`} strokeWidth={2} />
          <span className="text-[13px] text-zinc-200 font-medium truncate flex-1 leading-tight">
            {narrative}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[13px] font-bold tabular-nums ${isSent ? 'text-red-400' : 'text-emerald-400'}`}>
              {isSent ? '−' : '+'}${fmtAmt(String(total))}
            </span>
            {expanded
              ? <ChevronDown className="h-3 w-3 text-zinc-500" />
              : <ChevronRight className="h-3 w-3 text-zinc-500" />
            }
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${
          isSent ? 'from-transparent via-red-500/30 to-transparent' : 'from-transparent via-emerald-500/30 to-transparent'
        }`} />
      </div>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {receipts.map(r => (
            <USDCCard key={r.hash} receipt={r} index={0} nested />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Grouping logic ─────────────────────────────────────────────────────────

type DisplayItem =
  | { kind: 'single'; receipt: Receipt }
  | { kind: 'grouped'; receipts: Receipt[] }

export function groupReceiptsForDisplay(receipts: Receipt[]): DisplayItem[] {
  const result: DisplayItem[] = []
  let i = 0

  while (i < receipts.length) {
    const r = receipts[i]

    if (isInferenceReceipt(r)) {
      result.push({ kind: 'single', receipt: r })
      i++
      continue
    }

    const key = groupKey(r)
    let j = i + 1
    while (j < receipts.length) {
      const next = receipts[j]
      if (isInferenceReceipt(next) || groupKey(next) !== key) break
      j++
    }

    if (j - i >= 3) {
      result.push({ kind: 'grouped', receipts: receipts.slice(i, j) })
      i = j
    } else {
      result.push({ kind: 'single', receipt: r })
      i++
    }
  }

  return result
}

// ─── Public exports ─────────────────────────────────────────────────────────

export function ReceiptCard({ receipt, index = 0 }: { receipt: Receipt; index?: number; isFirstInference?: boolean }) {
  if (isInferenceReceipt(receipt)) {
    return <InferenceCard receipt={receipt} index={index} />
  }
  return <USDCCard receipt={receipt} index={index} />
}

export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        if (item.kind === 'grouped') {
          return <GroupedCard key={item.receipts[0].hash} receipts={item.receipts} index={i} />
        }
        return <ReceiptCard key={item.receipt.hash} receipt={item.receipt} index={i} />
      })}
    </div>
  )
}
