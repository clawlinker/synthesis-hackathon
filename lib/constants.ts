// Core project constants - centralized to prevent inconsistency

/** Project headline for the landing page */
export const PROJECT_HEADLINE = 'Every USDC payment an AI agent makes.'
export const PROJECT_TAGLINE = 'Verified on-chain.'

/** Project metadata */
export const PROJECT_NAME = 'Molttail'
export const PROJECT_DESCRIPTION = 'Every payment your agent makes, verified and visible. Live audit trail for autonomous agent transactions.'

/** Agent identity */
export const AGENT_NAME = 'Clawlinker'
export const AGENT_ID = 22945
export const AGENT_ENS = 'clawlinker.eth'

/** Track info */
export const SYNTHESIS_TRACKS = [
  'Let the Agent Cook',
  'ERC-8004',
  'Bankr LLM',
  'AgentCash x402',
] as const

/** URLs */
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'
export const GITHUB_URL = 'https://github.com/clawlinker/synthesis-hackathon'
export const PAWR_URL = 'https://pawr.link/clawlinker'
export const ERC8004_URL = 'https://www.8004scan.io/agents/ethereum/22945'
