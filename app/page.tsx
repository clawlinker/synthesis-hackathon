'use client'

import { useEffect, useState } from 'react'
import { type Receipt, AGENTS, CHAINS } from '@/app/types'
import { ReceiptList } from '@/components/ReceiptCard'
import { HeroSection } from '@/components/HeroSection'
import { ReceiptStats } from '@/components/ReceiptStats'
import { SkeletonReceiptCard } from '@/components/SkeletonReceiptCard'
import { SkeletonReceiptStats } from '@/components/SkeletonReceiptStats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyReceipts } from '@/components/EmptyReceipts'
import { AppFooter } from '@/components/AppFooter'

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
  const [showInference, setShowInference] = useState(false)
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
      const isInference = receipt.hash?.startsWith('inference-') || !!receipt.modelInfo
      if (!showInference && isInference) return false
      // Hide zero-amount receipts — they add no value and look broken
      if (!isInference && (receipt.amount === '0' || receipt.amount === '0.00' || parseFloat(receipt.amount) === 0)) return false
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
  }, [receipts, filters, showInference])

  const hasActiveFilters = filters.direction !== 'all' || filters.minAmount || filters.maxAmount || filters.dateFrom || filters.dateTo || filters.search

  // Compute hero stats from raw receipts
  const heroStats = {
    totalReceipts: receipts.length,
    totalUSDC: receipts.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0),
    onChainCount: receipts.filter(r => !r.hash?.startsWith('inference-')).length,
    inferenceCount: receipts.filter(r => r.hash?.startsWith('inference-') || !!r.modelInfo).length,
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <HeroSection stats={heroStats} source={source} />

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 my-4">
          <CardContent className="p-4 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {source === 'loading' && (
        <div className="space-y-3 mt-4">
          <SkeletonReceiptStats />
          <SkeletonReceiptCard />
          <SkeletonReceiptCard />
          <SkeletonReceiptCard />
          <SkeletonReceiptCard />
        </div>
      )}

      {/* Empty state */}
      {!error && source !== 'loading' && filteredReceipts.length === 0 && (
        <Card className="my-6">
          <CardContent className="py-4">
            <EmptyReceipts
              hasFilters={
                filters.direction !== 'all' ||
                filters.minAmount !== '' ||
                filters.maxAmount !== '' ||
                filters.dateFrom !== '' ||
                filters.dateTo !== '' ||
                filters.search !== ''
              }
              isSearch={filters.search !== ''}
            />
          </CardContent>
        </Card>
      )}

      {/* Compact chain + wallet selector pills */}
      <div id="feed" className="flex flex-wrap items-center gap-1.5 mb-4 mt-4">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Chain</span>
        {Object.entries(CHAINS).map(([key, chain]) => (
          <button
            key={key}
            onClick={() => {
              setSelectedChain(key as keyof typeof CHAINS)
              const params = new URLSearchParams(window.location.search)
              params.set('chain', key)
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              selectedChain === key
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${key === 'base' ? 'bg-success' : 'bg-blue-400'}`} />
            {chain.name}
          </button>
        ))}

        <span className="text-[10px] uppercase tracking-wider text-zinc-500 ml-2">Wallet</span>
        <button
          onClick={() => {
            setSelectedWallet(null)
            const params = new URLSearchParams()
            params.set('chain', selectedChain)
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
          }}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
            selectedWallet === null
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          All
        </button>
        {AGENTS.map((agent) => (
          <button
            key={agent.wallet}
            onClick={() => {
              setSelectedWallet(agent.wallet)
              const params = new URLSearchParams(window.location.search)
              params.set('wallet', agent.wallet)
              params.set('chain', selectedChain)
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
            }}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              selectedWallet === agent.wallet
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {agent.name}
          </button>
        ))}
      </div>

      {mounted ? (
        <ReceiptStats receipts={filteredReceipts} />
      ) : (
        <SkeletonReceiptStats />
      )}

      {/* Filters */}
      <Card className="mb-4 mt-4">
        <CardContent className="space-y-3 p-3">
          {/* Search — always visible */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by tx hash, address, service..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="h-8 text-sm"
            />
            <kbd className="absolute right-3 top-2 hidden rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground sm:inline-block">
              /
            </kbd>
          </div>

          {/* Filter toggle row — includes LLM Costs */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
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

            {/* LLM Costs toggle — inside filter section */}
            <button
              type="button"
              onClick={() => setShowInference((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                showInference
                  ? 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25'
                  : 'bg-muted text-zinc-400 hover:bg-muted/80'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${showInference ? 'bg-purple-400' : 'bg-muted-foreground/50'}`} />
              LLM Costs
            </button>
          </div>

          {/* Collapsible filter panel */}
          {showFilters && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Direction + Amount */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Direction
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['all', 'sent', 'received'] as const).map((dir) => (
                      <Button
                        key={dir}
                        variant={filters.direction === dir ? 'default' : 'secondary'}
                        size="sm"
                        className="capitalize text-xs h-7"
                        onClick={() => setFilters((f) => ({ ...f, direction: dir }))}
                      >
                        {dir}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">Min</label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      value={filters.minAmount}
                      onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">Max</label>
                    <Input
                      type="number"
                      placeholder="∞"
                      min="0"
                      step="0.01"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="h-7 text-xs"
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

      {/* Feed summary bar */}
      {filteredReceipts.length > 0 && (() => {
        const usdcReceipts = filteredReceipts.filter(r => !(r.hash?.startsWith('inference-') || !!r.modelInfo))
        const inferenceReceipts = filteredReceipts.filter(r => r.hash?.startsWith('inference-') || !!r.modelInfo)
        const totalSpent = filteredReceipts
          .filter(r => r.direction === 'sent')
          .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0)
        const totalEarned = usdcReceipts
          .filter(r => r.direction === 'received')
          .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0)
        const parts: string[] = []
        if (usdcReceipts.length) parts.push(`${usdcReceipts.length} USDC transaction${usdcReceipts.length !== 1 ? 's' : ''}`)
        if (inferenceReceipts.length) parts.push(`${inferenceReceipts.length} LLM inference call${inferenceReceipts.length !== 1 ? 's' : ''}`)
        if (totalSpent > 0) parts.push(`$${totalSpent.toFixed(2)} sent`)
        if (totalEarned > 0) parts.push(`$${totalEarned.toFixed(2)} received`)
        return (
          <div className="mb-3 text-xs text-zinc-500 tabular-nums">
            {parts.join(' · ')}
          </div>
        )
      })()}

      {/* Receipt feed — grouped by day */}
      <div className="space-y-4">
        {(() => {
          const groups: { label: string; date: string; receipts: Receipt[] }[] = []
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()

          for (const receipt of filteredReceipts) {
            const d = new Date(receipt.timestamp * 1000)
            const dateStr = d.toDateString()
            const label =
              dateStr === today
                ? 'Today'
                : dateStr === yesterday
                ? 'Yesterday'
                : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

            const existing = groups.find((g) => g.date === dateStr)
            if (existing) {
              existing.receipts.push(receipt)
            } else {
              groups.push({ label, date: dateStr, receipts: [receipt] })
            }
          }

          // Smart sort: within each day group, USDC receipts first (by timestamp desc),
          // then inference receipts (by timestamp desc). Judges see real transactions first.
          for (const group of groups) {
            const isInference = (r: Receipt) => r.hash?.startsWith('inference-') || !!r.modelInfo
            const usdc = group.receipts.filter(r => !isInference(r)).sort((a, b) => b.timestamp - a.timestamp)
            const inference = group.receipts.filter(r => isInference(r)).sort((a, b) => b.timestamp - a.timestamp)
            group.receipts = [...usdc, ...inference]
          }

          // Hide empty day groups (e.g. when LLM toggle hides all receipts for a day)
          const nonEmptyGroups = groups.filter(g => g.receipts.length > 0)

          return nonEmptyGroups.map((group) => (
            <div key={group.date}>
              {/* Day header — sticky below nav bar (top-11 = 44px nav height) */}
              <div className="sticky top-11 z-10 mb-1.5 flex items-center gap-3 py-1 backdrop-blur-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-zinc-700" />
                <span className="text-[11px] text-zinc-500 shrink-0">{group.receipts.length}</span>
              </div>
              <ReceiptList receipts={group.receipts} />
            </div>
          ))
        })()}
      </div>

      {/* Footer */}
      {filteredReceipts.length > 0 && <AppFooter />}
    </main>
  )
}
