// ERC-8004 On-Chain Identity Resolver
// Queries the 8004 registry contracts on Base and Ethereum mainnet
// to resolve agent identities from wallet addresses and agent IDs.

import { createPublicClient, http } from 'viem'
import { mainnet, base } from 'viem/chains'

// Same registry address on both chains
const REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const

const REGISTRY_ABI = [
  { type: 'function', name: 'ownerOf', inputs: [{ type: 'uint256', name: 'tokenId' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'tokenURI', inputs: [{ type: 'uint256', name: 'tokenId' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'getAgentWallet', inputs: [{ type: 'uint256', name: 'agentId' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address', name: 'owner' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

// Public RPC clients
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com'),
})

export interface OnChainAgent {
  agentId: number
  chain: 'base' | 'ethereum'
  owner: string
  name: string
  description: string
  image?: string
  services?: Array<{ name: string; endpoint: string }>
  active?: boolean
  verified: true // always true — came from on-chain
  registryAddress: string
}

// In-memory cache — agent data is immutable-ish (only changes on setAgentURI)
const agentCache = new Map<string, { data: OnChainAgent; expires: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Known agent IDs to check per wallet (we know these exist)
const KNOWN_AGENTS: Array<{ id: number; chain: 'base' | 'ethereum' }> = [
  { id: 22945, chain: 'ethereum' },  // Clawlinker (Ethereum)
  { id: 28805, chain: 'base' },      // Clawlinker (Base, hackathon)
]

function parseAgentURI(uri: string): { name: string; description: string; image?: string; services?: Array<{ name: string; endpoint: string }>; active?: boolean } {
  try {
    let json: Record<string, unknown>
    if (uri.startsWith('data:application/json;base64,')) {
      json = JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString())
    } else if (uri.startsWith('data:application/json,')) {
      json = JSON.parse(decodeURIComponent(uri.split(',')[1]))
    } else if (uri.startsWith('{')) {
      json = JSON.parse(uri)
    } else {
      return { name: 'Unknown Agent', description: '' }
    }
    return {
      name: (json.name as string) || 'Unknown Agent',
      description: (json.description as string) || '',
      image: json.image as string | undefined,
      services: json.services as Array<{ name: string; endpoint: string }> | undefined,
      active: json.active as boolean | undefined,
    }
  } catch {
    return { name: 'Unknown Agent', description: '' }
  }
}

function getClient(chain: 'base' | 'ethereum') {
  return chain === 'base' ? baseClient : ethClient
}

// Resolve agent by ID + chain — queries on-chain
export async function resolveAgentById(agentId: number, chain: 'base' | 'ethereum'): Promise<OnChainAgent | null> {
  const cacheKey = `${chain}:${agentId}`
  const cached = agentCache.get(cacheKey)
  if (cached && Date.now() < cached.expires) return cached.data

  const client = getClient(chain)
  try {
    const [owner, uri] = await Promise.all([
      client.readContract({ address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'ownerOf', args: [BigInt(agentId)] }),
      client.readContract({ address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'tokenURI', args: [BigInt(agentId)] }),
    ])

    const parsed = parseAgentURI(uri)
    const agent: OnChainAgent = {
      agentId,
      chain,
      owner: owner as string,
      name: parsed.name,
      description: parsed.description,
      image: parsed.image,
      services: parsed.services,
      active: parsed.active,
      verified: true,
      registryAddress: REGISTRY_ADDRESS,
    }

    agentCache.set(cacheKey, { data: agent, expires: Date.now() + CACHE_TTL })
    return agent
  } catch {
    return null
  }
}

// Resolve agent by wallet address — checks known agents, returns first match
export async function resolveAgentByWallet(address: string): Promise<OnChainAgent | null> {
  const addr = address.toLowerCase()

  // Check cache first for any agent owned by this address
  for (const [, entry] of agentCache) {
    if (entry.data.owner.toLowerCase() === addr && Date.now() < entry.expires) {
      return entry.data
    }
  }

  // Query known agents in parallel
  const results = await Promise.allSettled(
    KNOWN_AGENTS.map(({ id, chain }) => resolveAgentById(id, chain))
  )

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      if (result.value.owner.toLowerCase() === addr) {
        return result.value
      }
    }
  }

  return null
}

// Batch resolve — for enriching receipts
export async function resolveAgents(addresses: string[]): Promise<Map<string, OnChainAgent>> {
  const unique = [...new Set(addresses.map(a => a.toLowerCase()))]
  const results = new Map<string, OnChainAgent>()

  await Promise.allSettled(
    unique.map(async (addr) => {
      const agent = await resolveAgentByWallet(addr)
      if (agent) results.set(addr, agent)
    })
  )

  return results
}
