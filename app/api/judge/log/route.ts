import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

export async function GET() {
  try {
    // Next.js JSON import returns { default: [...] } or just [...]
    // agent_log.json is an array directly, but Next.js wraps it
    const raw = agentLogRaw as any
    const entries = Array.isArray(raw) ? raw : (Array.isArray((raw as any).default) ? (raw as any).default : [])
    
    return NextResponse.json({
      entries,
      total: entries.length,
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load agent log' }, { status: 500 })
  }
}
