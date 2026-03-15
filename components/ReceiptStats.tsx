'use client'

import { type Receipt } from '@/app/types'
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

  const totalSent = usdcReceipts
    .filter((r) => r.direction === 'sent')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const totalReceived = usdcReceipts
    .filter((r) => r.direction === 'received')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const inferenceCost = inferenceReceipts
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)

  // Calculate days since first receipt (shows how long agent has been using Molttail)
  // Only use receipts from the last 30 days to avoid stale sample data skewing the number
  const now = Date.now() / 1000
  const recentReceipts = receipts.filter(r => now - r.timestamp < 30 * 86400)
  const earliestInPeriod = recentReceipts.length > 0
    ? Math.min(...recentReceipts.map(r => r.timestamp))
    : now - 86400 // fallback: assume 1 day active if no recent receipts

  const activeDays = Math.max(
    1,
    Math.round((now - earliestInPeriod) / 86400)
  )

  const stats = [
    { label: 'Total Sent', value: `${totalSent.toFixed(2)} USDC`, delay: 0 },
    { label: 'Total Received', value: `${totalReceived.toFixed(2)} USDC`, delay: 75 },
    { label: 'LLM Inference', value: `$${inferenceCost.toFixed(3)}`, delay: 150 },
    { label: 'Active Period', value: `${activeDays}d`, delay: 225 },
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
            <div className="text-lg font-semibold tracking-tight">
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
