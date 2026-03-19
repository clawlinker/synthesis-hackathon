import { NextResponse } from 'next/server'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

export async function GET() {
  const summaryHtml = await fetch(`${baseUrl}/api/judge/summary?format=json`).then(r => r.text())
  const data = JSON.parse(summaryHtml)
  return NextResponse.json(data)
}
