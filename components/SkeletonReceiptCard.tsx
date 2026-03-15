'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function SkeletonReceiptCard() {
  return (
    <Card className="p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      </div>

      {/* Agent Badges */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-12 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-2 w-12 rounded" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Skeleton className="h-3 w-12 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-2 w-12 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </Card>
  )
}
