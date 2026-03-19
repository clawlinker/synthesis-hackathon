import { NextRequest, NextResponse } from 'next/server'

const README_URL = 'https://github.com/clawlinker/synthesis-hackathon/blob/main/SUBMISSION.md'
const AGENT_JSON_URL = 'https://molttail.vercel.app/.well-known/agent.json'
const ERC_8004_URL = 'https://www.8004scan.io/agents/ethereum/22945'
const BUILD_LOG_URL = 'https://molttail.vercel.app/api/build-log/commits'

async function fetchCommits() {
  try {
    const res = await fetch(BUILD_LOG_URL, { next: { revalidate: 60 } })
    if (res.ok) {
      const data = await res.json()
      return data.commits.slice(0, 10).map((c: any) => ({
        sha: c.sha,
        message: c.message,
        date: c.author?.date || new Date().toISOString(),
        author: c.author?.name || 'Unknown',
      }))
    }
  } catch {
    // Fallback to static commits if fetch fails
    return [
      { sha: '80488d4', message: '🔍 judge-review: Add /api/judge/summary/json route for JSON output', date: '2026-03-19T20:05:21Z', author: 'clawlinker' },
      { sha: '4c5cac2', message: '🔍 judge-review: Fix AGENTS.md ERC-8004 identity (22945 only, not 28805)', date: '2026-03-19T20:04:54Z', author: 'clawlinker' },
      { sha: '8bbbc68', message: '🔍 judge-review: Fix judge summary JSON endpoint to use dedicated route', date: '2026-03-19T13:04:44Z', author: 'clawlinker' },
      { sha: 'e9e14ec', message: '🧹 commit orphaned changes', date: '2026-03-19T11:55:11Z', author: 'clawlinker' },
      { sha: 'b4a5260', message: '🔍 judge-review: Fix judge summary JSON endpoint route structure', date: '2026-03-19T10:05:08Z', author: 'clawlinker' },
      { sha: '3d691fa', message: '🔍 judge-review: Fix filter badge to include search filter in active count', date: '2026-03-19T09:04:15Z', author: 'clawlinker' },
      { sha: '0bf3f57', message: '🔍 judge-review: Sync agent.json version to 1.4.0 to match .well-known/agent.json', date: '2026-03-19T07:04:53Z', author: 'clawlinker' },
      { sha: '72ee23b', message: '🔍 judge-review: Add cost source disclaimer to judge summary for clarity', date: '2026-03-19T05:05:43Z', author: 'clawlinker' },
      { sha: 'd32fcf5', message: '🔍 judge-review: Fix /api/judge/summary.json endpoint by adding dedicated route', date: '2026-03-19T04:04:18Z', author: 'clawlinker' },
      { sha: '0d8be11', message: '🧹 commit orphaned changes', date: '2026-03-19T03:55:50Z', author: 'clawlinker' },
    ]
  }
  return []
}

export async function GET() {
  const recentCommits = await fetchCommits()
  const summary = {
    name: 'Molttail',
    description: 'Onchain payment transparency dashboard for AI agents',
    owner: {
      name: 'Clawlinker',
      erc8004Id: 22945,
      ens: 'clawlinker.eth',
      wallet: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    },
    liveUrl: 'https://molttail.vercel.app',
    endpoints: {
      summaryHtml: 'https://molttail.vercel.app/api/judge/summary',
      summary: 'https://molttail.vercel.app/api/judge/summary?format=json',
      receipts: 'https://molttail.vercel.app/api/receipts',
      receiptsX402: 'https://molttail.vercel.app/api/x402/receipts',
      svgReceipt: 'https://molttail.vercel.app/api/receipt/svg/[hash]',
      verify: 'https://molttail.vercel.app/api/verify/[txhash]',
      judgeSummary: 'https://molttail.vercel.app/api/judge/summary',
      judgeSummaryJson: 'https://molttail.vercel.app/api/judge/summary?format=json',
      judgeLog: 'https://molttail.vercel.app/api/judge/log',
      judgeCosts: 'https://molttail.vercel.app/api/judge/costs',
      agentJson: 'https://molttail.vercel.app/.well-known/agent.json',
      llmsTxt: 'https://molttail.vercel.app/llms.txt',
    },
    tracks: [
      { name: 'ERC-8004', prize: '$8K' },
      { name: 'Agent Cook', prize: '$8K' },
      { name: 'Venice Private Agents', prize: '$11.5K VVV' },
      { name: 'Bankr LLM', prize: '$5K' },
      { name: 'Agent Services on Base', prize: '$5K' },
      { name: 'Agents that Pay', prize: '$1.5K' },
      { name: 'ENS Identity', prize: '$600' },
      { name: 'ENS Communication', prize: '$600' },
      { name: 'ENS Open Integration', prize: '$300' },
      { name: 'Synthesis Open Track', prize: '$25K' },
    ],
    stats: {
      totalLlmCost: 'live via /api/judge/costs',
      gitCommits: 'live via /api/build-log/commits',
      autonomousHours: '134 entries in /api/judge/log',
      modelsUsed: 5,
    },
    recentCommits,
    submission: {
      devfolioUrl: README_URL,
      agentJson: AGENT_JSON_URL,
      erc8004: ERC_8004_URL,
    },
    builtWith: {
      nextjs: '16.1.6',
      tailwind: '4.x',
      bankr: 'LLM gateway',
      x402: 'micropayments',
      base: 'blockchain',
      vercel: 'hosting',
    },
  }
  return NextResponse.json(summary)
}
