// ERC-8004 Agent Registry resolver
// Maps wallet addresses to agent identities

import { type AgentIdentity } from '@/app/types'

// Known agents from our wallet interactions
export const AGENT_REGISTRY: Record<string, AgentIdentity> = {
  '0x5793bfc1331538c5a8028e71cc22b43750163af8': {
    id: 22945,
    name: 'Clawlinker',
    ens: 'clawlinker.eth',
    avatar: 'https://www.pawr.link/clawlinker-avatar.png',
    wallet: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
  },
  '0x5776d6d49132516709e11e6e3676e43750163af8': {
    id: 20001,
    name: 'x402 Facilitator',
    ens: undefined,
    avatar: 'https://x402.xyz/favicon.png',
    wallet: '0x5776d6d49132516709e11e6e3676e43750163af8',
  },
  '0x9c9563816900f862356b243750163af850163af8': {
    id: 30001,
    name: 'Virtuals Agent',
    ens: undefined,
    avatar: 'https://virtuals.io/img/logo.png',
    wallet: '0x9c9563816900f862356b243750163af850163af8',
  },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    id: 10001,
    name: 'Safe (USDC)',
    ens: 'safe.matic.eth',
    avatar: 'https://safe.global/favicon.ico',
    wallet: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
}

// Reverse lookup: address -> agent identity
export function resolveAgent(address: string): AgentIdentity | undefined {
  const addr = address.toLowerCase()
  return AGENT_REGISTRY[addr]
}

// Check if address is a registered agent
export function isAgent(address: string): boolean {
  return !!resolveAgent(address)
}
