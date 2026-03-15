'use client'

import { useEffect, useState } from 'react'
import { type Receipt, AGENTS, AGENT, CHAINS } from '@/app/types'
import { ReceiptCard } from '@/components/ReceiptCard'
import { AgentHeader } from '@/components/AgentHeader'
import { ReceiptStats } from '@/components/ReceiptStats'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    direction: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const walletParam = urlParams.get('wallet')
    const chainParam = urlParams.get('chain') as keyof typeof CHAINS | null
    if (walletParam) setSelectedWallet(walletParam)
    if (chainParam && CHAINS[chainParam]) setSelectedChain(chainParam)
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchReceipts() {
      if (!mounted) return
      try {
        const params = new URLSearchParams()
        if (selectedWallet) params.append('wallet', selectedWallet)
        params.append('chain', selectedChain)
        const res = await fetch(`/api/receipts?${params.toString()}`)
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

  useEffect(() => {
    if (receipts.length === 0) {
      setFilteredReceipts([])
      return
    }
    const filtered = receipts.filter((receipt) => {
      if (filters.direction !== 'all' && receipt.direction !== filters.direction) return false
      const minVal = parseFloat(filters.minAmount)
      const maxVal = parseFloat(filters.maxAmount)
      const amount = parseFloat(receipt.amount)
      if (filters.minAmount && !isNaN(minVal) && amount < minVal) return false
      if (filters.maxAmount && !isNaN(maxVal) && amount > maxVal) return false
      const receiptDate = new Date(receipt.timestamp * 1000)
      if (filters.dateFrom && receiptDate < new Date(filters.dateFrom)) return false
      if (filters.dateTo && receiptDate > new Date(filters.dateTo)) return false
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const matchesAny = [receipt.hash, receipt.from, receipt.to, receipt.service || '', receipt.notes || '']
          .some((f) => f.toLowerCase().includes(s))
        if (!matchesAny) return false
      }
      return true
    })
    setFilteredReceipts(filtered)
  }, [receipts, filters])

  const hasActiveFilters = filters.direction !== 'all' || filters.minAmount || filters.maxAmount || filters.dateFrom || filters.dateTo || filters.search

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center space-y-6">
        <Badge variant="outline" className="gap-2 border-usdc/30 text-usdc">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Molttail v1.0
        </Badge>

        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Every payment
          <br />
          <span className="text-usdc">your agent makes,</span>
          <br />
          verified and visible.
        </h1>

        <p className="mx-auto max-w-lg text-lg text-muted-foreground leading-relaxed md:text-xl">
          Verifiable audit trail for autonomous agent transactions on Base and Ethereum.
          Real-time USDC receipts, ERC-8004 identity resolution, and complete transparency.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a href="#feed" className={buttonVariants({ size: "lg", className: "bg-usdc text-black hover:bg-usdc/90 shadow-lg shadow-usdc/20" })}>
            View Receipts
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>

          <a href="https://github.com/clawlinker/synthesis-hackathon" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>

          <a href="/judge" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Judge Mode
          </a>
        </div>

        <div className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
          {['Live on Base + Ethereum', 'ERC-8004 Verified', 'x402 Payments'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <AgentHeader receiptCount={filteredReceipts.length} source={source} />

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 my-6">
          <CardContent className="p-4 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {source === 'loading' && (
        <div className="py-12 text-center text-muted-foreground">Loading receipts…</div>
      )}

      {/* Empty states */}
      {!error && source !== 'loading' && filteredReceipts.length === 0 && (
        <Card className="my-8">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 h-12 w-12 rounded-full bg-muted" />
            <p className="text-sm text-muted-foreground">
              {receipts.length === 0 ? 'No receipts found' : 'No receipts match your filters'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {receipts.length === 0 ? 'Check back later for live data' : 'Try adjusting your search or filters'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chain selector */}
      <div id="feed" className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(CHAINS).map(([key, chain]) => (
          <Button
            key={key}
            variant={selectedChain === key ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setSelectedChain(key as keyof typeof CHAINS)
              const params = new URLSearchParams(window.location.search)
              params.set('chain', key)
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
            }}
            className="gap-2"
          >
            <span className={`h-2 w-2 rounded-full ${key === 'base' ? 'bg-success' : 'bg-blue-400'}`} />
            {chain.name} ({chain.id})
          </Button>
        ))}
      </div>

      {/* Wallet selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={selectedWallet === null ? 'default' : 'secondary'}
          size="sm"
          onClick={() => {
            setSelectedWallet(null)
            const params = new URLSearchParams()
            params.set('chain', selectedChain)
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
          }}
        >
          Both Wallets
        </Button>
        {AGENTS.map((agent) => (
          <Button
            key={agent.wallet}
            variant={selectedWallet === agent.wallet ? 'default' : 'secondary'}
            size="sm"
            aria-label={`View ${agent.name} receipts`}
            onClick={() => {
              setSelectedWallet(agent.wallet)
              const params = new URLSearchParams(window.location.search)
              params.set('wallet', agent.wallet)
              params.set('chain', selectedChain)
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
            }}
          >
            {agent.name} ({agent.wallet.slice(0, 6)}...{agent.wallet.slice(-4)})
          </Button>
        ))}
      </div>

      <ReceiptStats receipts={filteredReceipts} />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="space-y-4 p-4">
          {/* Search — always visible */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by tx hash, address, service..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <kbd className="absolute right-3 top-2.5 hidden rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
              /
            </kbd>
          </div>

          {/* Toggle for advanced filters */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${showFilters ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-usdc" />
            )}
          </button>

          {/* Collapsible filter panel */}
          {showFilters && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Direction + Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Direction
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['all', 'sent', 'received'] as const).map((dir) => (
                      <Button
                        key={dir}
                        variant={filters.direction === dir ? 'default' : 'secondary'}
                        size="sm"
                        className="capitalize text-xs"
                        onClick={() => setFilters((f) => ({ ...f, direction: dir }))}
                      >
                        {dir}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Min</label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={filters.minAmount}
                      onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Max</label>
                    <Input
                      type="number"
                      placeholder="∞"
                      min="0"
                      step="0.01"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setFilters({ direction: 'all', minAmount: '', maxAmount: '', dateFrom: '', dateTo: '', search: '' })}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt count */}
      {filteredReceipts.length > 0 && (
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredReceipts.length} receipt{filteredReceipts.length !== 1 && 's'}</span>
          {filteredReceipts.length !== receipts.length && (
            <span className="text-usdc">
              Showing {filteredReceipts.length} of {receipts.length} receipts
            </span>
          )}
        </div>
      )}

      {/* Receipt feed */}
      <div className="space-y-3">
        {filteredReceipts.map((receipt, index) => {
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

      {/* Footer */}
      {filteredReceipts.length > 0 && (
        <>
          <Separator className="mt-8" />
          <footer className="py-6 text-center text-xs text-muted-foreground space-y-2">
            <p>Molttail — Your agent&apos;s transaction tail — every payment, verified and visible</p>
            <p>
              Built by{' '}
              <a href="https://pawr.link/clawlinker" className="transition-colors hover:text-foreground">
                Clawlinker
              </a>{' '}
              for the Synthesis Hackathon
            </p>
            <Badge variant="outline" className="text-usdc border-usdc/30">
              x402 API available — /api/x402/receipts ($0.01 USDC)
            </Badge>
          </footer>
        </>
      )}
    </main>
  )
}
