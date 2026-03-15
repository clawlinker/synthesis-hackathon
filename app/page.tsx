'use client'

import { useEffect, useState } from 'react'
import { type Receipt, AGENTS, AGENT, BANKR_AGENT, CHAINS } from '@/app/types'
import { ReceiptCard } from '@/components/ReceiptCard'
import { AgentHeader } from '@/components/AgentHeader'
import { ReceiptStats } from '@/components/ReceiptStats'

type FilterState = {
  direction: 'all' | 'sent' | 'received'
  minAmount: string
  maxAmount: string
  dateFrom: string
  dateTo: string
  search: string
}

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([])
  const [source, setSource] = useState<string>('loading')
  const [error, setError] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [selectedChain, setSelectedChain] = useState<keyof typeof CHAINS>('base')
  const [mounted, setMounted] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    direction: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  // Read wallet and chain params from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const walletParam = urlParams.get('wallet')
    const chainParam = urlParams.get('chain') as keyof typeof CHAINS | null
    if (walletParam) {
      setSelectedWallet(walletParam)
    }
    if (chainParam && CHAINS[chainParam]) {
      setSelectedChain(chainParam)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchReceipts() {
      if (!mounted) return
      
      try {
        const params = new URLSearchParams()
        if (selectedWallet) params.append('wallet', selectedWallet)
        params.append('chain', selectedChain)
        
        const url = `/api/receipts?${params.toString()}`
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
  }, [selectedWallet, selectedChain, mounted])

  // Filter receipts when source data or filters change
  useEffect(() => {
    if (receipts.length === 0) {
      setFilteredReceipts([])
      return
    }

    const filtered = receipts.filter((receipt) => {
      // Direction filter
      if (filters.direction !== 'all' && receipt.direction !== filters.direction) {
        return false
      }

      // Amount range filters
      const minVal = parseFloat(filters.minAmount)
      const maxVal = parseFloat(filters.maxAmount)
      const amount = parseFloat(receipt.amount)
      if (filters.minAmount && (!isNaN(minVal) && amount < minVal)) {
        return false
      }
      if (filters.maxAmount && (!isNaN(maxVal) && amount > maxVal)) {
        return false
      }

      // Date range filters
      const receiptDate = new Date(receipt.timestamp * 1000)
      if (filters.dateFrom && receiptDate < new Date(filters.dateFrom)) {
        return false
      }
      if (filters.dateTo && receiptDate > new Date(filters.dateTo)) {
        return false
      }

      // Search filter (tx hash or address)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesHash = receipt.hash.toLowerCase().includes(searchLower)
        const matchesFrom = receipt.from.toLowerCase().includes(searchLower)
        const matchesTo = receipt.to.toLowerCase().includes(searchLower)
        const matchesService = receipt.service?.toLowerCase().includes(searchLower) || false
        const matchesNotes = receipt.notes?.toLowerCase().includes(searchLower) || false
        if (!matchesHash && !matchesFrom && !matchesTo && !matchesService && !matchesNotes) {
          return false
        }
      }

      return true
    })

    setFilteredReceipts(filtered)
  }, [receipts, filters])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 mb-4"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-usdc)/30', color: 'var(--color-usdc)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Molttail v1.0
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
          <span style={{ color: 'var(--color-text-primary)' }}>Every payment</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-usdc)] to-[var(--color-usdc)]/70">
            your agent makes,
          </span>
          <br />
          <span style={{ color: 'var(--color-text-primary)' }}>verified and visible.</span>
        </h1>
        
        <p className="text-lg md:text-xl max-w-lg mx-auto text-slate-400 leading-relaxed">
          Verifiable audit trail for autonomous agent transactions on Base and Ethereum.
          Real-time USDC receipts, ERC-8004 identity resolution, and complete transparency.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#feed"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-lg shadow-[var(--color-usdc)]/20"
            style={{ background: 'var(--color-usdc)', color: 'black' }}
          >
            View Receipts
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          
          <a
            href="https://github.com/your-org/agent-receipts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-white/5 active:scale-95 border border-white/10"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
          
          <a
            href="/judge"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-white/5 active:scale-95 border border-white/10"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Judge Mode
          </a>
        </div>
        
        <div className="pt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Live on Base + Ethereum</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>ERC-8004 Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>x402 Payments</span>
          </div>
        </div>
      </section>

      <AgentHeader receiptCount={filteredReceipts.length} source={source} />

      {error && (
        <div className="text-red-400 text-center py-8">{error}</div>
      )}

      {source === 'loading' && (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          Loading receipts…
        </div>
      )}

      {/* Empty State */}
      {!error && source !== 'loading' && filteredReceipts.length === 0 && receipts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon skeleton" style={{ borderRadius: '50%' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No receipts found
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Check back later for live data
          </p>
        </div>
      )}

      {/* Empty State with matches but no results */}
      {!error && source !== 'loading' && filteredReceipts.length === 0 && receipts.length > 0 && (
        <div className="empty-state">
          <div className="empty-state-icon skeleton" style={{ borderRadius: '50%' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No receipts match your filters
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Chain selector for multi-chain support */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(CHAINS).map(([key, chain]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedChain(key as keyof typeof CHAINS)
              const params = new URLSearchParams(window.location.search)
              params.set('chain', key)
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
            }}
            className={`touch-target px-3 py-1.5 rounded text-sm transition-all duration-200 flex items-center gap-2 ${
              selectedChain === key
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-95'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              key === 'base' ? 'bg-green-400' : 'bg-blue-400'
            }`} />
            {chain.name} ({chain.id})
          </button>
        ))}
      </div>

      {/* Wallet selector for multi-wallet support */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => {
            setSelectedWallet(null)
            const params = new URLSearchParams()
            params.set('chain', selectedChain)
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
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
            aria-label={`View ${agent.name} receipts`}
            onClick={() => {
              setSelectedWallet(agent.wallet)
              const params = new URLSearchParams(window.location.search)
              params.set('wallet', agent.wallet)
              params.set('chain', selectedChain)
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
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

      <ReceiptStats receipts={filteredReceipts} />

      {/* Filters & Search */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by tx hash, address, service..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-main)',
              color: 'var(--color-text-primary)',
            }}
          />
          <div className="absolute right-3 top-2.5 text-xs opacity-50 font-mono hidden sm:block">
            /
          </div>
        </div>

        {/* Direction + Amount Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Direction
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['all', 'sent', 'received'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFilters((f) => ({ ...f, direction: dir }))}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 capitalize ${
                    filters.direction === dir
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Min
              </label>
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
                className="w-full px-3 py-1.5 rounded text-sm transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-main)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Max
              </label>
              <input
                type="number"
                placeholder="∞"
                min="0"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
                className="w-full px-3 py-1.5 rounded text-sm transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-main)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="w-full px-3 py-1.5 rounded text-sm transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-main)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              className="w-full px-3 py-1.5 rounded text-sm transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-main)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Clear filters link */}
        {(filters.direction !== 'all' || filters.minAmount || filters.maxAmount || filters.dateFrom || filters.dateTo || filters.search) && (
          <button
            onClick={() =>
              setFilters({
                direction: 'all',
                minAmount: '',
                maxAmount: '',
                dateFrom: '',
                dateTo: '',
                search: '',
              })
            }
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Receipt count indicator */}
      {filteredReceipts.length > 0 && (
        <div className="mb-4 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>{filteredReceipts.length} receipt{filteredReceipts.length !== 1 && 's'}</span>
          {filteredReceipts.length !== receipts.length && (
            <span className="text-blue-400">
              Showing {filteredReceipts.length} of {receipts.length} receipts
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filteredReceipts.map((receipt, index) => {
          // Check if this is the first inference receipt to show the section header
          const prevReceipt = index > 0 ? filteredReceipts[index - 1] : null
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

      {filteredReceipts.length > 0 && (
        <footer className="text-center text-xs mt-8 pt-4"
          style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-main)' }}>
          Molttail — Your agent's transaction tail — every payment, verified and visible
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
