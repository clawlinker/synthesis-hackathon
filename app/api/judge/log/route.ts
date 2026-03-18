import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

export async function GET() {
  try {
    // Next.js JSON import returns { default: [...] } or just [...]
    // Handle both cases for robustness
    const raw = agentLogRaw as any
    const entries = Array.isArray(raw) ? raw : (raw as any).default ?? []
    
    return NextResponse.json({
      entries,
      total: entries.length,
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load agent log' }, { status: 500 })
  }
}
