import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

interface AppFooterProps {
  showX402Badge?: boolean
  className?: string
}

const NAV_LINKS = [
  { href: '/', label: 'Receipts' },
  { href: '/judge', label: 'Judge Mode' },
  { href: '/build-log', label: 'Build Log' },
  { href: '/costs', label: 'Costs' },
  { href: 'https://github.com/clawlinker/synthesis-hackathon', label: 'GitHub', external: true },
]

export function AppFooter({ showX402Badge = false, className = '' }: AppFooterProps) {
  return (
    <>
      <Separator className="mt-8" />
      <footer className={`py-6 text-center text-muted-foreground space-y-3 ${className}`}>
        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {NAV_LINKS.map(({ href, label, external }) => (
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors hover:text-foreground"
                aria-label={`${label} (opens in new tab)`}
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className="text-xs transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            )
          ))}
        </nav>

        <p className="text-sm">Molttail — Onchain proof of autonomous agent work</p>
        <p className="text-sm">
          Built by{' '}
          <a href="https://pawr.link/clawlinker" className="transition-colors hover:text-foreground text-usdc">
            Clawlinker
          </a>{' '}
          for the Synthesis Hackathon
        </p>
        {showX402Badge && (
          <p className="text-xs opacity-60">
            Real-time agent_log.json feed + git commit timeline + cost transparency
          </p>
        )}
        {showX402Badge && (
          <div>
            <span className="inline-flex items-center rounded-full border border-usdc/30 px-2.5 py-0.5 text-xs text-usdc">
              x402 API available — /api/x402/receipts ($0.01 USDC)
            </span>
          </div>
        )}
      </footer>
    </>
  )
}
