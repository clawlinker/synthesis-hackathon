// ERC-8004 Agent Verification API
// Queries the 8004 registry on BOTH Base and Ethereum mainnet
// using the correct contract ABI (ownerOf + tokenURI, not getAgent).

import { NextResponse } from 'next/server'
import { resolveAgentById, type OnChainAgent } from '@/data/erc8004-onchain'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const agentIdStr = (await params).agentId
  const agentId = parseInt(agentIdStr, 10)

  if (isNaN(agentId) || agentId <= 0) {
    return NextResponse.json(
      { error: 'Invalid agent ID. Must be a positive integer.' },
      { status: 400 }
    )
  }

  // Try both chains in parallel
  const [baseResult, ethResult] = await Promise.allSettled([
    resolveAgentById(agentId, 'base'),
    resolveAgentById(agentId, 'ethereum'),
  ])

  const baseAgent = baseResult.status === 'fulfilled' ? baseResult.value : null
  const ethAgent = ethResult.status === 'fulfilled' ? ethResult.value : null

  if (!baseAgent && !ethAgent) {
    return NextResponse.json({
      agentId,
      registered: false,
      chains: { base: false, ethereum: false },
      error: `Agent #${agentId} not found on Base or Ethereum`,
    }, { status: 404 })
  }

  // Return data from whichever chain(s) have it
  const registrations: OnChainAgent[] = []
  if (baseAgent) registrations.push(baseAgent)
  if (ethAgent) registrations.push(ethAgent)

  const primary = baseAgent || ethAgent!

  return NextResponse.json({
    agentId,
    registered: true,
    verified: true,
    name: primary.name,
    description: primary.description,
    image: primary.image,
    owner: primary.owner,
    services: primary.services,
    chains: {
      base: !!baseAgent,
      ethereum: !!ethAgent,
    },
    registrations,
    registry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    explorer: `https://www.8004scan.io/agents/${primary.chain}/${agentId}`,
  }, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
