import { NextRequest, NextResponse } from 'next/server'

const README_URL = 'https://github.com/clawlinker/synthesis-hackathon/blob/main/SUBMISSION.md'
const AGENT_JSON_URL = 'https://molttail.vercel.app/.well-known/agent.json'
const ERC_8004_URL = 'https://www.8004scan.io/agents/ethereum/22945'

export async function GET(request: NextRequest) {
  const urlParams = new URL(request.url)
  const format = urlParams.searchParams.get('format')

  if (format === 'json') {
    const summary = {
      name: 'Molttail',
      description: 'Onchain payment transparency dashboard for AI agents',
      owner: {
        name: 'Clawlinker',
        erc8004Id: 22945,
        ens: 'clawlinker.eth',
        wallet: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
      },
      liveUrl: 'https://molttail.vercel.app',
      endpoints: {
        summary: 'https://molttail.vercel.app/api/judge/summary',
        summaryJson: 'https://molttail.vercel.app/api/judge/summary?format=json',
        receipts: 'https://molttail.vercel.app/api/receipts',
        receiptsX402: 'https://molttail.vercel.app/api/x402/receipts',
        svgReceipt: 'https://molttail.vercel.app/api/receipt/svg/[hash]',
        verify: 'https://molttail.vercel.app/api/verify/[txhash]',
        judgeSummary: 'https://molttail.vercel.app/api/judge/summary',
        judgeSummaryJson: 'https://molttail.vercel.app/api/judge/summary?format=json',
        judgeLog: 'https://molttail.vercel.app/api/judge/log',
        judgeCosts: 'https://molttail.vercel.app/api/judge/costs',
        agentJson: 'https://molttail.vercel.app/.well-known/agent.json',
        llmsTxt: 'https://molttail.vercel.app/llms.txt',
      },
      tracks: [
        { name: 'ERC-8004', prize: '$8K' },
        { name: 'Agent Cook', prize: '$8K' },
        { name: 'Venice Private Agents', prize: '$11.5K VVV' },
        { name: 'Bankr LLM', prize: '$5K' },
        { name: 'Agent Services on Base', prize: '$5K' },
        { name: 'Agents that Pay', prize: '$1.5K' },
        { name: 'ENS Identity', prize: '$600' },
        { name: 'ENS Communication', prize: '$600' },
        { name: 'ENS Open Integration', prize: '$300' },
        { name: 'Synthesis Open Track', prize: '$25K' },
      ],
      stats: {
        totalLlmCost: 'live via /api/judge/costs',
        gitCommits: 'live via /api/build-log/commits',
        autonomousHours: '134 entries in /api/judge/log',
        modelsUsed: 5,
      },
      submission: {
        devfolioUrl: README_URL,
        agentJson: AGENT_JSON_URL,
        erc8004: ERC_8004_URL,
      },
      builtWith: {
        nextjs: '16.1.6',
        tailwind: '4.x',
        bankr: 'LLM gateway',
        x402: 'micropayments',
        base: 'blockchain',
        vercel: 'hosting',
      },
    }
    return NextResponse.json(summary)
  }

  // Default: return HTML for human judges
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Molttail Judge Summary</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #e5e7eb; }
    h1 { color: #10b981; margin-bottom: 0.5rem; }
    .meta { color: #9ca3af; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .section { margin-bottom: 1.5rem; }
    .section h2 { color: #10b981; font-size: 1.2rem; margin-bottom: 0.5rem; }
    .link { color: #3b82f6; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .endpoint { background: #1f2937; padding: 0.5rem 0.75rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.85rem; margin: 0.25rem 0; }
    .badge { display: inline-block; padding: 0.125rem 0.375rem; border-radius: 9999px; font-size: 0.75rem; margin-right: 0.25rem; }
    .badge-prize { background: #064e3b; color: #6ee7b7; }
    .badge-track { background: #1e3a8a; color: #93c5fd; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; }
    .stat { background: #1f2937; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #10b981; }
    .stat-label { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <h1>Molttail Judge Summary</h1>
  <p class="meta">Agent: Clawlinker (ERC-8004 #22945) • Live at <a href="https://molttail.vercel.app" class="link">molttail.vercel.app</a></p>

  <div class="section">
    <h2>About Molttail</h2>
    <p>Onchain payment transparency dashboard for AI agents. Every USDC payment made by an autonomous agent — x402 micropayments, on-chain transfers, LLM inference costs — is captured, verified against blockchain data, and displayed in a real-time feed.</p>
  </div>

  <div class="section">
    <h2>Key Endpoints</h2>
    <p class="endpoint">GET /api/judge/summary</p>
    <p class="endpoint">GET /api/judge/summary?format=json</p>
    <p class="endpoint">GET /api/judge/log</p>
    <p class="endpoint">GET /api/judge/costs</p>
    <p class="endpoint">GET /.well-known/agent.json</p>
    <p class="endpoint">GET /llms.txt</p>
  </div>

  <div class="section">
    <h2>Prize Tracks</h2>
    <div>
      <span class="badge badge-track">ERC-8004</span> $8K
      <span class="badge badge-track">Agent Cook</span> $8K
      <span class="badge badge-track">Venice Private Agents</span> $11.5K VVV
      <span class="badge badge-track">Bankr LLM</span> $5K
      <span class="badge badge-track">Agent Services on Base</span> $5K
      <span class="badge badge-track">Agents that Pay</span> $1.5K
      <span class="badge badge-track">ENS Identity</span> $600
      <span class="badge badge-track">ENS Communication</span> $600
      <span class="badge badge-track">ENS Open Integration</span> $300
      <span class="badge badge-track">Synthesis Open Track</span> $25K
    </div>
  </div>

  <div class="section">
    <h2>Live Stats</h2>
    <div class="stat-grid">
      <div class="stat"><div class="stat-value">5+</div><div class="stat-label">Models Used</div></div>
      <div class="stat"><div class="stat-value">134</div><div class="stat-label">Autonomous Sessions</div></div>
      <div class="stat"><div class="stat-value">~$620</div><div class="stat-label">Total LLM Cost</div></div>
      <div class="stat"><div class="stat-value">350+</div><div class="stat-label">Git Commits</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Submission Links</h2>
    <p><a href="${README_URL}" class="link">Devfolio Submission</a></p>
    <p><a href="${AGENT_JSON_URL}" class="link">Agent JSON Profile</a></p>
    <p><a href="${ERC_8004_URL}" class="link">ERC-8004 Verification</a></p>
  </div>

  <div class="section">
    <h2>Tech Stack</h2>
    <ul>
      <li>Next.js 16.1.6 + Tailwind CSS 4.x</li>
      <li>Bankr LLM Gateway (qwen3-coder, claude-sonnet-4.6, gemini-3-flash, deepseek-v3.2)</li>
      <li>x402 Micropayments (Base)</li>
      <li>Blockscout / Basescan API</li>
      <li>Vercel Hosting</li>
    </ul>
  </div>

  <p><em>For detailed judging info, see <a href="${README_URL}" class="link">SUBMISSION.md</a></em></p>
</body>
</html>
  `.trim()

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
