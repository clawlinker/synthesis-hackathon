'use client'

import { type Receipt, AGENT } from '@/app/types'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function ReceiptStats({ receipts }: { receipts: Receipt[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [receipts])

  if (receipts.length === 0) return null

  const usdcReceipts = receipts.filter((r) => r.tokenSymbol === 'USDC')
  const inferenceReceipts = receipts.filter((r) => r.tokenSymbol === 'USD')

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
      value: `${x402Revenue.toFixed(2)} USDC`,
      delay: 0,
      accent: x402Revenue > 0 ? 'text-emerald-500' : undefined,
    },
    { label: 'Total Spent', value: `${totalSent.toFixed(2)} USDC`, delay: 75 },
    { label: 'LLM Costs', value: `$${inferenceCost.toFixed(3)}`, delay: 150 },
    { label: 'Receipts', value: `${totalReceipts}`, delay: 225 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          className={`transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ animationDelay: `${stat.delay}ms` }}
        >
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {stat.label}
            </div>
            <div
              className={`text-lg font-semibold tracking-tight ${stat.accent ?? ''}`}
            >
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
