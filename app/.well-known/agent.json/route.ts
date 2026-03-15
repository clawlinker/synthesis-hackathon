import { NextResponse } from 'next/server'
import agentManifest from '@/agent.json'

export async function GET() {
  return NextResponse.json(agentManifest, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
