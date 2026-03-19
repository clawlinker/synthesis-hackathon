import { NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

export async function GET() {
  const response = await fetch(`${baseUrl}/api/judge/summary?format=json`)
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch judge summary' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
