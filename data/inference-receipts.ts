import { type Receipt } from '@/app/types'

// Parse agent_log.json to extract LLM inference costs as "inference receipts"
// Each entry becomes a receipt showing: service (LLM model), cost, timestamp, direction=incoming

export interface InferenceLogEntry {
  timestamp: string
  model: string
  model_cost_usd: number
  action?: string
  description?: string
  phase?: string
  cron?: string
}

export function loadInferenceReceipts(filePath: string): Receipt[] {
  let entries: any[] = []

  try {
    // We'll read this at runtime via the API route
    // For now, return empty array - will be populated by fetch
    return []
  } catch (e) {
    console.error('Failed to parse agent_log.json:', e)
    return []
  }
}

// Sample inference receipts for demonstration (when agent_log.json isn't accessible)
export const sampleInferenceReceipts: Receipt[] = [
  {
    hash: 'inference-2026-03-14-00-30-00',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '3', // 0.003 USD in USDC (300000 wei)
    amount: '0.003',
    timestamp: 1710390600,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — ideation_ranking (gemini-3-flash)',
    agentId: '22945',
    notes: '3 ideation cron outputs consolidated. Agent Receipts ranked highest.',
  },
  {
    hash: 'inference-2026-03-14-05-01-00',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '8', // 0.008 USD
    amount: '0.008',
    timestamp: 1710404460,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — karpathy_prompt_optimization (gemini-3-flash)',
    agentId: '22945',
    notes: 'Self-optimized autonomous cron prompts. v2 deployed.',
  },
  {
    hash: 'inference-2026-03-14-06-31-00',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '3', // 0.003 USD
    amount: '0.003',
    timestamp: 1710410460,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — bankr_api_research (gemini-3-flash)',
    agentId: '22945',
    notes: 'Bankr API analysis. No tx history endpoint found.',
  },
  {
    hash: 'inference-2026-03-14-10-12-00',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '120', // 0.12 USD
    amount: '0.12',
    timestamp: 1710415920,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — mvp_scaffold (claude-opus-4-6)',
    agentId: '22945',
    notes: 'Next.js 16 + Tailwind v4 scaffold, API routes, components.',
  },
  {
    hash: 'inference-2026-03-14-14-24-00',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '6', // 0.006 USD
    amount: '0.006',
    timestamp: 1710429840,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — address_labeling (gemini-3-flash)',
    agentId: '22945',
    notes: 'Address labeler mapping services to known addresses.',
  },
  {
    hash: 'inference-2026-03-14-20-45-00',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '80', // 0.08 USD
    amount: '0.08',
    timestamp: 1710448500,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — parallel_cron_pipeline (claude-opus-4-6)',
    agentId: '22945',
    notes: '5-cron parallel pipeline: builder, build-guard, code-review, drift-check, daily-summary.',
  },
  {
    hash: 'inference-2026-03-14-22-01-40',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '10', // 0.01 USD
    amount: '0.01',
    timestamp: 1710456100,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — enrich_agent_json (qwen3-coder)',
    agentId: '22945',
    notes: 'Expanded agent.json to full DevSpot spec.',
  },
  {
    hash: 'inference-2026-03-14-23-02-02',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '10', // 0.01 USD
    amount: '0.01',
    timestamp: 1710460322,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — erc8004_identity_resolution (qwen3-coder)',
    agentId: '22945',
    notes: 'ERC-8004 agent registry with identity resolution.',
  },
  {
    hash: 'inference-2026-03-15-00-32-17',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '10', // 0.01 USD
    amount: '0.01',
    timestamp: 1710467537,
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '2',
    service: 'Bankr LLM — multi_wallet_support (qwen3-coder)',
    agentId: '22945',
    notes: 'Bankr wallet support with selector to view receipts per wallet.',
  },
]
