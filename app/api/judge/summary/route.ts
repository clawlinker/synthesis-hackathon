import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'

// Timestamp for judge summary - use current time for fresh data
const JUDGE_SUMMARY_TIMESTAMP = new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z'

// Fetch fresh commits from GitHub API at runtime for up-to-date data
async function fetchCommits(): Promise<{ commits: { sha: string; message: string; date: string; author: { login: string; avatar_url: string } }[] }> {
  try {
    const res = await fetch('https://api.github.com/repos/clawlinker/synthesis-hackathon/commits', {
      headers: { 'User-Agent': 'Molttail-Judge' },
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('GitHub API error')
    const data = await res.json()
    return {
      commits: data.map((c: any) => ({
        sha: c.sha,
        message: c.commit.message.split('\n')[0],
        date: c.commit.author.date,
        author: c.author || { login: 'clawlinker', avatar_url: '' }
      }))
    }
  } catch (err) {
    // Fallback to static file if API fails
    return { commits: [] }
  }
}

// Helper function to compute cost breakdown from agent_log.json
// Note: This filters to bankr/ models for the judge summary.
// For full LLM costs, use /api/judge/costs which fetches from Bankr API.
function computeCostBreakdown(entries: any[]) {
  const costs = {
    total: 0,
    byModel: {} as Record<string, number>,
    byPhase: {} as Record<string, number>,
  }
  for (const entry of entries) {
    const model = entry.model || ''
    const cost = entry.model_cost_usd || 0
    if (!model.startsWith('bankr/')) continue
    costs.total += cost
    costs.byModel[model] = (costs.byModel[model] || 0) + cost
    const phase = entry.phase || 'unknown'
    costs.byPhase[phase] = (costs.byPhase[phase] || 0) + cost
  }
  return costs
}

// Generate machine-readable JSON response
async function generateJSONResponse() {
  const entries = agentLogRaw as any[]
  const { commits } = await fetchCommits()
  const costs = computeCostBreakdown(entries)
  const recent = entries.slice(-20).reverse()
  const bankrRecent = recent.filter(entry => (entry.model || '').startsWith('bankr/'))

  return {
    generatedAt: JUDGE_SUMMARY_TIMESTAMP,
    project: {
      name: 'Molttail',
      description: 'Onchain payment transparency dashboard for AI agents',
      liveDemo: 'https://molttail.vercel.app',
      source: 'https://github.com/clawlinker/synthesis-hackathon'
    },
    agentIdentity: {
      name: 'Clawlinker',
      erc8004Id: 22945,
      chain: 'ethereum',
      ens: 'clawlinker.eth',
      wallet: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
      profile: 'https://www.pawr.link/clawlinker'
    },
    hackathonTracks: [
      {
        name: 'ERC-8004',
        prize: '$8,000',
        relevance: 'Agent is registered ERC-8004 #22945; dashboard shows identity',
        status: 'completed'
      },
      {
        name: 'Let the Agent Cook',
        prize: '$8,000',
        relevance: 'Agent autonomously built this app (commits, code, design)',
        status: 'completed'
      },
      {
        name: 'Bankr LLM',
        prize: '$5,000',
        relevance: 'LLM inference costs tracked and exposed via Bankr payments',
        status: 'completed'
      },
      {
        name: 'AgentCash x402',
        prize: '$1,750',
        relevance: '/api/x402/receipts endpoint requires $0.01 USDC via x402',
        status: 'completed'
      }
    ],
    llmCosts: {
      total: costs.total,
      byModel: costs.byModel,
      byPhase: costs.byPhase
    },
    recentExecution: bankrRecent.map(entry => ({
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
      phase: entry.phase || null,
      action: entry.action || null,
      model: entry.model || null,
      cost: entry.model_cost_usd ?? null
    })),
    recentCommits: commits.slice(0, 15).map(commit => ({
      sha: commit.sha,
      message: commit.message,
      date: commit.date,
      author: commit.author.login
    })),
    endpoints: {
      summaryHtml: '/api/judge/summary',
      summaryJson: '/api/judge/summary?format=json',
      fullLog: '/api/judge/log',
      costs: '/api/judge/costs',
      agentManifest: '/.well-known/agent.json',
      llmsTxt: '/llms.txt',
      health: '/api/health',
      receipts: '/api/receipts',
      x402Receipts: '/api/x402/receipts',
      buildLog: '/api/build-log/commits'
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get('format')

  // Return HTML-compatible Markdown by default (for humans)
  if (format === 'json') {
    try {
      const json = await generateJSONResponse()
      return NextResponse.json(json, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
    } catch (err) {
      return NextResponse.json({ error: 'Failed to generate judge summary' }, { status: 500 })
    }
  }

  // Default: return Markdown for human readability
  try {
    const entries = agentLogRaw as any[]
    const { commits } = await fetchCommits()
    const costs = computeCostBreakdown(entries)

    // Recent 20 log entries
    const recent = entries.slice(-20).reverse()

    // Filter recent entries to only Bankr models (consistent with cost breakdown)
    const bankrRecent = recent.filter(entry => (entry.model || '').startsWith('bankr/'))

    // Build markdown
    const lines: string[] = []

    lines.push('# Molttail — Judge Summary')
    lines.push('')
    lines.push('> Every payment your agent makes, verified and visible.')
    lines.push('')
    lines.push(`_Generated: ${JUDGE_SUMMARY_TIMESTAMP}_`)
    lines.push('')

    lines.push('## Project')
    lines.push('')
    lines.push('**Molttail** is an onchain payment transparency dashboard for AI agents.')
    lines.push('It tracks every USDC payment made by Clawlinker across Base and Ethereum,')
    lines.push('provides machine-readable receipts with LLM inference costs, and demonstrates')
    lines.push('full agent financial accountability using x402 micropayments and ERC-8004 identity.')
    lines.push('')

    lines.push('## Agent Identity')
    lines.push('')
    lines.push('| Field | Value |')
    lines.push('|-------|-------|')
    lines.push('| Name | Clawlinker |')
    lines.push('| ERC-8004 | #22945 (Ethereum mainnet) |')
    lines.push('| ENS | clawlinker.eth |')
    lines.push('| Wallet | 0x5793BFc1331538C5A8028e71Cc22B43750163af8 |')
    lines.push('| Profile | https://www.pawr.link/clawlinker |')
    lines.push('')

    lines.push('## Hackathon Tracks')
    lines.push('')
    lines.push('| Track | Prize | Relevance |')
    lines.push('|-------|-------|-----------|')
    lines.push('| ERC-8004 | $8,000 | Agent is registered ERC-8004 #22945; dashboard shows identity |')
    lines.push('| Let the Agent Cook | $8,000 | Agent autonomously built this app (commits, code, design) |')
    lines.push('| Bankr LLM | $5,000 | LLM inference costs tracked and exposed via Bankr payments |')
    lines.push('| AgentCash x402 | $1,750 | /api/x402/receipts endpoint requires $0.01 USDC via x402 |')
    lines.push('')

    lines.push('## LLM Cost Breakdown')
    lines.push('')
    lines.push(`**Total LLM spend (agent_log bankr/ models):** $${costs.total.toFixed(6)} USD`)
    lines.push('*Note: This shows LLM costs logged in agent_log.json for bankr/ model prefixes. For full LLM costs, see `/api/judge/costs` which queries the Bankr API directly.*')
    lines.push('')
    lines.push('### By Model')
    lines.push('')
    lines.push('| Model | Cost (USD) |')
    lines.push('|-------|-----------|')
    for (const [model, cost] of Object.entries(costs.byModel).sort((a, b) => (b[1] as number) - (a[1] as number))) {
      lines.push(`| ${model} | $${(cost as number).toFixed(6)} |`)
    }
    lines.push('')
    lines.push('### By Phase')
    lines.push('')
    lines.push('| Phase | Cost (USD) |')
    lines.push('|-------|-----------|')
    for (const [phase, cost] of Object.entries(costs.byPhase).sort((a, b) => (b[1] as number) - (a[1] as number))) {
      lines.push(`| ${phase} | $${(cost as number).toFixed(6)} |`)
    }
    lines.push('')

    lines.push('## Recent Execution Log (last 20 Bankr LLM entries)')
    lines.push('')
    lines.push('| Timestamp | Phase | Action | Model | Cost |')
    lines.push('|-----------|-------|--------|-------|------|')
    for (const entry of bankrRecent) {
      const ts = entry.timestamp ? new Date(entry.timestamp).toISOString().replace('T', ' ').substring(0, 19) : '-'
      const phase = entry.phase || '-'
      const action = entry.action || '-'
      const model = entry.model || '-'
      const cost = entry.model_cost_usd != null ? `$${Number(entry.model_cost_usd).toFixed(6)}` : '-'
      lines.push(`| ${ts} | ${phase} | ${action} | ${model} | ${cost} |`)
    }
    lines.push('')

    lines.push('## Git Commit History (recent)')
    lines.push('')
    for (const commit of commits.slice(0, 15)) {
      const date = commit.date ? commit.date.substring(0, 10) : ''
      lines.push(`- \`${commit.sha.substring(0, 7)}\` ${date} — ${commit.message}`)
    }
    lines.push('')

    lines.push('## Judge Endpoints')
    lines.push('')
    lines.push('| Endpoint | Method | Description |')
    lines.push('|----------|--------|-------------|')
    lines.push('| /api/judge/summary | GET | This document (text/markdown) |')
    lines.push('| /api/judge/summary?format=json | GET | Machine-readable JSON |')
    lines.push('| /api/judge/log | GET | Full execution log (JSON) |')
    lines.push('| /api/judge/costs | GET | LLM cost breakdown (JSON) |')
    lines.push('| /.well-known/agent.json | GET | ERC-8004 agent manifest (JSON) |')
    lines.push('| /llms.txt | GET | LLM-friendly project overview (text) |')
    lines.push('| /api/health | GET | Health check with endpoint discovery (JSON) |')
    lines.push('| /api/receipts | GET | USDC payment receipts (JSON) |')
    lines.push('| /api/x402/receipts | GET | x402 paid receipts — $0.01 USDC (JSON) |')
    lines.push('| /api/build-log/commits | GET | Git commit history (JSON) |')
    lines.push('')

    lines.push('## Links')
    lines.push('')
    lines.push('- **Live demo:** https://molttail.vercel.app')
    lines.push('- **Source:** https://github.com/clawlinker/synthesis-hackathon')
    lines.push('- **Judge page:** https://molttail.vercel.app/judge')
    lines.push('- **Agent profile:** https://www.pawr.link/clawlinker')
    lines.push('- **ERC-8004 registry:** https://www.8004scan.io/agents/ethereum/22945')
    lines.push('')

    const markdown = lines.join('\n')

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate judge summary' }, { status: 500 })
  }
}
