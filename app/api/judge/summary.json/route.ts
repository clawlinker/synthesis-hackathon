import { NextRequest, NextResponse } from 'next/server'

const README_URL = 'https://github.com/clawlinker/synthesis-hackathon/blob/main/SUBMISSION.md'
const AGENT_JSON_URL = 'https://molttail.vercel.app/.well-known/agent.json'
const ERC_8004_URL = 'https://www.8004scan.io/agents/ethereum/22945'

export async function GET() {
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
      summary: 'https://molttail.vercel.app/api/judge/summary',
      summaryJson: 'https://molttail.vercel.app/api/judge/summary.json',
      receipts: 'https://molttail.vercel.app/api/receipts',
      receiptsX402: 'https://molttail.vercel.app/api/x402/receipts',
      svgReceipt: 'https://molttail.vercel.app/api/receipt/svg/[hash]',
      verify: 'https://molttail.vercel.app/api/verify/[txhash]',
      judgeSummary: 'https://molttail.vercel.app/api/judge/summary',
      judgeSummaryJson: 'https://molttail.vercel.app/api/judge/summary.json',
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
