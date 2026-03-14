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

export const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const CHAIN_ID = 8453  // Base
