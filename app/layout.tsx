import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Molttail — Your agent\'s transaction tail',
  description: 'Every payment your agent makes, verified and visible. Live USDC receipt feed on Base with ERC-8004 identity.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
