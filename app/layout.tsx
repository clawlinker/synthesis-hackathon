import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent Receipts — Onchain Proof of Agent Work',
  description: 'Live visual receipt feed of an autonomous AI agent\'s x402 USDC payments on Base. ERC-8004 verified.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
