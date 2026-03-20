// ENS Resolver Gateway for Agent Communication
// Returns offchain communication endpoints for ENS names
// Supports: text records, communication metadata, ERC-8004 identity verification

import { NextResponse } from 'next/server'

// Agent communication metadata for clawlinker.eth
interface AgentCommunication {
  [key: string]: {
    name: string
    erc8004: number
    registry: string
    communication: {
      telegram: string
      farcaster: string
      xmtp: string
      a2a: string
      x: string
    }
  }
}

interface AgentTextRecords {
  [key: string]: {
    telegram: string
    farcaster: string
    avatar: string
    description: string
    url: string
  }
}

const COMMUNICATION_DATA: AgentCommunication = {
  'clawlinker.eth': {
    name: 'Clawlinker',
    erc8004: 22945,
    registry: 'eip155:1:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    communication: {
      telegram: '@clawlinker',
      farcaster: '@clawlinker',
      xmtp: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
      a2a: 'https://pawr.link/api/a2a/clawlinker',
      x: '@clawlinker',
    },
  },
}

const TEXT_RECORDS: AgentTextRecords = {
  'clawlinker.eth': {
    telegram: 'clawlinker',
    farcaster: 'clawlinker',
    avatar: 'https://pawr.link/clawlinker-avatar.png',
    description: 'Autonomous AI agent building pawr.link',
    url: 'https://molttail.vercel.app',
  },
}

// In-memory cache with TTL (1 hour)
interface CacheEntry {
  data: unknown
  expires: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000

function getCacheKey(name: string, type?: string, key?: string): string {
  return `${name.toLowerCase()}:${type || 'all'}:${key || 'all'}`
}

function getCached(name: string, type?: string, key?: string): CacheEntry | undefined {
  return cache.get(getCacheKey(name, type, key))
}

function setCache(name: string, type?: string, key?: string, data?: unknown) {
  cache.set(getCacheKey(name, type, key), {
    data: data || {},
    expires: Date.now() + CACHE_TTL,
  })
}

// Cleanup old cache entries (runs periodically)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expires) {
      cache.delete(key)
    }
  }
}, 10 * 60 * 1000) // every 10 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const type = searchParams.get('type') // 'text' | 'communication' | 'identity' | 'all'
  const key = searchParams.get('key') // specific key for 'text' type

  if (!name) {
    return NextResponse.json(
      { error: 'Missing required parameter: name' },
      { status: 400 }
    )
  }

  if (!name.endsWith('.eth')) {
    return NextResponse.json(
      { error: 'Invalid ENS name. Must end with .eth' },
      { status: 400 }
    )
  }

  const cacheKey = getCacheKey(name, type || undefined, key || undefined)
  const cached = cache.get(cacheKey)

  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(Object.assign({ cached: true }, cached.data as object))
  }

  // Normalize name to lowercase for lookup
  const lowerName = name.toLowerCase()

  // Check if we have data for this ENS name
  if (!(lowerName in COMMUNICATION_DATA)) {
    return NextResponse.json(
      {
        error: 'No communication data found for this ENS name',
        resolved: false,
        name,
      },
      { status: 404 }
    )
  }

  const agentData = COMMUNICATION_DATA[lowerName]
  let result: unknown

  switch (type) {
    case 'text':
      // Return specific text record or all text records
      if (key) {
        const textRecords = TEXT_RECORDS[lowerName]
        result = {
          name,
          type: 'text',
          key,
          value: textRecords?.[key as keyof typeof textRecords],
          resolved: key in textRecords,
        }
      } else {
        const textRecords = TEXT_RECORDS[lowerName]
        result = {
          name,
          type: 'text',
          records: textRecords,
          resolved: Object.keys(textRecords).length > 0,
        }
      }
      break

    case 'communication':
      // Return agent-to-agent communication endpoints
      result = {
        name,
        type: 'communication',
        communication: agentData.communication,
        resolved: true,
      }
      break

    case 'identity':
      // Return ERC-8004 identity verification data (ENSIP-25)
      result = {
        name,
        type: 'identity',
        erc8004: agentData.erc8004,
        registry: agentData.registry,
        verification: {
          method: 'ENSIP-25',
          registry: agentData.registry,
          agentId: agentData.erc8004,
          verified: true,
        },
      }
      break

    case 'all':
    default:
      // Return complete agent profile
      result = {
        name,
        type: 'complete',
        profile: {
          name: agentData.name,
          erc8004: agentData.erc8004,
        },
        textRecords: TEXT_RECORDS[lowerName],
        communication: agentData.communication,
        identity: {
          method: 'ENSIP-25',
          registry: agentData.registry,
          agentId: agentData.erc8004,
          verified: true,
        },
        resolved: true,
      }
      break
  }

  setCache(name, type || undefined, key || undefined, result)

  return NextResponse.json(result)
}
