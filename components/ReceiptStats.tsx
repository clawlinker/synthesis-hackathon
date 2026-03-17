'use client'

import { type Receipt, AGENT } from '@/app/types'
import { useEffect, useState } from 'react'

export function ReceiptStats({ receipts, allReceipts }: { receipts: Receipt[]; allReceipts?: Receipt[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [receipts])

  if (receipts.length === 0) return null

  const usdcReceipts = receipts.filter((r) => r.tokenSymbol === 'USDC')
  // Use allReceipts for inference cost so LLM Costs always reflects reality,
  // even when the inference toggle is off in the feed.
  const inferencePool = allReceipts ?? receipts
  const inferenceReceipts = inferencePool.filter((r) => r.tokenSymbol === 'USD')

  // x402 revenue: USDC received to the x402 wallet only (real earned income)
  const x402Revenue = usdcReceipts
    .filter(
      (r) =>
        r.direction === 'received' &&
        r.to.toLowerCase() === AGENT.wallet.toLowerCase()
    )
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)

  const totalSent = usdcReceipts
    .filter((r) => r.direction === 'sent')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)

  const inferenceCost = inferenceReceipts.reduce(
    (acc, r) => acc + parseFloat(r.amount),
    0
  )

  const totalReceipts = receipts.length

  const stats = [
    {
      label: 'x402 Revenue',
      value: `$${x402Revenue.toFixed(2)}`,
      trend: x402Revenue > 0 ? 'up' : null,
      accent: x402Revenue > 0 ? 'text-emerald-400' : 'text-zinc-100',
    },
    {
      label: 'Total Sent',
      value: `$${totalSent.toFixed(2)}`,
      trend: 'neutral' as const,
      accent: 'text-zinc-100',
    },
    {
      label: 'LLM Costs',
      value: `$${inferenceCost.toFixed(3)}`,
      trend: null,
      accent: 'text-zinc-100',
    },
    {
      label: 'Receipts',
      value: `${totalReceipts}`,
      trend: null,
      accent: 'text-zinc-100',
    },
  ]

  return (
    <div
      className={`mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm transition-all duration-500 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Desktop: single row | Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={[
              'py-3 px-4',
              // Mobile: right column gets a left border
              idx % 2 === 1 ? 'border-l border-zinc-800' : '',
              // Mobile: bottom row gets a top border
              idx >= 2 ? 'border-t border-zinc-800' : '',
              // Desktop: only left borders between columns, no top borders
              'sm:border-t-0',
              idx > 0 ? 'sm:border-l sm:border-zinc-800' : 'sm:border-l-0',
            ].filter(Boolean).join(' ')}
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
              {stat.label}
            </div>
            <div className={`flex items-center gap-1 text-base font-bold ${stat.accent}`}>
              {stat.value}
              {stat.trend === 'up' && (
                <svg
                  className="w-3 h-3 text-emerald-400 shrink-0"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 2L10 7H2L6 2Z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {stat.trend === 'neutral' && (
                <svg
                  className="w-3 h-3 text-zinc-500 shrink-0"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6H10M2 6L5 3M2 6L5 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
