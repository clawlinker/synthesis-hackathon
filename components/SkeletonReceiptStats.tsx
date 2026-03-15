'use client'

import { Card, CardContent } from '@/components/ui/card'

export function SkeletonReceiptStats() {
  const stats = [1, 2, 3, 4]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((idx) => (
        <Card key={idx} className="p-4 animate-pulse">
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-6 w-24 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
