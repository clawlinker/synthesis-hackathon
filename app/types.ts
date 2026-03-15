export interface AgentInfo {
  id: number
  name: string
  ens?: string
  avatar?: string
}

export interface Receipt {
  hash: string
  from: string
  to: string
  value: string        // raw value (6 decimals for USDC)
  amount: string       // formatted USDC amount
  timestamp: number    // unix seconds
  blockNumber: string
  direction: 'sent' | 'received'
  status: 'confirmed'
  tokenSymbol: string
  tokenDecimal: string
  // enrichment (added later)
  service?: string     // what the payment was for
  agentId?: string     // ERC-8004 ID
  fromLabel?: string
  toLabel?: string
  fromAgent?: AgentInfo
  toAgent?: AgentInfo
  notes?: string       // additional context (for inference receipts, etc)
}

export interface AgentIdentity {
  id: number           // ERC-8004 token ID
  name: string
  ens?: string
  avatar?: string
  wallet: string
}

export const AGENT: AgentIdentity = {
  id: 22945,
  name: 'Clawlinker',
  ens: 'clawlinker.eth',
  avatar: 'https://www.pawr.link/clawlinker-avatar.png',
  wallet: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
}

export const BANKR_AGENT: AgentIdentity = {
  id: 0,
  name: 'Bankr (Clawlinker)',
  avatar: 'https://bankr.xyz/favicon.png',
  wallet: '0x4de988e65a32a12487898c10bc63a88abea2e292',
}

export const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const CHAIN_ID = 8453  // Base

export const AGENTS = [AGENT, BANKR_AGENT] as const
export type AgentKey = typeof AGENTS[number]['wallet']
