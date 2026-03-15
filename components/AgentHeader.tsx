'use client'

import { AGENT } from '@/app/types'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function AgentHeader({ receiptCount, source }: { receiptCount: number; source: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoading = source === 'loading'

  if (isLoading && !mounted) {
    return (
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full ring-2 ring-usdc/30" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="mt-4 h-10 w-64 rounded-lg" />
      </header>
    )
  }

  return (
    <header className={`transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-4">
        <img
          src={AGENT.avatar}
          alt={AGENT.name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-usdc/50 transition-transform duration-300 hover:scale-105"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {AGENT.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            ERC-8004 #{AGENT.id} • <span className="font-mono">{AGENT.ens}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-2">
        <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              source.startsWith('live')
                ? 'bg-success animate-pulse'
                : source.startsWith('cached')
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-muted-foreground'
            }`}
          />
          <span className="font-medium">{receiptCount} receipts</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {source.startsWith('live')
              ? 'Live'
              : source.startsWith('cached')
              ? 'Cached'
              : 'Sample'}{' '}
            data
          </span>
        </Badge>
      </div>
    </header>
  )
}
