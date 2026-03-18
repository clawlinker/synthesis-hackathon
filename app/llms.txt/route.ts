import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const llmsPath = path.join(process.cwd(), 'llms.txt')
  const llmsContent = fs.readFileSync(llmsPath, 'utf8')

  return new Response(llmsContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
    },
  })
}
