'use client'

import { useEffect, useState } from 'react'
import { type Receipt, AGENTS, AGENT, BANKR_AGENT } from '@/app/types'
import { ReceiptCard } from '@/components/ReceiptCard'
import { AgentHeader } from '@/components/AgentHeader'
import { ReceiptStats } from '@/components/ReceiptStats'

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [source, setSource] = useState<string>('loading')
  const [error, setError] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Read wallet param from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const walletParam = urlParams.get('wallet')
    if (walletParam) {
      setSelectedWallet(walletParam)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchReceipts() {
      if (!mounted) return
      
      try {
        const url = selectedWallet ? `/api/receipts?wallet=${selectedWallet}` : '/api/receipts'
        const res = await fetch(url)
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
  }, [selectedWallet, mounted])

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

      {/* Empty State */}
      {!error && source !== 'loading' && receipts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon skeleton" style={{ borderRadius: '50%' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No receipts found for this wallet
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Try selecting a different wallet or check back later for live data
          </p>
        </div>
      )}

      {/* Wallet selector for multi-wallet support */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => {
            setSelectedWallet(null)
            window.history.pushState({}, '', window.location.pathname)
          }}
          className={`touch-target px-3 py-1.5 rounded text-sm transition-all duration-200 ${
            selectedWallet === null
              ? 'bg-white text-black shadow-lg shadow-white/10'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-95'
          }`}
        >
          Both Wallets
        </button>
        {AGENTS.map((agent) => (
          <button
            key={agent.wallet}
            onClick={() => {
              setSelectedWallet(agent.wallet)
              window.history.pushState({}, '', `${window.location.pathname}?wallet=${agent.wallet}`)
            }}
            className={`touch-target px-3 py-1.5 rounded text-sm transition-all duration-200 ${
              selectedWallet === agent.wallet
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-95'
            }`}
          >
            {agent.name} ({agent.wallet.slice(0, 6)}...{agent.wallet.slice(-4)})
          </button>
        ))}
      </div>

      <ReceiptStats receipts={receipts} />

      <div className="space-y-3">
        {receipts.map((receipt, index) => {
          // Check if this is the first inference receipt to show the section header
          const prevReceipt = index > 0 ? receipts[index - 1] : null
          const isSent = receipt.direction === 'sent'
          const prevSent = prevReceipt ? prevReceipt.direction === 'sent' : true
          const isFirstInference = !isSent && prevSent
          
          return (
            <ReceiptCard 
              key={receipt.hash} 
              receipt={receipt} 
              isFirstInference={isFirstInference} 
            />
          )
        })}
      </div>

      {receipts.length > 0 && (
        <footer className="text-center text-xs mt-8 pt-4"
          style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-main)' }}>
          Agent Receipts — Onchain proof of autonomous agent work
          <br />
          Built by <a href="https://pawr.link/clawlinker" className="hover:text-white transition-colors duration-200">Clawlinker</a> for the Synthesis Hackathon
          <br />
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs" style={{ background: 'var(--usdc-blue)', color: 'white', opacity: 0.8 }}>
            x402 API available — /api/x402/receipts ($0.01 USDC)
          </span>
        </footer>
      )}
    </main>
  )
}
