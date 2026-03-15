import { NextResponse } from 'next/server'

// Static commits bundled at build time — works on Vercel without git or GitHub API
import staticCommits from '@/public/commits.json'

const REPO = 'clawlinker/synthesis-hackathon'
const GITHUB_API = `https://api.github.com/repos/${REPO}/commits?per_page=30`

export async function GET() {
  // On Vercel or when static data is available, serve it directly (no API call needed)
  if (staticCommits?.commits?.length > 0) {
    return NextResponse.json({ commits: staticCommits.commits, source: 'static' })
  }

  // Fallback: fetch from GitHub API (development or if static file is missing)
  try {
    const res = await fetch(GITHUB_API, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Molttail/1.0',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 300 }, // cache for 5 minutes
    })

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`)
    }

    const data = await res.json()

    const commits = (data as Array<{
      sha: string
      commit: {
        author: { name: string; date: string }
        message: string
      }
      author: { login: string; avatar_url: string } | null
      html_url: string
    }>).map((c) => ({
      sha: c.sha,
      author: c.author?.login ?? c.commit.author.name,
      date: c.commit.author.date,
      message: c.commit.message.split('\n')[0], // first line only
      html_url: c.html_url,
      avatar_url: c.author?.avatar_url ?? '',
    }))

    return NextResponse.json({ commits, source: 'github' })
  } catch (err) {
    console.error('build-log/commits error:', err)
    return NextResponse.json({ commits: [], error: String(err) }, { status: 200 })
  }
}
