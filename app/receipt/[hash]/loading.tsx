import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Loading() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          All Receipts
        </Link>
      </div>

      {/* Receipt card skeleton */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          {/* Header: amount + direction */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="border-t border-zinc-800/50" />

          {/* Fields */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}

          {/* Explorer buttons */}
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Share section skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </main>
  )
}
