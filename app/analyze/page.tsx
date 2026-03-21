'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AnalysisBreakdown {
  category: string
  amount: string
  count: number
  pct: number
}

interface AnalysisResult {
  wallet: string
  chain: string
  analysis: {
    txCount: number
    timeRange: { first: string; last: string; days: number }
    totalSent: string
    totalReceived: string
    netFlow: string
    breakdown: AnalysisBreakdown[]
    topRecipients: Array<{ address: string; label: string; amount: string; count: number }>
    anomalies: Array<{ type: string; detail: string }>
    healthScore: number
    healthLabel: string
  }
  llmSummary: string | null
  note?: string
  agent: { id: number; name: string; ens: string; erc8004: string }
  meta: {
    model: string | null
    analysisCostUsd: number
    x402Price: string
    currency: string
    network: string
    analyzedAt: string
    txsFetched: number
  }
}

function healthColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function healthBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 ring-green-500/20'
  if (score >= 60) return 'bg-yellow-500/10 ring-yellow-500/20'
  if (score >= 40) return 'bg-orange-500/10 ring-orange-500/20'
  return 'bg-red-500/10 ring-red-500/20'
}

function formatAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function AnalyzePage() {
  const [wallet, setWallet] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<Record<string, unknown> | null>(null)

  async function handleAnalyze() {
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Enter a valid Ethereum address (0x…)')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setPaymentInfo(null)

    try {
      // First, show the 402 payment info
      const gateRes = await fetch(`/api/x402/analyze?wallet=${wallet}`)
      if (gateRes.status === 402) {
        const gateData = await gateRes.json()
        setPaymentInfo(gateData)
      }

      // For demo: fetch without payment to show the 402 response
      // Real paid requests would use x402-fetch with a signer
      setLoading(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      setLoading(false)
    }
  }

  // Demo mode: show a pre-cached result for our Bankr wallet
  async function handleDemo() {
    setLoading(true)
    setError(null)
    setPaymentInfo(null)
    setWallet('0x4de988e65a32a12487898c10bc63a88abea2e292')

    try {
      const res = await fetch('/api/x402/analyze?wallet=0x4de988e65a32a12487898c10bc63a88abea2e292')
      if (res.status === 402) {
        const data = await res.json()
        setPaymentInfo(data)
      }
      setLoading(false)
    } catch {
      setError('Demo request failed')
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Wallet Analyzer</h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI-powered USDC spending analysis on Base · $0.50 via x402
        </p>
      </div>

      {/* Input */}
      <Card className="border-zinc-800/40 bg-zinc-900/50">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x… wallet address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1 border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-600"
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-usdc/90 text-zinc-950 hover:bg-usdc font-medium"
            >
              {loading ? 'Analyzing…' : 'Analyze'}
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleDemo}
              className="text-xs text-zinc-500 hover:text-usdc transition-colors"
            >
              Try demo wallet →
            </button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Payment Required Info */}
      {paymentInfo && (
        <div className="mt-6 space-y-4">
          <Card className="border-usdc/20 bg-usdc/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-usdc animate-pulse" />
                <span className="text-sm font-medium text-usdc">Payment Required — $0.50 USDC</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                This endpoint requires an x402 payment. Use <code className="text-zinc-300">x402-fetch</code> to make a paid request programmatically:
              </p>
              <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-400 leading-relaxed">
{`import { wrapFetchWithPayment, createSigner } from 'x402-fetch'

const signer = await createSigner('base', PRIVATE_KEY)
const fetchPaid = wrapFetchWithPayment(fetch, signer)

const res = await fetchPaid(
  'https://molttail.vercel.app/api/x402/analyze?wallet=${wallet || '0x…'}'
)
const data = await res.json()
console.log(data.analysis) // health score, breakdown, anomalies`}
              </pre>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-zinc-800/50 p-2">
                  <span className="text-zinc-500">Network</span>
                  <span className="ml-2 text-zinc-300">Base (USDC)</span>
                </div>
                <div className="rounded bg-zinc-800/50 p-2">
                  <span className="text-zinc-500">Pay to</span>
                  <span className="ml-2 text-zinc-300 font-mono">{formatAddr((paymentInfo as { accepts?: Array<{ payTo?: string }> })?.accepts?.[0]?.payTo || '')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What you get */}
          <Card className="border-zinc-800/40 bg-zinc-900/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">What you get</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📊', label: 'Health Score', desc: '0-100 composite rating' },
                  { icon: '🏷️', label: 'Spending Breakdown', desc: 'Categorized by counterparty' },
                  { icon: '⚠️', label: 'Anomaly Detection', desc: 'Z-score outlier flagging' },
                  { icon: '🤖', label: 'AI Summary', desc: 'Qwen Coder analysis' },
                ].map((f) => (
                  <div key={f.label} className="rounded-lg bg-zinc-800/30 p-2.5">
                    <div className="text-base mb-0.5">{f.icon}</div>
                    <div className="text-xs font-medium text-zinc-300">{f.label}</div>
                    <div className="text-[10px] text-zinc-500">{f.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Result (if we had a paid response) */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Health Score */}
          <Card className={`border ring-1 ${healthBg(result.analysis.healthScore)}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`text-4xl font-bold ${healthColor(result.analysis.healthScore)}`}>
                {result.analysis.healthScore}
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-200">{result.analysis.healthLabel}</div>
                <div className="text-xs text-zinc-500">
                  {result.analysis.txCount} txs over {result.analysis.timeRange.days} days
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-zinc-800/40 bg-zinc-900/50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-zinc-500">Sent</div>
                <div className="text-lg font-bold text-red-400">${result.analysis.totalSent}</div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800/40 bg-zinc-900/50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-zinc-500">Received</div>
                <div className="text-lg font-bold text-green-400">${result.analysis.totalReceived}</div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800/40 bg-zinc-900/50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-zinc-500">Net Flow</div>
                <div className={`text-lg font-bold ${parseFloat(result.analysis.netFlow) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${result.analysis.netFlow}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LLM Summary */}
          {result.llmSummary && (
            <Card className="border-zinc-800/40 bg-zinc-900/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-zinc-500">AI Analysis</span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{result.meta.model}</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{result.llmSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* Breakdown */}
          <Card className="border-zinc-800/40 bg-zinc-900/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Spending Breakdown</h3>
              <div className="space-y-2">
                {result.analysis.breakdown.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-300">{b.category}</span>
                        <span className="text-zinc-500">${b.amount} ({b.count})</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-usdc/60"
                          style={{ width: `${Math.min(b.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 w-10 text-right">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Copyable Skill for Agents */}
      <SkillSnippet />
    </main>
  )
}

// ─── Copyable Skill Snippet ──────────────────────────────

const SKILL_TEXT = `# Molttail Wallet Analyzer
Analyze any wallet's USDC spending on Base with AI insights.

## Endpoint
GET https://molttail.vercel.app/api/x402/analyze?wallet=<ADDRESS>&limit=100

## Payment
$0.50 USDC on Base via x402 protocol.
Without payment header, returns 402 with payment requirements.

## Integration (x402-fetch)
\`\`\`typescript
import { wrapFetchWithPayment, createSigner } from 'x402-fetch'

const signer = await createSigner('base', PRIVATE_KEY)
const fetchPaid = wrapFetchWithPayment(fetch, signer)

const res = await fetchPaid(
  'https://molttail.vercel.app/api/x402/analyze?wallet=0x...'
)
const data = await res.json()
// data.analysis — health score, breakdown, anomalies
// data.llmSummary — AI-generated analysis
// data.dashboardUrl — visual dashboard link to share with your human
\`\`\`

## Response
- analysis.healthScore (0-100) — wallet health rating
- analysis.breakdown — spending by counterparty with percentages
- analysis.topRecipients — biggest spending targets
- analysis.anomalies — z-score outlier flags
- llmSummary — AI-generated wallet analysis
- dashboardUrl — shareable visual dashboard for your human

## Discovery
- Agent manifest: https://molttail.vercel.app/.well-known/agent.json
- Docs: https://molttail.vercel.app/llms.txt`

function SkillSnippet() {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  function handleCopy() {
    navigator.clipboard.writeText(SKILL_TEXT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-10 border-t border-zinc-800/50 pt-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-300">Give this to your agent</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Copy this skill snippet into your agent&apos;s context so it can use the analyzer.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre
        ref={preRef}
        className="overflow-x-auto rounded-lg bg-zinc-950 border border-zinc-800/50 p-4 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap"
      >
        {SKILL_TEXT}
      </pre>
    </div>
  )
}
