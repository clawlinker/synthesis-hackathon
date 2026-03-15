import { type Metadata } from 'next'
import { AGENT, AGENTS } from '@/app/types'

export async function generateMetadata({ params }: { params: Promise<{ hash: string }> }): Promise<Metadata> {
  const { hash } = await params

  const agentName = AGENT.name
  const agentId = AGENT.id || '22945'
  const agentWallet = AGENT.wallet.slice(0, 6) + '…' + AGENT.wallet.slice(-4)

  return {
    title: `Agent Receipt — ${hash.slice(0, 8)}... | ${agentName}`,
    description: `Verified USDC receipt from ${agentName} (ERC-8004 #${agentId}) — Onchain proof of autonomous agent work`,
    metadataBase: new URL('https://agentreceipts.com'),
    openGraph: {
      type: 'article',
      title: `Agent Receipt — ${hash.slice(0, 8)}...`,
      description: `Verified USDC receipt from ${agentName} for autonomous agent work`,
      url: `https://agentreceipts.com/receipt/${hash}`,
      images: [
        {
          url: `/api/og/${hash}`,
          width: 1200,
          height: 630,
          alt: `Agent Receipt for ${hash.slice(0, 8)}...`,
        },
        {
          url: `/api/receipt/svg/${hash}`,
          width: 600,
          height: 350,
          alt: `SVG Receipt for ${hash.slice(0, 8)}...`,
        },
      ],
      siteName: 'Agent Receipts',
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
      canonical: `https://agentreceipts.com/receipt/${hash}`,
    },
  }
}

export default async function ReceiptPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 border-b border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Agent Receipt</h1>
              <p className="text-sm text-gray-400 mt-1">
                Verified USDC transaction proof
              </p>
            </div>
            <a
              href="https://pawr.link/clawlinker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              clawlinker.eth
            </a>
          </div>
        </header>

        {/* SVG Receipt */}
        <div className="bg-black rounded-xl border border-gray-800 p-4 mb-6">
          <div className="aspect-[600/350] w-full">
            <object
              data={`/api/receipt/svg/${hash}`}
              type="image/svg+xml"
              className="w-full h-full"
            >
              <p className="text-gray-400">SVG receipt not supported in this browser</p>
            </object>
          </div>
        </div>

        {/* Transaction Details */}
        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">Transaction Details</h2>
          <div className="bg-gray-900 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500">Transaction Hash</label>
              <div className="break-all text-sm font-mono mt-1">{hash}</div>
            </div>
            <div className="flex gap-3">
              <a
                href={`https://base.blockscout.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center text-sm font-medium transition-colors"
              >
                View on Blockscout
              </a>
              <a
                href={`/api/receipt/svg/${hash}`}
                download={`receipt-${hash.slice(0, 8)}.svg`}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium transition-colors"
              >
                Download SVG
              </a>
            </div>
          </div>
        </section>

        {/* Share Section */}
        <section className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">Share this Receipt</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </a>
            <a
              href={`https://farcaster.xyz/~/compose?text=${encodeURIComponent(`Agent Receipt 🤖\n\n${hash}\n\nVerified on Agent Receipts`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              Farcaster
            </a>
          </div>
          <p className="text-xs text-gray-500">
            Share this receipt to verify autonomous agent work onchain.
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-400">
            Agent Receipts — Onchain proof of autonomous agent work
            <br />
            Built by <a href="https://pawr.link/clawlinker" className="text-blue-400 hover:text-blue-300">Clawlinker</a> for the Synthesis Hackathon
            <br />
            <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: '#26a17b', color: 'white', opacity: 0.8 }}>
              x402 API available — /api/x402/receipts ($0.01 USDC)
            </span>
          </p>
        </footer>
      </div>
    </main>
  )
}
