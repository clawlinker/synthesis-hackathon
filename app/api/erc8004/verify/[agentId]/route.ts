// ERC-8004 Agent Verification API
// Directly queries the ERC-8004 registry contract on Ethereum mainnet
// to verify agent identity and retrieve registration details.

import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// ERC-8004 Registry ABI (minimal for verification)
const ERC8004_ABI = [
  {
    type: 'function',
    name: 'getAgent',
    stateMutability: 'view',
    inputs: [{ type: 'uint256', name: 'agentId' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'address', name: 'owner' },
          { type: 'address', name: 'operator' },
          { type: 'string', name: 'uri' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'isOperator',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'operator' },
      { type: 'address', name: 'agentOwner' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'agentCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const

const ERC8004_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const

// Create public client for Ethereum mainnet
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com'),
  pollingInterval: 1000,
})

// Cache for agent verification results (5 minute TTL)
interface VerificationCacheEntry {
  data: ERC8004VerificationResult
  expires: number
}

const verificationCache = new Map<string, VerificationCacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export interface ERC8004VerificationResult {
  agentId: number
  registered: boolean
  owner: string | null
  operator: string | null
  uri: string | null
  timestamp: number | null
  verified: boolean
  registry: {
    address: string
    chain: string
    explorer: string
  }
  validation: {
    identity: boolean
    operator: boolean
    uri: boolean
  }
}

// Helper to format address as checksummed
function toChecksumAddress(address: string): string {
  if (!address.startsWith('0x')) return address
  return address as `0x${string}`
}

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

  const cacheKey = `agent-${agentId}`

  // Check cache
  const cached = verificationCache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(cached.data)
  }

  try {
    // Query ERC-8004 registry contract
    const result = await publicClient.readContract({
      address: ERC8004_ADDRESS,
      abi: ERC8004_ABI,
      functionName: 'getAgent',
      args: [BigInt(agentId) as bigint],
    })

    // Parse the result tuple: [owner, operator, uri]
    const resultTuple = result as unknown as [string, string, string]
    const [owner, operator, uri] = resultTuple

    const timestamp = await getAgentTimestamp(agentId)

    const verification: ERC8004VerificationResult = {
      agentId,
      registered: !!owner,
      owner: owner ? (owner as string) : null,
      operator: operator ? (operator as string) : null,
      uri: uri ? (uri as string) : null,
      timestamp: timestamp ?? null,
      verified: !!owner,
      registry: {
        address: ERC8004_ADDRESS,
        chain: 'eip155:1',
        explorer: `https://www.8004scan.io/agents/ethereum/${agentId}`,
      },
      validation: {
        identity: !!owner && owner !== '0x0000000000000000000000000000000000000000',
        operator: !!(operator && operator !== '0x0000000000000000000000000000000000000000'),
        uri: !!uri && uri.length > 0,
      },
    }

    // Cache the result
    verificationCache.set(cacheKey, {
      data: verification,
      expires: Date.now() + CACHE_TTL,
    })

    return NextResponse.json(verification)

  } catch (error) {
    // Check if it's a "agent not found" error (returns zero address)
    if (error instanceof Error && error.message.includes('execution reverted')) {
      const notFound: ERC8004VerificationResult = {
        agentId,
        registered: false,
        owner: null,
        operator: null,
        uri: null,
        timestamp: null,
        verified: false,
        registry: {
          address: ERC8004_ADDRESS,
          chain: 'eip155:1',
          explorer: `https://www.8004scan.io/agents/ethereum/${agentId}`,
        },
        validation: {
          identity: false,
          operator: false,
          uri: false,
        },
      }
      return NextResponse.json(notFound, { status: 404 })
    }

    // Return cached result if available (stale-while-revalidate)
    if (cached) {
      return NextResponse.json({ ...cached.data, cached: true })
    }

    return NextResponse.json(
      {
        agentId,
        registered: false,
        error: 'Failed to verify agent',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

// Helper to get agent registration timestamp from events
async function getAgentTimestamp(agentId: number): Promise<number | null> {
  try {
    // Query Transfer event for registration timestamp
    // ERC-8004 uses Transfer event for agent registration
    // Define the Transfer event ABI to get proper args typing
    const transferEventAbi = {
      anonymous: false,
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'agentId', type: 'uint256', indexed: false },
      ],
      name: 'Transfer',
      type: 'event',
    } as const

    const events = await publicClient.getLogs({
      address: ERC8004_ADDRESS,
      event: transferEventAbi,
      fromBlock: BigInt(20000000),
      toBlock: 'latest',
    })

    // Filter events for our specific agentId
    const matchingEvents = events.filter((event) => {
      if (!event.args) return false
      const args = event.args as { agentId: bigint }
      return args.agentId === BigInt(agentId)
    })

    if (matchingEvents.length > 0) {
      const block = await publicClient.getBlock({ blockNumber: matchingEvents[0].blockNumber })
      return block?.timestamp ? Number(block.timestamp) : null
    }

    return null
  } catch {
    return null
  }
}

// Cleanup old cache entries
function cleanupCache() {
  const now = Date.now()
  for (const [key, entry] of verificationCache.entries()) {
    if (now > entry.expires) {
      verificationCache.delete(key)
    }
  }
}

// Run cleanup every 10 minutes
setInterval(() => {
  cleanupCache()
}, 10 * 60 * 1000)