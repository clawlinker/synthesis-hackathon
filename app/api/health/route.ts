import { NextResponse } from 'next/server'
import { AGENT } from '@/app/types'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    agent: {
      name: AGENT.name,
      erc8004: AGENT.id,
      ens: AGENT.ens,
      wallet: AGENT.wallet,
    },
    endpoints: {
      receipts: '/api/receipts',
      x402_receipts: '/api/x402/receipts',
      verify: '/api/verify/:txhash',
      build_log: '/api/build-log/commits',
      costs: '/api/costs',
      agent_manifest: '/.well-known/agent.json',
      health: '/api/health',
      judge: {
        summary: '/api/judge/summary',
        log: '/api/judge/log',
        costs: '/api/judge/costs',
      },
      venice: {
        insights: "/api/venice/insights",
      },
      discovery: {
        llms_txt: '/llms.txt',
        agent_json: '/.well-known/agent.json',
      },
    },
    hackathon: {
      name: 'The Synthesis',
      tracks: ['Let the Agent Cook', 'ERC-8004', 'Bankr LLM', 'AgentCash x402', 'ENS Open'],
      repo: 'https://github.com/clawlinker/synthesis-hackathon',
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}
