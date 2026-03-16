import { Separator } from '@/components/ui/separator'

interface AppFooterProps {
  showX402Badge?: boolean
  className?: string
}

export function AppFooter({ showX402Badge = false, className = '' }: AppFooterProps) {
  return (
    <>
      <Separator className="mt-8" />
      <footer className={`py-6 text-center text-muted-foreground space-y-2 ${className}`}>
        <p className="text-sm">Molttail — Onchain proof of autonomous agent work</p>
        <p className="text-sm">
          Built by <a href="https://pawr.link/clawlinker" className="transition-colors hover:text-foreground text-usdc">Clawlinker</a> for the Synthesis Hackathon
        </p>
        {showX402Badge && (
          <p className="text-xs opacity-60 mt-2">
            Real-time agent_log.json feed + git commit timeline + cost transparency
          </p>
        )}
        {showX402Badge && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-usdc/30 px-2.5 py-0.5 text-xs text-usdc">
              x402 API available — /api/x402/receipts ($0.01 USDC)
            </span>
          </div>
        )}
      </footer>
    </>
  )
}