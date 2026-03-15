'use client'

import { type Receipt } from '@/app/types'
import { AGENT } from '@/app/types'

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export function ReceiptSVG({ receipt, width = 600, height = 350 }: { receipt: Receipt; width?: number; height?: number }) {
  const isSent = receipt.direction === 'sent'

  // SVG color scheme matching app globals
  const colors = {
    background: '#0a0a0a',
    cardBackground: '#111111',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#606060',
    usdc: '#26a17b',
    sentBg: 'rgba(220, 38, 38, 0.1)',
    sentText: '#ef4444',
    receivedBg: 'rgba(34, 197, 94, 0.1)',
    receivedText: '#22c55e',
    border: '#222222',
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          width,
          height,
          background: colors.background,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Header: direction badge + service */}
        <div
          style={{
            padding: '16px 20px 8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: '9999px',
                background: isSent ? colors.sentBg : colors.receivedBg,
                color: isSent ? colors.sentText : colors.receivedText,
              }}
            >
              {isSent ? '↑ Sent' : '↓ Received'}
            </span>
            {receipt.service && (
              <span style={{ fontSize: '12px', color: colors.textMuted }}>{receipt.service}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 600, color: colors.textPrimary }}>
              {isSent ? '-' : '+'}{receipt.amount}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: colors.usdc }}>USDC</span>
          </div>
        </div>

        {/* Addresses section */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderTop: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                fontSize: '10px',
                fontWeight: 600,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              From
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary, flex: 1 }}>
              {receipt.fromLabel || shortenAddress(receipt.from)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                fontSize: '10px',
                fontWeight: 600,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              To
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary, flex: 1 }}>
              {receipt.toLabel || shortenAddress(receipt.to)}
            </span>
          </div>
        </div>

        {/* Footer: time + links */}
        <div
          style={{
            padding: '12px 20px 16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: colors.textMuted,
          }}
        >
          <span>{formatTime(receipt.timestamp)} UTC</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {receipt.agentId && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🤖</span>
                <span>ERC-8004 #{receipt.agentId}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Branding */}
      <div
        style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '10px',
          color: colors.textMuted,
        }}
      >
        <span>Agent Receipts — </span>
        <a href="https://pawr.link/clawlinker" style={{ color: colors.usdc, textDecoration: 'none' }}>
          Clawlinker
        </a>
        <span> | Synthesis Hackathon</span>
      </div>
    </div>
  )
}
