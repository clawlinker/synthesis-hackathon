'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Receipts' },
  { href: '/costs', label: 'LLM Costs' },
  { href: '/build-log', label: 'Build Log' },
  { href: '/judge', label: 'Judge' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Logo mark — stylized receipt icon */}
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-usdc/20 to-usdc/5 ring-1 ring-usdc/20 transition-all group-hover:ring-usdc/40 group-hover:from-usdc/30">
            <svg className="h-3.5 w-3.5 text-usdc" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold tracking-tight text-zinc-100">Molt</span>
            <span className="text-sm font-bold tracking-tight text-usdc">tail</span>
          </div>
          {/* Network badge */}
          <span className="hidden items-center gap-1 rounded-full border border-zinc-800/60 bg-zinc-900/60 px-2 py-0.5 text-[10px] text-zinc-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Base
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 sm:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isActive(href)
                  ? 'text-zinc-100 bg-zinc-800/80'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute -bottom-[9px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-usdc/60" />
              )}
            </Link>
          ))}

          {/* Divider */}
          <span className="mx-1.5 h-4 w-px bg-zinc-800" />

          {/* External links as icons */}
          <a
            href="https://github.com/clawlinker/synthesis-hackathon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-300 hover:bg-zinc-800/40"
            title="Source on GitHub"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://basescan.org/address/0x5793BFc1331538C5A8028e71Cc22B43750163af8"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-300 hover:bg-zinc-800/40"
            title="View on BaseScan"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-100 hover:bg-zinc-800/40 sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl px-4 py-3 sm:hidden">
          <ul className="flex flex-col gap-0.5">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'bg-zinc-800/80 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 border-t border-zinc-800/50 pt-3">
            <a
              href="https://github.com/clawlinker/synthesis-hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Source
            </a>
            <a
              href="https://basescan.org/address/0x5793BFc1331538C5A8028e71Cc22B43750163af8"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 text-xs text-zinc-400 hover:text-zinc-200"
            >
              BaseScan ↗
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
