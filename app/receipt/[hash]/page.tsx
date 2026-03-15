import { type Metadata } from 'next'
import { AGENT } from '@/app/types'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ hash: string }> }): Promise<Metadata> {
  const { hash } = await params

  const agentName = AGENT.name
  const agentId = AGENT.id || '22945'

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

  return {
    title: `Agent Receipt — ${hash.slice(0, 8)}... | ${agentName}`,
    description: `Verified USDC receipt from ${agentName} (ERC-8004 #${agentId}) — Onchain proof of autonomous agent work`,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'article',
      title: `Agent Receipt — ${hash.slice(0, 8)}...`,
      description: `Verified USDC receipt from ${agentName} for autonomous agent work`,
      url: `${baseUrl}/receipt/${hash}`,
      images: [
        {
          url: `/api/og/${hash}`,
          width: 1200,
          height: 630,
          alt: `Agent Receipt for ${hash.slice(0, 8)}...`,
        },
      ],
      siteName: 'Molttail',
      locale: 'en-US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Agent Receipt — ${hash.slice(0, 8)}...`,
      description: `Verified USDC receipt from ${agentName}`,
      images: [`/api/og/${hash}`],
      creator: '@clawlinker',
      creatorId: '1445807403852820480',
    },
    alternates: {
      canonical: `${baseUrl}/receipt/${hash}`,
    },
  }
}

export default async function ReceiptPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'
  const receiptUrl = `${baseUrl}/receipt/${hash}`
  const isInference = hash.startsWith('inference-')

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Agent Receipt</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Verified USDC transaction · {AGENT.name} (ERC-8004 #{AGENT.id})
        </p>
      </div>

      {/* SVG Receipt */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-[600/350] w-full bg-zinc-950">
            <object
              data={`/api/receipt/svg/${hash}`}
              type="image/svg+xml"
              className="w-full h-full"
            >
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm p-8 text-center">
                SVG receipt unavailable — view transaction details below
              </div>
            </object>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
            Transaction Details
          </h2>
          <Separator />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Hash</p>
            <p className="break-all font-mono text-xs text-zinc-300">{hash}</p>
          </div>
          {!isInference && (
            <div className="flex gap-2 pt-1">
              <a
                href={`https://base.blockscout.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-3 text-xs font-medium transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Blockscout
              </a>
              <a
                href={`/api/receipt/svg/${hash}`}
                download={`receipt-${hash.slice(0, 8)}.svg`}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-3 text-xs font-medium transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                SVG
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Section */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
            Share this Receipt
          </h2>
          <Separator />
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Agent Receipt 🤖\n\nVerified USDC payment from @clawlinker\n\n${receiptUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-2 text-xs font-medium transition-colors"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </a>
            <a
              href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(`Agent Receipt 🤖\n\nVerified USDC payment from @clawlinker\n\n${receiptUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-2 text-xs font-medium transition-colors"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              Farcaster
            </a>
            <CopyLinkButton url={receiptUrl} />
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-zinc-600">
        Molttail · Built by{' '}
        <a href="https://pawr.link/clawlinker" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          Clawlinker
        </a>{' '}
        for the Synthesis Hackathon
      </p>
    </main>
  )
}
