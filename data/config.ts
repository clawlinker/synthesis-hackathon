// Configuration for contract addresses and service labels
// Separated from address-labels.ts to keep concerns distinct

// Hardcoded contract addresses for service detection
export const CONTRACTS = {
  X402_FACILITATOR: '0x5776d6D49132516709E11e6E3676E43750163AF8'.toLowerCase(),
  VIRTUALS_ACP: '0x9C9563816900f862356B243750163AF850163AF8'.toLowerCase(),
  USDC_CONTRACT: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase(),
  PERMIT2: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  X402_EXACT_PERMIT2_PROXY: '0x4104000000000000000000000000000000004104',
  // Ethereum contracts
  ETH_USDC_CONTRACT: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase(),
  // Tempo contracts
  TEMPO_USDC_CONTRACT: '0x20c000000000000000000000b9537d11c60e8b50'.toLowerCase(),
  TEMPO_AGENT_WALLET: '0xf7567C97c882c759E809EaC4772932154F35ab05'.toLowerCase(),
}

// Service labels based on contract addresses
export const SERVICE_LABELS: Record<string, string> = {
  [CONTRACTS.X402_FACILITATOR.toLowerCase()]: 'x402 Facilitator',
  [CONTRACTS.VIRTUALS_ACP.toLowerCase()]: 'Virtuals ACP',
  [CONTRACTS.USDC_CONTRACT.toLowerCase()]: 'USDC Transfer',
  [CONTRACTS.PERMIT2.toLowerCase()]: 'Permit2',
  [CONTRACTS.X402_EXACT_PERMIT2_PROXY.toLowerCase()]: 'x402 Exact Permit2 Proxy',
  [CONTRACTS.ETH_USDC_CONTRACT.toLowerCase()]: 'USDC Transfer (ETH)',
  '0xdc5d8200a030798bc6227240f68b4dd9542686ef': 'Uniswap (BaseSettler)',
  '0xec9641ebdcdfcad27bc10472d26bdd61cbf71d5c': 'checkr (Social Intel)',
  '0x5b06017308c34c05ff46d6cf4a2868ec51da55af': 'pawr.link',
  '0xa6a8736f18f383f1cc2d938576933e5ea7df01a1': 'x402 Facilitator Fee',
  '0xf0c7ff3141d37e8c70b08e0afbc68aad3364ebc6': 'x402 Customer',
}

// Address labels (should match address-labels.ts)
export const ADDRESS_LABELS: Record<string, string> = {
  '0x5793bfc1331538c5a8028e71cc22b43750163af8': 'Clawlinker (Agent)',
  '0x4de988e65a32a12487898c10bc63a88abea2e292': 'Bankr (Clawlinker)',
  '0x4de9236423ccf24c084d5dfd3581177699477699': 'Bankr Wallet',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC Contract',
  '0x5776d6d49132516709e11e6e3676e43750163af8': 'x402 Facilitator (CDP)',
  '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  '0x4104000000000000000000000000000000004104': 'x402 Exact Permit2 Proxy',
  '0x3216893708d46a928ebe06990c29ead64590163a': 'Clawdia (Agent)',
  '0x6d8b2d12977f09e7b35811776994776994776994': 'DEX Screener',
  '0x9c9563816900f862356b243750163af850163af8': 'Virtuals ACP',
  '0xcb5e412977f09e7b358117769947769947769947': 'pawr.link Treasury',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC Contract (ETH)',
  // Discovered from receipt analysis
  '0xdc5d8200a030798bc6227240f68b4dd9542686ef': 'BaseSettler (Uniswap)',
  '0xec9641ebdcdfcad27bc10472d26bdd61cbf71d5c': 'checkr (Social Intel)',
  '0x5b06017308c34c05ff46d6cf4a2868ec51da55af': 'pawr.link',
  '0x071feb1cf5837d5a988ccd61eef9379cdf1f0c31': 'Bankr Top-up',
  '0x071f7dd29185a3b84406edeac50f042cdf1f0c31': 'Bankr Top-up',
  '0xbaba5d4bd641db7de8001df70c9f313b1ded8f73': 'Baba Protocol',
  '0xbaba775a0400a5e442335ceaa4820edb1ded8f73': 'Baba Protocol',
  '0xf17b5dd382b048ff4c05c1c9e4e24cfc5c6adad9': 'External Wallet',
  '0xa6a8736f18f383f1cc2d938576933e5ea7df01a1': 'x402 Facilitator Fee',
  '0xf0c7ff3141d37e8c70b08e0afbc68aad3364ebc6': 'x402 Customer',
  // Tempo chain addresses
  '0xf7567c97c882c759e809eac4772932154f35ab05': 'Clawlinker (Tempo)',
  '0x20c000000000000000000000b9537d11c60e8b50': 'USDC.e (Tempo)',
}

// ENS names for known addresses (lowercase address -> ENS name)
// Maps addresses that appear in receipts to their human-readable ENS names
export const ENS_NAMES: Record<string, string> = {
  '0x5793bfc1331538c5a8028e71cc22b43750163af8': 'clawlinker.eth',
  '0x4de988e65a32a12487898c10bc63a88abea2e292': 'bankr.eth',
  '0x4de9236423ccf24c084d5dfd3581177699477699': 'bankr-wallet.eth',
  '0x3216893708d46a928ebe06990c29ead64590163a': 'clawdia.eth',
}

// Rate limiting configuration
export const RATE_LIMIT = {
  windowMs: 60_000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  defaultRevalidate: 60, // seconds
}
