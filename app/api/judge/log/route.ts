import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

export async function GET() {
  try {
    const entries = agentLogRaw as any[]
    return NextResponse.json({
      entries,
      total: entries.length,
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load agent log' }, { status: 500 })
  }
}
