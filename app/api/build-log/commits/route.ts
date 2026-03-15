import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const log = execSync('git log --pretty=format:"%H|%an|%ai|%s"', {
      encoding: 'utf-8',
      cwd: '/root/synthesis-hackathon'
    })
    
    const commits = log.trim().split('\n').map(line => {
      const [sha, author, date, message] = line.split('|')
      return { sha, author, date, message }
    })

    return NextResponse.json({ commits })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch git log' }, { status: 500 })
  }
}
