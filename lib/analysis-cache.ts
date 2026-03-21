/**
 * Simple in-memory cache for LLM analysis summaries.
 *
 * When an agent pays via x402 for a wallet analysis, the LLM summary
 * gets cached here. The free /wallet/[address] dashboard page can then
 * display it without re-running the LLM.
 *
 * Limitations (acceptable for hackathon):
 * - Lost on cold start / redeploy
 * - Not shared across Vercel instances
 * - TTL-based eviction (24h default)
 *
 * For production: swap with Vercel KV, Upstash Redis, or similar.
 */

interface CachedSummary {
  summary: string
  model: string
  analyzedAt: string
  wallet: string
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_ENTRIES = 500

const cache = new Map<string, { data: CachedSummary; expiresAt: number }>()

function normalizeAddress(addr: string): string {
  return addr.toLowerCase()
}

/**
 * Cache an LLM summary from a paid x402 analysis.
 */
export function cacheSummary(
  wallet: string,
  summary: string,
  model: string
): void {
  const key = normalizeAddress(wallet)

  // Evict oldest if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const oldest = Array.from(cache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0]
    if (oldest) cache.delete(oldest[0])
  }

  cache.set(key, {
    data: {
      summary,
      model,
      analyzedAt: new Date().toISOString(),
      wallet: key,
    },
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

/**
 * Retrieve a cached LLM summary for a wallet (if available and not expired).
 */
export function getCachedSummary(wallet: string): CachedSummary | null {
  const key = normalizeAddress(wallet)
  const entry = cache.get(key)

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.data
}
