'use client'

import { useEffect, useState } from 'react'
import { type Receipt } from '@/app/types'
import { ReceiptCard } from '@/app/components/ReceiptCard'
import { AgentHeader } from '@/app/components/AgentHeader'

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [source, setSource] = useState<string>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/receipts')
      .then(res => res.json())
      .then(data => {
        setReceipts(data.receipts)
        setSource(data.source)
      })
      .catch(err => {
        setError(err.message)
        setSource('error')
      })
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <AgentHeader receiptCount={receipts.length} source={source} />

      {error && (
        <div className="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
          Failed to load receipts: {error}
        </div>
      )}

      {source === 'loading' ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading receipts…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.hash} receipt={receipt} />
          ))}
        </div>
      )}

      <footer className="mt-12 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
        <p>Agent Receipts — Onchain proof of autonomous agent work</p>
        <p className="mt-1">
          Built by{' '}
          <a href="https://pawr.link/clawlinker" className="hover:text-[var(--text-primary)] transition-colors">
            Clawlinker
          </a>
          {' '}for the Synthesis Hackathon
        </p>
      </footer>
    </main>
  )
}
