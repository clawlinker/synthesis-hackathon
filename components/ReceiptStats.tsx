'use client'

import { type Receipt } from '@/app/types'

export function ReceiptStats({ receipts }: { receipts: Receipt[] }) {
  if (receipts.length === 0) return null

  const totalSent = receipts
    .filter((r) => r.direction === 'sent')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const totalReceived = receipts
    .filter((r) => r.direction === 'received')
    .reduce((acc, r) => acc + parseFloat(r.amount), 0)
  const uniqueCounterparties = new Set(
    receipts.flatMap((r) => [r.from, r.to])
  ).size

  const stats = [
    { label: 'Total Sent', value: `${totalSent.toFixed(2)} USDC` },
    { label: 'Total Received', value: `${totalReceived.toFixed(2)} USDC` },
    { label: 'Counterparties', value: uniqueCounterparties.toString() },
    {
      label: 'Active Period',
      value: '24h' as const,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="p-4 rounded-xl"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-main)',
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
