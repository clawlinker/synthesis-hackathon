'use client'

/**
 * ReceiptCard-A — MINIMALIST DATA-DENSE design
 *
 * Philosophy: Bloomberg Terminal meets modern dark UI.
 * - Single-line rows (~40px). Amount column fixed-width, right-aligned.
 * - Tabular-nums + monospace for all numbers/addresses.
 * - Red/green on amounts ONLY. Purple for inference. Everything else zinc.
 * - Grouped rows collapse to "×N  Name  −$total" with chevron expand.
 * - Hover shows a fixed tooltip with full tx details — no page navigation.
 * - Zero load animations. Instant render.
 */

import { type Receipt } from '@/app/types'
import { useState, useCallback } from 'react'
import { InferenceModal } from './InferenceModal'
import { ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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

function formatAmt(amount: string): string {
  const v = parseFloat(amount)
  if (v < 0.001) return v.toFixed(6)
  if (v < 0.01)  return v.toFixed(4)
  if (v < 0.1)   return v.toFixed(3)
  return v.toFixed(2)
}

function formatTimestamp(ts: number): [string, string] {
  const date  = new Date(ts * 1000)
  const diff  = Date.now() - ts * 1000
  const sec   = Math.floor(diff / 1000)
  const min   = Math.floor(sec  / 60)
  const hour  = Math.floor(min  / 60)

  const full  = date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  let short: string
  if (sec  < 60)   short = 'now'
  else if (min  < 60)   short = `${min}m`
  else if (hour < 24)   short = `${hour}h`
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

// ─────────────────────────────────────────────────────────────────────────────
// Hover Tooltip — fixed position, follows cursor, pointer-events-none
// ─────────────────────────────────────────────────────────────────────────────

interface TPos { x: number; y: number }

function ReceiptTooltip({ receipt, pos }: { receipt: Receipt; pos: TPos }) {
  const isInf  = isInferenceReceipt(receipt)
  const isSent = receipt.direction === 'sent'
  const [, timeFull] = formatTimestamp(receipt.timestamp)
  const amt    = formatAmt(receipt.amount)
  const sign   = isInf ? '' : isSent ? '−' : '+'

  const W  = 300
  const H  = 220
  let left = pos.x + 14
  let top  = pos.y - 10

  if (typeof window !== 'undefined') {
    if (left + W > window.innerWidth  - 8) left = pos.x - W - 14
    if (top  + H > window.innerHeight - 8) top  = window.innerHeight - H - 8
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
        <div className="px-3 py-2.5 space-y-[5px]">
          {!isInf && (
            <>
              <TRow l="FROM" v={receipt.from} mono />
              <TRow l="TO"   v={receipt.to}   mono />
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
// Row primitives — shared layout columns
//
//  [AMT  88px right] [MAIN flex-1] [TIME 52px right] [AUX 60px right]
// ─────────────────────────────────────────────────────────────────────────────

const ROW_BASE =
  'relative flex items-center h-10 px-3 gap-3 border-b border-zinc-800/40 last:border-0 transition-colors duration-75 cursor-default'

const NESTED_STYLE = 'pl-8 bg-zinc-900/20'

// ─────────────────────────────────────────────────────────────────────────────
// USDC Row
// ─────────────────────────────────────────────────────────────────────────────

function USDCRow({ receipt, nested = false }: { receipt: Receipt; nested?: boolean }) {
  const [tip, setTip] = useState<TPos | null>(null)

  const isSent = receipt.direction === 'sent'
  const name   = getCounterpartyName(receipt)
  const svc    = receipt.service ?? null
  const amt    = formatAmt(receipt.amount)
  const sign   = isSent ? '−' : '+'
  const [tShort, tFull] = formatTimestamp(receipt.timestamp)

  const amtColor  = isSent ? 'text-red-400' : 'text-emerald-400'
  const hoverBg   = 'hover:bg-zinc-800/40'

  const onMove  = useCallback((e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY }), [])
  const onLeave = useCallback(() => setTip(null), [])

  return (
    <div
      className={`${ROW_BASE} ${hoverBg} ${nested ? NESTED_STYLE : ''}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* ① Amount — fixed width, right-aligned, tabular monospace */}
      <span className={`font-mono text-sm font-bold tabular-nums w-[88px] text-right shrink-0 ${amtColor}`}>
        {sign}${amt}
      </span>

      {/* ② Main — counterparty · service */}
      <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
        <span className="text-zinc-200 text-xs font-semibold truncate shrink-0 max-w-[200px]">
          {name}
        </span>
        {svc && (
          <>
            <span className="text-zinc-700 text-xs shrink-0 select-none">·</span>
            <span className="text-zinc-500 text-[11px] truncate leading-none">{svc}</span>
          </>
        )}
      </div>

      {/* ③ Timestamp */}
      <span
        className="text-zinc-600 text-[11px] tabular-nums w-[52px] text-right shrink-0"
        title={tFull}
      >
        {tShort}
      </span>

      {/* ④ Aux — tx hash link */}
      <span className="w-[60px] shrink-0 text-right">
        {receipt.hash && !receipt.hash.startsWith('inference-') && (
          <Link
            href={`/receipt/${receipt.hash}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors"
          >
            {receipt.hash.slice(0, 6)}…
          </Link>
        )}
      </span>

      {tip && <ReceiptTooltip receipt={receipt} pos={tip} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inference Row
// ─────────────────────────────────────────────────────────────────────────────

function InferenceRow({ receipt, nested = false }: { receipt: Receipt; nested?: boolean }) {
  const [modal, setModal]   = useState(false)
  const [tip,   setTip]     = useState<TPos | null>(null)

  const raw   = extractTaskName(receipt.service)
  const task  = humanizeTaskName(raw)
  const model = extractModelName(receipt.service)
  const amt   = formatAmt(receipt.amount)
  const [tShort, tFull] = formatTimestamp(receipt.timestamp)

  const clickable = !!receipt.modelInfo
  const onMove    = useCallback((e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY }), [])
  const onLeave   = useCallback(() => setTip(null), [])

  return (
    <>
      <div
        className={`
          ${ROW_BASE} hover:bg-violet-950/25 group
          ${nested ? NESTED_STYLE : ''}
          ${clickable ? 'cursor-pointer' : ''}
        `}
        onClick={() => clickable && setModal(true)}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {/* ① Amount */}
        <span className="font-mono text-sm font-bold tabular-nums w-[88px] text-right shrink-0 text-purple-400">
          ${amt}
        </span>

        {/* ② Main — task · model */}
        <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
          <span className="text-zinc-200 text-xs font-semibold truncate shrink-0 max-w-[200px]">
            {task}
          </span>
          {model && (
            <>
              <span className="text-zinc-700 text-xs shrink-0 select-none">·</span>
              <span className="font-mono text-zinc-500 text-[10px] truncate leading-none">{model}</span>
            </>
          )}
        </div>

        {/* ③ Timestamp */}
        <span
          className="text-zinc-600 text-[11px] tabular-nums w-[52px] text-right shrink-0"
          title={tFull}
        >
          {tShort}
        </span>

        {/* ④ Aux — breakdown hint */}
        <span className="w-[60px] shrink-0 text-right">
          {clickable && (
            <span className="font-mono text-[10px] text-purple-600/50 group-hover:text-purple-400/80 transition-colors">
              detail
            </span>
          )}
        </span>

        {tip && <ReceiptTooltip receipt={receipt} pos={tip} />}
      </div>

      <InferenceModal
        isOpen={modal}
        onClose={() => setModal(false)}
        receipt={
          receipt.modelInfo
            ? {
                timestamp: receipt.timestamp,
                service:   receipt.service ?? '',
                amount:    receipt.amount,
                modelInfo: receipt.modelInfo,
              }
            : null
        }
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouped USDC Row — "×N  Name · svc  −$total  ▶"
// ─────────────────────────────────────────────────────────────────────────────

function GroupedUSDCRow({ receipts }: { receipts: Receipt[] }) {
  const [open, setOpen] = useState(false)

  const first  = receipts[0]
  const isSent = first.direction === 'sent'
  const name   = getCounterpartyName(first)
  const svc    = first.service ?? null
  const total  = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const tStr   = formatAmt(total.toString())
  const sign   = isSent ? '−' : '+'
  const cnt    = receipts.length
  const amtColor = isSent ? 'text-red-400' : 'text-emerald-400'

  return (
    <div>
      {/* summary row */}
      <div
        className={`
          ${ROW_BASE} cursor-pointer
          hover:bg-zinc-800/40
          ${open ? 'bg-zinc-800/20' : ''}
        `}
        onClick={() => setOpen(v => !v)}
      >
        {/* ① Amount total */}
        <span className={`font-mono text-sm font-bold tabular-nums w-[88px] text-right shrink-0 ${amtColor}`}>
          {sign}${tStr}
        </span>

        {/* ② Count + name + service */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          <span className="font-mono text-xs text-zinc-500 tabular-nums shrink-0">×{cnt}</span>
          <span className="text-zinc-200 text-xs font-semibold truncate shrink-0 max-w-[180px]">
            {name}
          </span>
          {svc && (
            <>
              <span className="text-zinc-700 text-xs shrink-0 select-none">·</span>
              <span className="text-zinc-500 text-[11px] truncate leading-none">{svc}</span>
            </>
          )}
        </div>

        {/* ③ empty time col */}
        <span className="w-[52px] shrink-0" />

        {/* ④ chevron */}
        <span className="w-[60px] shrink-0 flex justify-end pr-0.5">
          {open
            ? <ChevronDown  className="h-3 w-3 text-zinc-500" />
            : <ChevronRight className="h-3 w-3 text-zinc-600" />
          }
        </span>
      </div>

      {/* expanded — indented with left accent bar */}
      {open && (
        <div className="border-l-2 border-zinc-700/25 ml-[112px]">
          {receipts.map(r => (
            <USDCRow key={r.hash} receipt={r} nested />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouped Inference Row — "×N  Task Name  $total  ▶"
// ─────────────────────────────────────────────────────────────────────────────

function GroupedInferenceRow({ receipts }: { receipts: Receipt[] }) {
  const [open, setOpen] = useState(false)

  const first = receipts[0]
  const raw   = extractTaskName(first.service)
  const task  = humanizeTaskName(raw)
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const tStr  = formatAmt(total.toString())
  const cnt   = receipts.length

  return (
    <div>
      {/* summary row */}
      <div
        className={`
          ${ROW_BASE} cursor-pointer
          hover:bg-violet-950/25
          ${open ? 'bg-violet-950/15' : ''}
        `}
        onClick={() => setOpen(v => !v)}
      >
        {/* ① Amount total */}
        <span className="font-mono text-sm font-bold tabular-nums w-[88px] text-right shrink-0 text-purple-400">
          ${tStr}
        </span>

        {/* ② Count + task */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          <span className="font-mono text-xs text-zinc-500 tabular-nums shrink-0">×{cnt}</span>
          <span className="text-zinc-200 text-xs font-semibold truncate">{task}</span>
        </div>

        {/* ③ empty */}
        <span className="w-[52px] shrink-0" />

        {/* ④ chevron */}
        <span className="w-[60px] shrink-0 flex justify-end pr-0.5">
          {open
            ? <ChevronDown  className="h-3 w-3 text-zinc-500" />
            : <ChevronRight className="h-3 w-3 text-zinc-600" />
          }
        </span>
      </div>

      {/* expanded */}
      {open && (
        <div className="border-l-2 border-purple-800/25 ml-[112px]">
          {receipts.map(r => (
            <InferenceRow key={r.hash} receipt={r} nested />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouping logic (identical semantics to ReceiptCard.tsx)
// ─────────────────────────────────────────────────────────────────────────────

type DisplayItem =
  | { kind: 'single';           receipt:  Receipt   }
  | { kind: 'grouped';          receipts: Receipt[] }
  | { kind: 'grouped-inference';receipts: Receipt[] }

export function groupReceiptsForDisplay(receipts: Receipt[]): DisplayItem[] {
  const out: DisplayItem[] = []
  let i = 0

  while (i < receipts.length) {
    const r = receipts[i]

    // ── Inference grouping (consecutive, same task) ──
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
        i = j
      } else {
        out.push({ kind: 'single', receipt: r })
        i++
      }
      continue
    }

    // ── USDC grouping (3+ consecutive, same direction+address) ──
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
// Public exports
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
  if (isInferenceReceipt(receipt)) return <InferenceRow receipt={receipt} />
  return <USDCRow receipt={receipt} />
}

/** Receipt list with automatic grouping. */
export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 overflow-hidden divide-y-0">
      {items.length === 0 && (
        <div className="h-10 flex items-center justify-center text-xs text-zinc-600 tabular-nums">
          no transactions
        </div>
      )}

      {items.map((item, idx) => {
        if (item.kind === 'grouped') {
          return (
            <GroupedUSDCRow
              key={item.receipts[0].hash}
              receipts={item.receipts}
            />
          )
        }
        if (item.kind === 'grouped-inference') {
          return (
            <GroupedInferenceRow
              key={item.receipts[0].hash}
              receipts={item.receipts}
            />
          )
        }
        if (isInferenceReceipt(item.receipt)) {
          return <InferenceRow key={item.receipt.hash} receipt={item.receipt} />
        }
        return <USDCRow key={item.receipt.hash} receipt={item.receipt} />
      })}
    </div>
  )
}
