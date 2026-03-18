import { type Metadata } from 'next'
import { AGENT } from '@/app/types'
import { ADDRESS_LABELS } from '@/data/config'
import { AGENT_REGISTRY } from '@/data/erc8004-resolver'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Clock, ExternalLink, Share2, Shield } from 'lucide-react'

const BLOCKSCOUT_REST_API = 'https://base.blockscout.com/api/v2'
const BASESCAN_API = 'https://api.basescan.org/api'

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface TxInfo {
  hash: string
  from: string
  to: string
  value: string          // raw 6-decimal USDC value
  amount: string         // formatted e.g. "12.50"
  timestamp: number
  blockNumber: string
  fromLabel?: string
  toLabel?: string
  fromAgent?: { id: number; name: string; ens?: string; avatar?: string }
  toAgent?: { id: number; name: string; ens?: string; avatar?: string }
  service?: string
  direction: 'sent' | 'received'
}

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

function resolveAgentInfo(address: string) {
  const addr = address.toLowerCase()
  return AGENT_REGISTRY[addr] ?? null
}

async function fetchTxInfo(hash: string): Promise<TxInfo | null> {
  // Try Blockscout v2 token transfer endpoint first
  try {
    const res = await fetch(
      `${BLOCKSCOUT_REST_API}/tokens/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/transfers?transaction_hash=${hash}`,
      { next: { revalidate: 300 } }
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.items) && data.items.length > 0) {
        const t = data.items[0]
        const rawValue = t.total?.value ?? '0'
        const amount = (parseInt(rawValue) / 1e6).toFixed(2)
        const from = t.from?.hash ?? ''
        const to = t.to?.hash ?? ''
        const block = t.block_number?.toString() ?? t.transaction?.block ?? ''
        const ts = t.timestamp ? Math.floor(new Date(t.timestamp).getTime() / 1000) : 0

        const isSent = from.toLowerCase() === AGENT.wallet.toLowerCase()

        return {
          hash,
          from,
          to,
          value: rawValue,
          amount,
          timestamp: ts,
          blockNumber: block,
          fromLabel: labelAddress(from),
          toLabel: labelAddress(to),
          fromAgent: resolveAgentInfo(from) ?? undefined,
          toAgent: resolveAgentInfo(to) ?? undefined,
          service: labelAddress(isSent ? to : from),
          direction: isSent ? 'sent' : 'received',
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback: Blockscout tx endpoint
  try {
    const res = await fetch(`${BLOCKSCOUT_REST_API}/transactions/${hash}/token_transfers`, {
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.items) && data.items.length > 0) {
        const t = data.items[0]
        const rawValue = t.total?.value ?? '0'
        const amount = (parseInt(rawValue) / 1e6).toFixed(2)
        const from = t.from?.hash ?? ''
        const to = t.to?.hash ?? ''
        const ts = t.timestamp ? Math.floor(new Date(t.timestamp).getTime() / 1000) : 0
        const block = t.block_number?.toString() ?? ''
        const isSent = from.toLowerCase() === AGENT.wallet.toLowerCase()

        return {
          hash,
          from,
          to,
          value: rawValue,
          amount,
          timestamp: ts,
          blockNumber: block,
          fromLabel: labelAddress(from),
          toLabel: labelAddress(to),
          fromAgent: resolveAgentInfo(from) ?? undefined,
          toAgent: resolveAgentInfo(to) ?? undefined,
          service: labelAddress(isSent ? to : from),
          direction: isSent ? 'sent' : 'received',
        }
      }
    }
  } catch { /* fall through */ }

  // Last resort: Basescan
  try {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: AGENT.wallet,
      contractaddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      sort: 'desc',
      page: '1',
      offset: '100',
    })
    if (process.env.BASESCAN_API_KEY) params.set('apikey', process.env.BASESCAN_API_KEY)

    const res = await fetch(`${BASESCAN_API}?${params}`, { next: { revalidate: 300 } })
    if (res.ok) {
      const data = await res.json()
      if (data.status === '1' && Array.isArray(data.result)) {
        const tx = data.result.find((t: Record<string, string>) => t.hash === hash)
        if (tx) {
          const from = tx.from
          const to = tx.to
          const rawValue = tx.value
          const amount = (parseInt(rawValue) / 1e6).toFixed(2)
          const ts = parseInt(tx.timeStamp)
          const block = tx.blockNumber
          const isSent = from.toLowerCase() === AGENT.wallet.toLowerCase()

          return {
            hash,
            from,
            to,
            value: rawValue,
            amount,
            timestamp: ts,
            blockNumber: block,
            fromLabel: labelAddress(from),
            toLabel: labelAddress(to),
            fromAgent: resolveAgentInfo(from) ?? undefined,
            toAgent: resolveAgentInfo(to) ?? undefined,
            service: labelAddress(isSent ? to : from),
            direction: isSent ? 'sent' : 'received',
          }
        }
      }
    }
  } catch { /* fall through */ }

  return null
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatTs(ts: number): string {
  if (!ts) return 'Unknown'
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

function shortAddr(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function truncateHash(hash: string): string {
  if (hash.length <= 30) return hash
  return `${hash.slice(0, 20)}…${hash.slice(-8)}`
}

function displayName(addr: string, label?: string, agent?: { name: string } | null): string {
  return agent?.name ?? label ?? shortAddr(addr)
}

// ---------------------------------------------------------------------------
// generateMetadata — rich OG with actual tx data
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>
}): Promise<Metadata> {
  const { hash } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

  // Try to fetch tx data for rich OG
  const tx = await fetchTxInfo(hash)

  const agentName = AGENT.name
  const agentId = AGENT.id || '22945'

  let ogTitle: string
  let ogDesc: string

  if (tx) {
    const isSent = tx.direction === 'sent'
    const counterName = isSent
      ? displayName(tx.to, tx.toLabel, tx.toAgent)
      : displayName(tx.from, tx.fromLabel, tx.fromAgent)
    const direction = isSent ? 'Sent' : 'Received'
    ogTitle = `${direction} ${tx.amount} USDC — Agent Receipt`
    ogDesc = `${direction} ${tx.amount} USDC ${isSent ? 'to' : 'from'} ${counterName} · ${formatTs(tx.timestamp)} · ${agentName} (ERC-8004 #${agentId})`
  } else {
    ogTitle = `Agent Receipt — ${hash.slice(0, 10)}…`
    ogDesc = `Verified USDC receipt from ${agentName} (ERC-8004 #${agentId}) — Onchain proof of autonomous agent work`
  }

  return {
    title: ogTitle,
    description: ogDesc,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'article',
      title: ogTitle,
      description: ogDesc,
      url: `${baseUrl}/receipt/${hash}`,
      images: [
        {
          url: `/api/og/${hash}`,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      siteName: 'Molttail',
      locale: 'en-US',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDesc,
      images: [`/api/og/${hash}`],
      creator: '@clawlinker',
      creatorId: '1445807403852820480',
    },
    alternates: {
      canonical: `${baseUrl}/receipt/${hash}`,
    },
  }
}

// ---------------------------------------------------------------------------
// Agent Identity Badge
// ---------------------------------------------------------------------------

function AgentBadge({
  agent,
  address,
  label,
}: {
  agent?: { id: number; name: string; ens?: string; avatar?: string } | null
  address: string
  label?: string
}) {
  if (!agent) {
    if (label) {
      return (
        <div className="min-w-0">
          <span className="text-xs font-semibold text-zinc-100">{label}</span>
          <div className="text-[9px] font-mono text-zinc-600 truncate">{shortAddr(address)}</div>
        </div>
      )
    }
    return (
      <span className="font-mono text-xs text-zinc-300 break-all">{address}</span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {agent.avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={agent.avatar}
          alt={agent.name}
          width={20}
          height={20}
          className="rounded-full shrink-0 ring-1 ring-zinc-700"
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-100">{agent.name}</span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 border border-green-500/20 px-1.5 py-px text-[9px] font-mono text-green-400 shrink-0">
            <Shield className="h-2.5 w-2.5 mr-0.5" />
            ERC-8004 #{agent.id}
          </span>
        </div>
        {agent.ens && (
          <div className="text-[10px] text-zinc-500 font-mono">{agent.ens}</div>
        )}
        <div className="text-[9px] font-mono text-zinc-600 truncate">{shortAddr(address)}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ hash: string }>
}) {
  const { hash } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'
  const receiptUrl = `${baseUrl}/receipt/${hash}`
  const isInference = hash.startsWith('inference-')

  // Fetch tx data server-side
  const tx = isInference ? null : await fetchTxInfo(hash)

  const isSent = tx?.direction === 'sent'
  const amountColor = isSent ? 'text-red-400' : 'text-green-400'
  const amountSign = isSent ? '−' : '+'

  const tweetText = tx
    ? `Agent Receipt 🤖\n\n${tx.direction === 'sent' ? '−' : '+'}${tx.amount} USDC\n${formatTs(tx.timestamp)}\n\n${receiptUrl}`
    : `Agent Receipt 🤖\n\nVerified USDC payment from @clawlinker\n\n${receiptUrl}`

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Link>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Agent Receipt</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isInference
            ? `Inference receipt · ${AGENT.name}`
            : `Verified USDC transaction · ${AGENT.name} (ERC-8004 #${AGENT.id})`}
        </p>
      </div>

      <div className="flex flex-col gap-3">

        {/* ── Amount hero ── */}
        {tx && (
          <Card className="overflow-hidden border-zinc-800 bg-gradient-to-br from-zinc-800/80 to-zinc-900">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Amount</p>
                <p className={`text-5xl font-extrabold tabular-nums tracking-tight ${amountColor}`}>
                  {amountSign}{tx.amount}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-sm font-semibold text-zinc-400">USDC</p>
                  {/* Chain badge */}
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-px text-[9px] font-semibold text-blue-400 uppercase tracking-wider">
                    Base
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${
                  isSent
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  {isSent ? 'Sent' : 'Received'}
                </span>
                {tx.timestamp > 0 && (
                  <p className="text-[10px] text-zinc-600 mt-2 font-mono">{formatTs(tx.timestamp)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SVG Receipt (visual) ── */}
        {!isInference && (
          <Card className="overflow-hidden border-zinc-800">
            <CardContent className="p-0">
              <div className="w-full bg-zinc-950">
                <object
                  data={`/api/receipt/svg/${hash}`}
                  type="image/svg+xml"
                  className="w-full h-auto block"
                  style={{ minHeight: 0 }}
                >
                  <div className="flex items-center justify-center py-4 text-zinc-500 text-sm px-4 text-center">
                    SVG receipt unavailable — view transaction details below
                  </div>
                </object>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Transaction Details + Share (merged) ── */}
        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Transaction Details
            </h2>
            <Separator />

            {/* Hash */}
            <div>
              <p className="text-[10px] tracking-wider text-zinc-400 mb-1">Hash</p>
              <div className="flex items-center gap-2">
                <p
                  className="font-mono text-xs text-zinc-300 flex-1 min-w-0 truncate"
                  title={hash}
                >
                  {truncateHash(hash)}
                </p>
                <CopyLinkButton url={hash} />
              </div>
            </div>

            {/* Block + Timestamp */}
            {tx && (
              <div className="grid grid-cols-2 gap-3">
                {tx.blockNumber && (
                  <div>
                    <p className="text-[10px] tracking-wider text-zinc-400 mb-1">Block</p>
                    <p className="font-mono text-xs text-zinc-300">#{tx.blockNumber}</p>
                  </div>
                )}
                {tx.timestamp > 0 && (
                  <div>
                    <p className="text-[10px] tracking-wider text-zinc-400 mb-1">Timestamp</p>
                    <p className="text-xs text-zinc-300">{formatTs(tx.timestamp)}</p>
                  </div>
                )}
              </div>
            )}

            {/* From */}
            {tx && (
              <div>
                <p className="text-[10px] tracking-wider text-zinc-400 mb-1.5">From</p>
                <AgentBadge
                  agent={tx.fromAgent}
                  address={tx.from}
                  label={tx.fromLabel}
                />
              </div>
            )}

            {/* To */}
            {tx && (
              <div>
                <p className="text-[10px] tracking-wider text-zinc-400 mb-1.5">To</p>
                <AgentBadge
                  agent={tx.toAgent}
                  address={tx.to}
                  label={tx.toLabel}
                />
              </div>
            )}

            {/* Service */}
            {tx?.service && (
              <div>
                <p className="text-[10px] tracking-wider text-zinc-400 mb-1">Service</p>
                <p className="text-xs text-zinc-300">{tx.service}</p>
              </div>
            )}

            {/* No data fallback — info box with clock */}
            {!tx && !isInference && (
              <div className="flex items-start gap-2.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 px-3 py-2.5">
                <Clock className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
                <p className="text-xs text-zinc-400">
                  Transaction details are still indexing or unavailable. Check the explorer links below.
                </p>
              </div>
            )}

            {/* Explorer + Download buttons */}
            {!isInference && (
              <div className="flex gap-2 pt-0.5">
                <a
                  href={`https://base.blockscout.com/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:shadow-[0_0_8px_rgba(161,161,170,0.15)] text-zinc-200 py-2 px-3 text-xs font-medium transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Blockscout
                </a>
                <a
                  href={`https://basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:shadow-[0_0_8px_rgba(161,161,170,0.15)] text-zinc-200 py-2 px-3 text-xs font-medium transition-all"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  BaseScan
                </a>
                <a
                  href={`/api/receipt/svg/${hash}`}
                  download={`receipt-${hash.slice(0, 8)}.svg`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:shadow-[0_0_8px_rgba(161,161,170,0.15)] text-zinc-200 py-2 px-3 text-xs font-medium transition-all"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download SVG
                </a>
              </div>
            )}

            {/* ── Share — merged inline ── */}
            <Separator />
            <div className="flex items-center gap-2 pt-0.5">
              <Share2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-auto">Share</span>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:shadow-[0_0_8px_rgba(161,161,170,0.15)] text-zinc-200 py-1.5 px-2.5 text-xs font-medium transition-all"
                >
                  <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </a>
                <a
                  href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 hover:shadow-[0_0_8px_rgba(161,161,170,0.15)] text-zinc-200 py-1.5 px-2.5 text-xs font-medium transition-all"
                >
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  Farcaster
                </a>
                <CopyLinkButton url={receiptUrl} />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-zinc-800/60">
        <p className="text-center text-xs text-zinc-600">
          Molttail · Built by{' '}
          <a href="https://pawr.link/clawlinker" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Clawlinker
          </a>{' '}
          · Synthesis Hackathon 2026
        </p>
      </footer>
    </main>
  )
}
