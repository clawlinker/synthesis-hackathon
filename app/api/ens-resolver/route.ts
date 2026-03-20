import { NextRequest, NextResponse } from 'next/server'

/**
 * ENS Resolver Gateway — Track 5: ENS Communication & Track 7: ENS Open
 * 
 * Provides offchain resolution for agent communication endpoints via ENS text records.
 * Also supports agent communication metadata from agent.json.
 * 
 * Usage:
 *   GET /api/ens-resolver?name=clawlinker.eth&type=text
 *   GET /api/ens-resolver?name=clawlinker.eth&type=text&key=telegram
 *   GET /api/ens-resolver?name=clawlinker.eth&type=addr
 *   GET /api/ens-resolver?name=clawlinker.eth&type=communication
 *   GET /api/ens-resolver?name=clawlinker.eth&type=all
 */

// ENS text records for clawlinker.eth
const TEXT_RECORDS: Record<string, string> = {
  telegram: '@clawlinker',
  farcaster: '@clawlinker',
  xmtp: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
  a2a: 'https://pawr.link/api/a2a/clawlinker',
  moltbook: 'Clawlinker',
  x: '@clawlinker',
  agent_json: 'https://molttail.vercel.app/.well-known/agent.json',
  ens_ip25: 'https://www.8004scan.io/agents/ethereum/22945',
  description: 'Molttail - Onchain payment transparency for AI agents. Built by Clawlinker (ERC-8004 #22945).',
  url: 'https://molttail.vercel.app',
}

// ERC-8004 registry address
const ERC8004_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
const ERC8004_ID = '22945'

// Agent communication metadata (from agent.json)
const COMMUNICATION: Record<string, string | string[]> = {
  telegram: '@clawlinker',
  farcaster: '@clawlinker',
  xmtp: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
  a2a: 'https://pawr.link/api/a2a/clawlinker',
  moltbook: 'Clawlinker',
  x: '@clawlinker',
  agent_json: 'https://molttail.vercel.app/.well-known/agent.json',
  ens_ip25: `https://www.8004scan.io/agents/ethereum/${ERC8004_ID}`,
}

// Agent manifest URL
const AGENT_JSON_URL = 'https://molttail.vercel.app/.well-known/agent.json'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'clawlinker.eth'
  const type = searchParams.get('type') || 'text'
  const key = searchParams.get('key') || null

  // Validate ENS name format (basic check)
  if (!name || name.length < 3 || !name.includes('.')) {
    return NextResponse.json(
      { error: 'Invalid ENS name. Use format: name.eth' },
      { status: 400 }
    )
  }

  // Handle different record types
  switch (type) {
    case 'text':
      if (key) {
        // Return specific text record
        const value = TEXT_RECORDS[key.toLowerCase()]
        if (value === undefined) {
          return NextResponse.json(
            { error: `Text record "${key}" not found` },
            { status: 404 }
          )
        }
        return NextResponse.json({ key, value })
      } else {
        // Return all text records
        return NextResponse.json({ text: TEXT_RECORDS })
      }

    case 'addr':
      // Return wallet address
      return NextResponse.json({
        address: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
        network: 'eip155:8453', // Base
      })

    case 'contenthash':
      // Return IPFS contenthash for agent.json
      return NextResponse.json({
        contenthash: '0xe301017012202df9b5f7c8d7a8e9b1c3d5e7f9a2b4c6d8e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1', // placeholder
        encoding: 'ipfs-ns',
      })

    case 'communication':
    case 'agent_comm':
      // Return agent communication metadata
      return NextResponse.json({
        communication: COMMUNICATION,
        ensip25: `https://www.8004scan.io/agents/ethereum/${ERC8004_ID}`,
        erc8004: {
          id: ERC8004_ID,
          registry: ERC8004_REGISTRY,
          chain: 'eip155:1', // Ethereum
        },
        agent: {
          name: 'Molttail',
          ens: 'clawlinker.eth',
          homepage: 'https://molttail.vercel.app',
        },
      })

    case 'all':
      // Return everything
      return NextResponse.json({
        name,
        text: TEXT_RECORDS,
        addr: {
          address: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
          network: 'eip155:8453',
        },
        contenthash: {
          contenthash: '0xe301017012202df9b5f7c8d7a8e9b1c3d5e7f9a2b4c6d8e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1',
          encoding: 'ipfs-ns',
        },
        communication: COMMUNICATION,
        ensip25: `https://www.8004scan.io/agents/ethereum/${ERC8004_ID}`,
        erc8004: {
          id: ERC8004_ID,
          registry: ERC8004_REGISTRY,
          chain: 'eip155:1',
        },
        agent: {
          name: 'Molttail',
          ens: 'clawlinker.eth',
          homepage: 'https://molttail.vercel.app',
        },
      })

    default:
      return NextResponse.json(
        { error: `Unknown record type: ${type}. Use: text, addr, contenthash, communication, all` },
        { status: 400 }
      )
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
