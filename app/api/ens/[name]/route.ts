// ENS Resolution API Endpoint
// Resolves ENS names to addresses using the free ensdata.net API
// Caches results in memory for 1 hour

import { NextResponse } from 'next/server'

// In-memory cache with TTL (1 hour = 3600000 ms)
interface CacheEntry {
  data: EnsoResponse
  expires: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface EnsoResponse {
  name: string
  address?: string
  avatar?: string
  resolved: boolean
  error?: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const ensName = (await params).name

  if (!ensName || !ensName.endsWith('.eth')) {
    return NextResponse.json(
      { error: 'Invalid ENS name. Must end with .eth' },
      { status: 400 }
    )
  }

  const cacheKey = ensName.toLowerCase()

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(cached.data)
  }

  try {
    // Fetch from ensdata.net API (free, no API key required)
    const response = await fetch(`https://ensdata.net/${ensName}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Next.js revalidation (1 hour)
    })

    if (!response.ok) {
      throw new Error(`ensdata.net API returned ${response.status}`)
    }

    const data = await response.json()

    // Parse the response
    // ensdata.net returns { address: "...", avatar: "...", name: "..." }
    const resolvedAddress = typeof data === 'object' && data !== null ? data.address : undefined
    const resolvedAvatar = typeof data === 'object' && data !== null ? data.avatar : undefined

    const result: EnsoResponse = {
      name: ensName,
      address: resolvedAddress,
      avatar: resolvedAvatar,
      resolved: !!resolvedAddress,
    }

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      expires: Date.now() + CACHE_TTL,
    })

    return NextResponse.json(result)

  } catch (error) {
    // Return cached result if available (stale-while-revalidate)
    if (cached) {
      return NextResponse.json({ ...cached.data, cached: true })
    }

    return NextResponse.json(
      {
        name: ensName,
        resolved: false,
        error: 'Failed to resolve ENS name',
      },
      { status: 500 }
    )
  }
}

// Cleanup old cache entries (runs on every request, minimal overhead)
function cleanupCache() {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expires) {
      cache.delete(key)
    }
  }
}

// Run cleanup every 10 minutes (infinite loop, non-blocking)
setInterval(() => {
  cleanupCache()
}, 10 * 60 * 1000)
