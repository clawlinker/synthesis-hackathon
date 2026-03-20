import { NextResponse } from 'next/server'

export async function GET() {
  const response = await fetch('https://molttail.vercel.app/api/judge/summary/json')
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch judge summary JSON' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
