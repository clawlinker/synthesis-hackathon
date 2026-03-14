'use client'

import { type Receipt } from '@/app/types'

interface StatsProps {
  receipts: Receipt[]
}

export function ReceiptStats({ receipts }: StatsProps) {
  if (receipts.length === 0) return null

  const sent = receipts.filter(r => r.direction === 'sent')
  const received = receipts.filter(r => r.direction === 'received')
  const totalSent = sent.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const totalReceived = received.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const uniqueAddresses = new Set(
    receipts.map(r => r.direction === 'sent' ? r.to : r.from)
  ).size

  const oldest = receipts[receipts.length - 1]
  const newest = receipts[0]
  const daySpan = oldest && newest
    ? Math.ceil((newest.timestamp - oldest.timestamp) / 86400)
    : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Total Sent"
        value={`$${totalSent.toFixed(2)}`}
        sub={`${sent.length} txs`}
        color="text-red-400"
      />
      <StatCard
        label="Total Received"
        value={`$${totalReceived.toFixed(2)}`}
        sub={`${received.length} txs`}
        color="text-green-400"
      />
      <StatCard
        label="Counterparties"
        value={String(uniqueAddresses)}
        sub="unique addresses"
      />
      <StatCard
        label="Active Period"
        value={`${daySpan}d`}
        sub={`${receipts.length} receipts`}
      />
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string
  value: string
  sub: string
  color?: string
}) {
  return (
    <div className="rounded-lg p-3" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
    }}>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className={`text-lg font-semibold ${color || ''}`}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}
