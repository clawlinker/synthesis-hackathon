import { NextResponse } from 'next/server'

// In-memory cache for agent log
let cachedLog: any[] = []
let cacheTime: number = 0
const CACHE_DURATION = 60 * 1000 // 1 minute

async function loadAgentLog(): Promise<any[]> {
  const now = Date.now()
  if (cachedLog.length > 0 && (now - cacheTime) < CACHE_DURATION) {
    return cachedLog
  }
  
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const logPath = path.join(process.cwd(), 'agent_log.json')
    const content = fs.readFileSync(logPath, 'utf8')
    cachedLog = JSON.parse(content)
    cacheTime = now
    
    return cachedLog
  } catch (err) {
    console.error('Failed to load agent_log.json:', err)
    return []
  }
}

export async function GET() {
  try {
    const entries = await loadAgentLog()
    
    return NextResponse.json({
      entries: entries.slice(0, 50), // Return last 50 entries
      total: entries.length,
      loadedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load agent log' }, { status: 500 })
  }
}
