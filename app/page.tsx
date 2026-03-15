'use client'

import { useEffect, useState } from 'react'
import { type Receipt } from '@/app/types'
import { ReceiptCard } from '@/components/ReceiptCard'
import { AgentHeader } from '@/components/AgentHeader'
import { ReceiptStats } from '@/components/ReceiptStats'

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [source, setSource] = useState<string>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch('/api/receipts')
        const data = await res.json()
        setReceipts(data.receipts)
        setSource(data.source)
      } catch (err) {
        setError('Failed to load receipts')
        console.error(err)
      }
    }
    fetchReceipts()
    const interval = setInterval(fetchReceipts, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <AgentHeader receiptCount={receipts.length} source={source} />

      {error && (
        <div className="text-red-400 text-center py-8">{error}</div>
      )}

      {source === 'loading' && (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Loading receipts…
        </div>
      )}

      <ReceiptStats receipts={receipts} />

      <div className="space-y-3">
        {receipts.map((receipt) => (
          <ReceiptCard key={receipt.hash} receipt={receipt} />
        ))}
      </div>

      {receipts.length > 0 && (
        <footer className="text-center text-xs mt-8 pt-4"
          style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-main)' }}>
          Agent Receipts — Onchain proof of autonomous agent work
          <br />
          Built by <a href="https://pawr.link/clawlinker" className="hover:text-white transition-colors">Clawlinker</a> for the Synthesis Hackathon
          <br />
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs" style={{ background: 'var(--usdc-blue)', color: 'white', opacity: 0.8 }}>
            x402 API available — /api/x402/receipts ($0.01 USDC)
          </span>
        </footer>
      )}
    </main>
  )
}
