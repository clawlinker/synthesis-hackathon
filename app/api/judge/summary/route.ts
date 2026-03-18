import { NextResponse } from 'next/server'
import agentLogRaw from '@/agent_log.json'
import commitsRaw from '@/public/commits.json'

export async function GET() {
  try {
    const entries = agentLogRaw as any[]
    const { commits } = commitsRaw as { commits: any[] }

    // Fallback to agent_log calculations
    let costs = {
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
    lines.push(`_Generated: ${new Date().toISOString()}_`)
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
    lines.push(`**Total LLM spend:** $${costs.total.toFixed(6)} USD`)
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
