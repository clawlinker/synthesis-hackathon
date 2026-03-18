'use client'

// Skeleton that mirrors the actual ReceiptStats layout:
// — single rounded-xl border container
// — 2×2 grid on mobile, 1×4 on sm+
// — inner borders match the real component

export function SkeletonReceiptStats() {
  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={[
              'py-3 px-4 animate-pulse space-y-1',
              idx % 2 === 1 ? 'border-l border-zinc-800' : '',
              idx >= 2 ? 'border-t border-zinc-800' : '',
              'sm:border-t-0',
              idx > 0 ? 'sm:border-l sm:border-zinc-800' : 'sm:border-l-0',
            ].filter(Boolean).join(' ')}
          >
            <div className="h-2.5 w-16 rounded bg-zinc-800" />
            <div className="h-5 w-20 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
