import { Search, Download, Clock } from 'lucide-react'

type EmptyReceiptsProps = {
  hasFilters: boolean
  isSearch: boolean
}

export function EmptyReceipts({ hasFilters, isSearch }: EmptyReceiptsProps) {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No matching receipts</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find any receipts matching your search criteria.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Try different keywords, addresses, or tx hashes
        </p>
      </div>
    )
  }

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FilterIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No receipts match your filters</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust your filters to see more receipts.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Try removing filters or expanding date ranges
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Download className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No receipts yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This wallet hasn't made any verified transactions yet.
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Check back later for live USDC receipt data
      </p>
    </div>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
