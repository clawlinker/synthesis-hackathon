'use client'

import { type Receipt } from '@/app/types'
import { useEffect, useState } from 'react'

export function ReceiptStats({ receipts }: { receipts: Receipt[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [receipts])

  if (receipts.length === 0) return null

  // Separate USDC and inference receipts
  const usdcReceipts = receipts.filter((r) => r.tokenSymbol === 'USDC')
  const inferenceReceipts = receipts.filter((r) => r.tokenSymbol === 'USD')

  const totalSent = usdcReceipts
    .filter((r) => r.direction === 'sent')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const totalReceived = usdcReceipts
    .filter((r) => r.direction === 'received')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const inferenceCost = inferenceReceipts
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const uniqueCounterparties = new Set(
    usdcReceipts.flatMap((r) => [r.from, r.to])
  ).size

  // Calculate active period (simplified - could use actual min/max timestamps)
  const activeDays = Math.max(
    1,
    Math.round(
      (new Date().getTime() / 1000 - Math.min(...receipts.map((r) => r.timestamp))) /
        86400
    )
  )

  const stats = [
    { label: 'Total Sent', value: `${totalSent.toFixed(2)} USDC`, delay: 0 },
    { label: 'Total Received', value: `${totalReceived.toFixed(2)} USDC`, delay: 100 },
    { label: 'LLM Inference', value: `$${inferenceCost.toFixed(3)}`, delay: 200 },
    {
      label: 'Active Period',
      value: `${activeDays}d`,
      delay: 300,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-main)',
            animation: `fadeIn 0.5s ease-out ${stat.delay}ms forwards`,
            animationFillMode: 'forwards',
          }}
        >
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {stat.label}
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}
