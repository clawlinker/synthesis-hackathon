'use client'

/**
 * ReceiptCard — Production version
 * 
 * Design system: Refactoring UI principles
 * - Constrained spacing scale: 4, 8, 12, 16, 24, 32px
 * - Modular type scale: 12, 14, 16, 20px
 * - Three-level hierarchy: size + weight + color (never all three)
 * - Consistent icon treatment across card types
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
  Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Constants ───────────────────────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ─── Styles (injected once) ─────────────────────────────────────────────────

const CARD_CSS = `
@keyframes rc-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rc-expand {
  from { opacity: 0; transform: scaleY(0.95) translateY(-8px); }
  to   { opacity: 1; transform: scaleY(1) translateY(0); }
}
`
let _styled = false
function injectStyles() {
  if (typeof document === 'undefined' || _styled) return
  _styled = true
  const el = document.createElement('style')
  el.textContent = CARD_CSS
  document.head.appendChild(el)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortenAddr(a: string): string {
  if (!a || a === ZERO_ADDRESS) return ''
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function isZero(a: string): boolean {
  return !a || a === ZERO_ADDRESS || a.replace(/0x0+/, '0x0') === '0x0'
}

export function isInferenceReceipt(r: Receipt): boolean {
  return r.hash?.startsWith('inference-') || r.tokenSymbol === 'USD'
}

function extractTask(svc: string | undefined): string {
  if (!svc) return 'Inference'
  const noParen = svc.split('(')[0].trim()
  const afterDash = noParen.split('—')[1]?.trim()
  return afterDash || noParen || 'Inference'
}

function extractModel(svc: string | undefined): string | null {
  if (!svc) return null
  const m = svc.match(/\(([^)]+)\)\s*$/)
  return m ? m[1] : null
}

function humanize(raw: string): string {
  const s = raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return s.length <= 40 ? s : s.slice(0, 39).trimEnd() + '…'
}

/** Currency formatting — always min 2 decimals, strips unnecessary precision */
function fmtUSD(amount: string): string {
  const v = parseFloat(amount)
  if (Number.isNaN(v) || v === 0) return '0.00'
  if (v < 0.01) return v.toFixed(3)
  return v.toFixed(2)
}

function counterparty(r: Receipt): string {
  if (r.direction === 'sent') return r.toAgent?.name || r.toLabel || shortenAddr(r.to)
  if (isZero(r.from)) return 'Bankr'
  return r.fromAgent?.name || r.fromLabel || shortenAddr(r.from)
}

function counterpartyAddr(r: Receipt): string | null {
  const isSent = r.direction === 'sent'
  const hasName = isSent
    ? !!(r.toAgent?.name || r.toLabel)
    : !!(r.fromAgent?.name || r.fromLabel) && !isZero(r.from)
  if (!hasName) return null
  return shortenAddr(isSent ? r.to : r.from)
}

function fmtTime(ts: number): [string, string] {
  const d = new Date(ts * 1000)
  const diff = Date.now() - ts * 1000
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(min / 60)

  const full = d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  let short: string
  if (min < 1) short = 'now'
  else if (min < 60) short = `${min}m`
  else if (hr < 24) short = `${hr}h`
  else {
    short = d.getFullYear() === new Date().getFullYear()
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  }
  return [short, full]
}

/** Determine inference provider from service/model string */
function inferenceProvider(svc: string | undefined): string {
  if (!svc) return 'LLM Gateway'
  const model = extractModel(svc)?.toLowerCase() || svc.toLowerCase()
  if (model.includes('claude') || model.includes('anthropic')) return 'Anthropic API'
  if (model.includes('gpt') || model.includes('openai')) return 'OpenAI API'
  if (model.includes('gemini') || model.includes('google')) return 'Bankr · Google AI'
  // Default for bankr models (qwen, deepseek, etc.)
  return 'Bankr LLM Gateway'
}

function gKey(r: Receipt): string {
  return `${r.direction}:${(r.direction === 'sent' ? r.to : r.from).toLowerCase()}`
}

// ─── Color tokens ────────────────────────────────────────────────────────────

const COLOR = {
  sent:      { text: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
  received:  { text: '#4ade80', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)' },
  inference: { text: '#c084fc', bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.12)' },
} as const

type TxType = keyof typeof COLOR

// ─── Type icon (consistent 20px across all types) ───────────────────────────

function TypeIcon({ type }: { type: TxType }) {
  const size = 'h-5 w-5'
  const c = COLOR[type].text
  
  switch (type) {
    case 'sent':      return <ArrowUpRight className={size} style={{ color: c }} strokeWidth={2} />
    case 'received':  return <ArrowDownLeft className={size} style={{ color: c }} strokeWidth={2} />
    case 'inference': return <Bot className={size} style={{ color: c }} strokeWidth={1.5} />
  }
}

// ─── Cursor tooltip (detail on hover without navigation) ────────────────────

interface TPos { x: number; y: number }

function Tooltip({ receipt: r, pos }: { receipt: Receipt; pos: TPos }) {
  const isInf = isInferenceReceipt(r)
  const isSent = r.direction === 'sent'
  const [, full] = fmtTime(r.timestamp)
  const amt = fmtUSD(r.amount)

  const W = 300
  let left = pos.x + 14, top = pos.y - 8
  if (typeof window !== 'undefined') {
    if (left + W > window.innerWidth - 8) left = pos.x - W - 14
    if (top + 200 > window.innerHeight - 8) top = window.innerHeight - 208
    if (top < 8) top = 8
  }

  return (
    <div className="fixed z-50 pointer-events-none" style={{ left, top, width: W }}>
      <div className="rounded-lg border border-zinc-700/60 bg-zinc-950/95 shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
            {isInf ? 'inference' : isSent ? 'sent' : 'received'}
          </span>
          <span className="font-mono text-sm font-bold tabular-nums" style={{ color: COLOR[isInf ? 'inference' : isSent ? 'sent' : 'received'].text }}>
            {isInf ? `$${amt}` : `${isSent ? '−' : '+'}$${amt}`}
          </span>
        </div>
        {/* Rows */}
        <div className="px-4 py-3 space-y-1.5">
          {!isInf && <>
            <TR l="FROM" v={r.fromLabel || r.fromAgent?.name || r.from} mono={!r.fromLabel} />
            <TR l="TO" v={r.toLabel || r.toAgent?.name || r.to} mono={!r.toLabel} />
          </>}
          {r.service && <TR l="SERVICE" v={r.service} />}
          {r.hash && !r.hash.startsWith('inference-') && (
            <TR l="TX" v={`${r.hash.slice(0, 14)}…${r.hash.slice(-6)}`} mono />
          )}
          {r.blockNumber && <TR l="BLOCK" v={`#${parseInt(r.blockNumber).toLocaleString()}`} mono />}
          <TR l="TIME" v={full} />
        </div>
      </div>
    </div>
  )
}

function TR({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-600 w-14 shrink-0 pt-px">{l}</span>
      <span className={`text-xs text-zinc-300 break-all leading-snug ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  )
}

// ─── Receipt Paper (thermal receipt detail view) ────────────────────────────

function ReceiptPaper({ receipt: r, onClose }: { receipt: Receipt; onClose: () => void }) {
  const isInf = isInferenceReceipt(r)
  const isSent = r.direction === 'sent'
  const [, full] = fmtTime(r.timestamp)
  const amt = fmtUSD(r.amount)
  const sign = isSent ? '−' : '+'
  const type: TxType = isInf ? 'inference' : isSent ? 'sent' : 'received'

  const Divider = () => (
    <div className="my-3 border-t border-dashed border-zinc-700/50" />
  )

  return (
    <div
      className="mx-auto max-w-sm overflow-hidden origin-top"
      style={{ animation: 'rc-expand 0.3s ease-out both' }}
    >
      {/* Perforated top edge */}
      <div className="flex justify-center gap-[3px] py-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-zinc-800" />
        ))}
      </div>

      <div className="bg-zinc-950/90 border-x border-zinc-800/40 px-8 py-6 font-mono text-center">
        {/* Header */}
        <p className="text-zinc-100 text-lg font-bold tracking-[0.2em] uppercase">
          {isInf ? 'LLM Inference' : 'Clawlinker'}
        </p>
        <p className="text-zinc-500 text-xs mt-1 tracking-wide">
          {isInf ? inferenceProvider(r.service) : 'Base Network · USDC'}
        </p>
        <p className="text-zinc-600 text-[10px] mt-0.5 tracking-wider">
          ERC-8004 #22945
        </p>

        <Divider />

        {/* Details */}
        <div className="text-left space-y-2 text-sm">
          {!isInf ? (
            <>
              <RRow label="From" value={r.fromLabel || r.fromAgent?.name || shortenAddr(r.from)} />
              <RRow label="To" value={r.toLabel || r.toAgent?.name || shortenAddr(r.to)} />
              {r.service && <RRow label="Service" value={r.service} />}
            </>
          ) : (
            <>
              <RRow label="Task" value={humanize(extractTask(r.service))} />
              {extractModel(r.service) && <RRow label="Model" value={extractModel(r.service)!} />}
            </>
          )}
          <RRow label="Date" value={full} />
        </div>

        <Divider />

        {/* Amount — hero element */}
        <div className="py-4">
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.25em]">
            {isInf ? 'Cost' : isSent ? 'Sent' : 'Received'}
          </p>
          <p className="text-3xl font-bold mt-2 tabular-nums tracking-tight" style={{ color: COLOR[type].text }}>
            {isInf ? '' : sign}${amt}
          </p>
          <p className="text-zinc-600 text-xs mt-1 tracking-widest">
            {isInf ? 'USD' : 'USDC'}
          </p>
        </div>

        <Divider />

        {/* Reference */}
        <div className="text-left space-y-2 text-sm">
          {r.hash && !r.hash.startsWith('inference-') && (
            <>
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-zinc-500 shrink-0 text-xs">Tx</span>
                <a
                  href={`https://basescan.org/tx/${r.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-right font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
                >
                  {r.hash.slice(0, 10)}…{r.hash.slice(-8)} ↗
                </a>
              </div>
              {r.blockNumber && (
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-zinc-500 shrink-0 text-xs">Block</span>
                  <a
                    href={`https://basescan.org/block/${r.blockNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-right font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    #{parseInt(r.blockNumber).toLocaleString()} ↗
                  </a>
                </div>
              )}
            </>
          )}
          {r.hash && !r.hash.startsWith('inference-') ? (
            <>
              <RRow label="Status" value="✓ ON-CHAIN" highlight />
              <RRow label="Network" value="Base (8453)" />
            </>
          ) : (
            <>
              <RRow label="Source" value="Agent Execution Log" />
              <RRow label="Provider" value={inferenceProvider(r.service)} />
            </>
          )}
        </div>

        <Divider />

        {/* Footer */}
        <p className="text-zinc-600 text-[10px] leading-relaxed tracking-wide">
          {r.hash && !r.hash.startsWith('inference-')
            ? 'Verified on-chain · clawlinker.eth'
            : 'Logged by agent · clawlinker.eth'}
        </p>

        {/* Action buttons */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {r.hash && !r.hash.startsWith('inference-') && (
            <Link
              href={`/receipt/${r.hash}`}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-1.5 text-xs text-usdc hover:text-zinc-100 border border-usdc/30 hover:border-usdc/60 hover:bg-usdc/5 rounded-full transition-all duration-200"
            >
              View Receipt →
            </Link>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="px-4 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-full transition-all duration-200"
          >
            ▲ collapse
          </button>
        </div>
      </div>

      {/* Perforated bottom edge */}
      <div className="flex justify-center gap-[3px] py-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-zinc-800" />
        ))}
      </div>
    </div>
  )
}

function RRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-zinc-500 shrink-0 text-xs">{label}</span>
      <span className={`text-right break-all ${highlight ? 'text-emerald-400 font-medium' : 'text-zinc-200'}`}>{value}</span>
    </div>
  )
}

// ─── USDC Card ──────────────────────────────────────────────────────────────

function USDCCard({ receipt: r, index, nested, defaultExpanded }: { receipt: Receipt; index: number; nested?: boolean; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false)
  const [tip, setTip] = useState<TPos | null>(null)
  const isSent = r.direction === 'sent'
  const type: TxType = isSent ? 'sent' : 'received'
  const [tShort, tFull] = fmtTime(r.timestamp)
  const name = counterparty(r)
  const addr = counterpartyAddr(r)
  const amt = fmtUSD(r.amount)
  const sign = isSent ? '−' : '+'
  const svc = r.service && r.service.toLowerCase() !== name.toLowerCase() ? r.service : null

  const delay = nested ? 0 : Math.min(index * 25, 400)
  const onMove = useCallback((e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY }), [])
  const onLeave = useCallback(() => setTip(null), [])

  useEffect(injectStyles, [])

  if (expanded && !nested) {
    return (
      <div className="py-2 px-3" style={{ animation: 'rc-expand 0.3s ease-out both' }}>
        <ReceiptPaper receipt={r} onClose={() => setExpanded(false)} />
      </div>
    )
  }

  // Mini receipt stub — compact but with receipt character
  return (
    <div
      className={`relative cursor-pointer group
        ${nested ? 'py-1.5 px-2' : 'py-2 px-3'}`}
      style={!nested ? { animation: `rc-fade 0.25s ease-out ${delay}ms both` } : undefined}
      onClick={!nested ? () => setExpanded(true) : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800/40 group-hover:border-zinc-700/60 transition-colors duration-150"
        style={{ background: 'rgba(24,24,27,0.5)' }}
      >
        {/* Left: dashed receipt edge + icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-px h-8 border-l border-dashed" style={{ borderColor: COLOR[type].text + '40' }} />
          <div
            className="h-7 w-7 rounded flex items-center justify-center"
            style={{ background: COLOR[type].bg }}
          >
            <TypeIcon type={type} />
          </div>
        </div>

        {/* Middle: name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{name}</p>
          <p className="text-[11px] text-zinc-500 truncate mt-px font-mono">
            {svc ? svc : addr ? addr : ''}
            {tShort && <span className="text-zinc-600"> · {tShort}</span>}
          </p>
        </div>

        {/* Right: amount in receipt style */}
        <div className="shrink-0 text-right font-mono">
          <p className="text-sm font-bold tabular-nums" style={{ color: COLOR[type].text }}>
            {sign}${amt}
          </p>
          <p className="text-[10px] text-zinc-600 mt-px">USDC</p>
        </div>
      </div>

      {tip && <Tooltip receipt={r} pos={tip} />}
    </div>
  )
}

// ─── Inference Card ─────────────────────────────────────────────────────────

function InferenceCard({ receipt: r, index, nested, defaultExpanded }: { receipt: Receipt; index: number; nested?: boolean; defaultExpanded?: boolean }) {
  const [modal, setModal] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded || false)
  const [tShort, tFull] = fmtTime(r.timestamp)
  const task = humanize(extractTask(r.service))
  const model = extractModel(r.service)
  const amt = fmtUSD(r.amount)
  const hasBreakdown = !!r.modelInfo

  const delay = nested ? 0 : Math.min(index * 25, 400)

  useEffect(injectStyles, [])

  if (expanded && !nested) {
    return (
      <div className="py-2 px-3" style={{ animation: 'rc-expand 0.3s ease-out both' }}>
        <ReceiptPaper receipt={r} onClose={() => setExpanded(false)} />
      </div>
    )
  }

  // Mini receipt stub — inference variant
  return (
    <>
      <div
        onClick={() => !nested ? setExpanded(true) : hasBreakdown && setModal(true)}
        className={`relative group
          ${!nested || hasBreakdown ? 'cursor-pointer' : 'cursor-default'}
          ${nested ? 'py-1.5 px-2' : 'py-2 px-3'}`}
        style={!nested ? { animation: `rc-fade 0.25s ease-out ${delay}ms both` } : undefined}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-purple-500/10 group-hover:border-purple-500/25 transition-colors duration-150"
          style={{ background: 'rgba(168,85,247,0.03)' }}
        >
          {/* Left: dashed edge + icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-px h-8 border-l border-dashed border-purple-500/30" />
            <div
              className="h-7 w-7 rounded flex items-center justify-center"
              style={{ background: COLOR.inference.bg }}
            >
              <TypeIcon type="inference" />
            </div>
          </div>

          {/* Middle: task + model */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{task}</p>
            <p className="text-[11px] text-zinc-500 truncate mt-px font-mono">
              {model || 'inference'}
              <span className="text-zinc-600"> · {tShort}</span>
            </p>
          </div>

          {/* Right: cost in receipt style */}
          <div className="shrink-0 text-right font-mono">
            <p className="text-sm font-bold tabular-nums" style={{ color: COLOR.inference.text }}>
              ${amt}
            </p>
            <p className="text-[10px] text-zinc-600 mt-px">USD</p>
          </div>
        </div>
      </div>

      <InferenceModal
        isOpen={modal}
        onClose={() => setModal(false)}
        receipt={r.modelInfo ? {
          timestamp: r.timestamp,
          service: r.service ?? '',
          amount: r.amount,
          modelInfo: r.modelInfo,
        } : null}
      />
    </>
  )
}

// ─── Grouped Card ───────────────────────────────────────────────────────────

function GroupedCard({ receipts, isInf, index }: { receipts: Receipt[]; isInf: boolean; index: number }) {
  const [open, setOpen] = useState(false)
  const first = receipts[0]
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount), 0)
  const count = receipts.length
  const type: TxType = isInf ? 'inference' : first.direction === 'sent' ? 'sent' : 'received'
  const name = counterparty(first)
  const sign = type === 'sent' ? '−' : '+'
  const amt = fmtUSD(String(total))

  const delay = Math.min(index * 25, 400)

  useEffect(injectStyles, [])

  return (
    <div className="py-2 px-3" style={{ animation: `rc-fade 0.25s ease-out ${delay}ms both` }}>
      <div
        className="cursor-pointer group"
        onClick={() => setOpen(v => !v)}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800/40 group-hover:border-zinc-700/60 transition-colors duration-150"
          style={{ background: 'rgba(24,24,27,0.5)' }}
        >
          {/* Left: dashed edge + layers icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-px h-8 border-l border-dashed" style={{ borderColor: COLOR[type].text + '40' }} />
            <div className="h-7 w-7 rounded flex items-center justify-center" style={{ background: COLOR[type].bg }}>
              <Layers className="h-4 w-4" style={{ color: COLOR[type].text }} strokeWidth={1.5} />
            </div>
          </div>

          {/* Middle */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">
              {count} {isInf ? 'calls' : 'payments'} · {name}
            </p>
            <p className="text-[11px] text-zinc-500 mt-px flex items-center gap-1 font-mono">
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {open ? 'collapse' : `show ${count}`}
            </p>
          </div>

          {/* Right: total */}
          <div className="shrink-0 text-right font-mono">
            <p className="text-sm font-bold tabular-nums" style={{ color: COLOR[type].text }}>
              {sign}${amt}
            </p>
            <p className="text-[10px] text-zinc-600 mt-px">total</p>
          </div>
        </div>
      </div>

      {open && (
        <div className="ml-6 mt-1 space-y-0">
          {receipts.map((r, i) => (
            isInf
              ? <InferenceCard key={r.hash} receipt={r} index={i} nested />
              : <USDCCard key={r.hash} receipt={r} index={i} nested />
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
  | { kind: 'grouped-inference'; receipts: Receipt[] }

export function groupReceiptsForDisplay(receipts: Receipt[]): DisplayItem[] {
  const out: DisplayItem[] = []
  let i = 0

  while (i < receipts.length) {
    const r = receipts[i]

    if (isInferenceReceipt(r)) {
      const tk = extractTask(r.service)
      let j = i + 1
      while (j < receipts.length && isInferenceReceipt(receipts[j]) && extractTask(receipts[j].service) === tk) j++
      out.push(j - i >= 2
        ? { kind: 'grouped-inference', receipts: receipts.slice(i, j) }
        : { kind: 'single', receipt: r })
      i = j
      continue
    }

    const k = gKey(r)
    let j = i + 1
    while (j < receipts.length && !isInferenceReceipt(receipts[j]) && gKey(receipts[j]) === k) j++
    out.push(j - i >= 3
      ? { kind: 'grouped', receipts: receipts.slice(i, j) }
      : { kind: 'single', receipt: r })
    i = j
  }

  return out
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function ReceiptCard({ receipt, index = 0, defaultExpanded }: { receipt: Receipt; index?: number; isFirstInference?: boolean; defaultExpanded?: boolean }) {
  return isInferenceReceipt(receipt)
    ? <InferenceCard receipt={receipt} index={index} defaultExpanded={defaultExpanded} />
    : <USDCCard receipt={receipt} index={index} defaultExpanded={defaultExpanded} />
}

export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const items = groupReceiptsForDisplay(receipts)

  return (
    <div className="space-y-0">
      {items.length === 0 && (
        <div className="py-8 text-center text-sm text-zinc-600">No transactions</div>
      )}
      {items.map((item, idx) => {
        const isFirst = idx === 0
        if (item.kind === 'grouped')
          return <GroupedCard key={item.receipts[0].hash} receipts={item.receipts} isInf={false} index={idx} />
        if (item.kind === 'grouped-inference')
          return <GroupedCard key={item.receipts[0].hash} receipts={item.receipts} isInf index={idx} />
        return <ReceiptCard key={item.receipt.hash} receipt={item.receipt} index={idx} defaultExpanded={isFirst} />
      })}
    </div>
  )
}
