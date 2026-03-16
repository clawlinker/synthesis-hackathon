import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

export async function GET() {
  try {
    return NextResponse.json({ logs: agentLogRaw })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch agent log' }, { status: 500 })
  }
}
