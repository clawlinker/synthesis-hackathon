import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LOG_PATH = '/root/synthesis-hackathon/agent_log.json'

export async function GET() {
  try {
    const data = fs.readFileSync(LOG_PATH, 'utf-8')
    const logs = JSON.parse(data)
    
    return NextResponse.json({ logs })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch agent log' }, { status: 500 })
  }
}
