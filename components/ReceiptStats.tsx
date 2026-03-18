'use client'

import { type Receipt, AGENT } from '@/app/types'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type BankrBreakdown = {
  total: number
  totalRequests: number
  totalTokens: number
  byModel: Record<string, { cost: number; requests: number; provider: string }>
}

export function ReceiptStats({ receipts, allReceipts }: { receipts: Receipt[]; allReceipts?: Receipt[] }) {
  const [mounted, setMounted] = useState(false)
  const [bankrData, setBankrData] = useState<BankrBreakdown | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [receipts])

  // Fetch Bankr API data for real LLM costs
  useEffect(() => {
    fetch('/api/judge/costs')
      .then((r) => r.json())
      .then((d) => {
        if (d?.breakdown) setBankrData(d.breakdown)
      })
      .catch(() => {})
  }, [])

  if (receipts.length === 0) return null

  const usdcReceipts = receipts.filter((r) => r.tokenSymbol === 'USDC')

  // x402 revenue: USDC received to the x402 wallet only (real earned income)
  const x402Revenue = usdcReceipts
    .filter(
      (r) =>
        r.direction === 'received' &&
        r.to.toLowerCase() === AGENT.wallet.toLowerCase()
    )
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)

  // Total USDC sent on-chain
  const totalSent = usdcReceipts
    .filter((r) => r.direction === 'sent')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)

  const totalReceipts = receipts.length

  // LLM cost: prefer live Bankr API, fallback to onchain inference receipts
  const inferencePool = allReceipts ?? receipts
  const onchainInferenceCost = inferencePool
    .filter((r) => r.receiptType === 'inference')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)

  const llmCost = bankrData?.total ?? onchainInferenceCost
  const llmLabel = bankrData ? 'Total LLM Cost' : 'LLM Payments'
  const llmSub = bankrData
    ? `${bankrData.totalRequests.toLocaleString()} requests · ${Object.keys(bankrData.byModel).length} models`
    : undefined

  const stats: { label: string; value: string; sub?: string; href?: string; accent: string }[] = [
    {
      label: llmLabel,
      value: `$${llmCost.toFixed(2)}`,
      sub: llmSub,
      href: '/costs',
      accent: 'text-zinc-100',
    },
    {
      label: 'On-chain Sent',
      value: `$${totalSent.toFixed(2)}`,
      accent: 'text-zinc-100',
    },
    {
      label: 'x402 Revenue',
      value: `$${x402Revenue.toFixed(2)}`,
      accent: x402Revenue > 0 ? 'text-emerald-400' : 'text-zinc-100',
    },
    {
      label: 'Receipts',
      value: `${totalReceipts}`,
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
        {stats.map((stat, idx) => {
          const inner = (
            <>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                {stat.label}
              </div>
              <div className={`flex items-center gap-1 text-base font-bold ${stat.accent}`}>
                {stat.value}
              </div>
              {stat.sub && (
                <div className="text-[9px] text-zinc-600 mt-0.5">{stat.sub}</div>
              )}
            </>
          )

          return (
            <div
              key={idx}
              className={[
                'py-3 px-4',
                idx % 2 === 1 ? 'border-l border-zinc-800' : '',
                idx >= 2 ? 'border-t border-zinc-800' : '',
                'sm:border-t-0',
                idx > 0 ? 'sm:border-l sm:border-zinc-800' : 'sm:border-l-0',
              ].filter(Boolean).join(' ')}
            >
              {stat.href ? (
                <Link href={stat.href} className="block hover:opacity-80 transition-opacity">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
