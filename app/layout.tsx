import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import NavBar from '@/components/NavBar'
import './globals.css'

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

export const metadata: Metadata = {
  title: 'Molttail — Agent Payment Receipts',
  description: 'Every payment your agent makes, verified and visible. Live audit trail for autonomous agent transactions.',
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'Molttail — Agent Payment Receipts',
    description: 'Every payment your agent makes, verified and visible. Live audit trail for autonomous agent transactions.',
    url: baseUrl,
    siteName: 'Molttail',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Molttail — Agent Payment Receipts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Molttail — Agent Payment Receipts',
    description: 'Every payment your agent makes, verified and visible. Live audit trail for autonomous agent transactions.',
    images: ['/twitter-image'],
    creator: '@clawlinker',
  },
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased font-sans`}>
        <TooltipProvider>
          <NavBar />
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
