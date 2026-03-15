// Configuration for contract addresses and service labels
// Separated from address-labels.ts to keep concerns distinct

// Hardcoded contract addresses for service detection
export const CONTRACTS = {
  X402_FACILITATOR: '0x5776d6D49132516709E11e6E3676E43750163AF8',
  VIRTUALS_ACP: '0x9C9563816900f862356B243750163AF850163AF8',
  USDC_CONTRACT: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  PERMIT2: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  X402_EXACT_PERMIT2_PROXY: '0x4104000000000000000000000000000000004104',
  // Ethereum contracts
  ETH_USDC_CONTRACT: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
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
  '0xec9641ebdcdfcad27bc10472d26bdd61cbf71d5c': 'x402 Payout',
  '0xa6a8736f18f383f1cc2d938576933e5ea7df01a1': 'x402 Facilitator Fee',
  '0xf0c7ff3141d37e8c70b08e0afbc68aad3364ebc6': 'x402 Customer',
}

// Address labels (should match address-labels.ts)
export const ADDRESS_LABELS: Record<string, string> = {
  '0x5793BFc1331538C5A8028e71Cc22B43750163af8': 'Clawlinker (Agent)',
  '0x4de9236423ccf24c084d5dfd3581177699477699': 'Bankr Wallet',
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC Contract',
  '0x5776d6D49132516709E11e6E3676E43750163AF8': 'x402 Facilitator (CDP)',
  '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  '0x4104000000000000000000000000000000004104': 'x402 Exact Permit2 Proxy',
  '0x3216893708D46A928eBe06990C29EaD64590163A': 'Clawdia (Agent)',
  '0x6d8b2d12977F09E7B35811776994776994776994': 'DEX Screener',
  '0x9C9563816900f862356B243750163AF850163AF8': 'Virtuals ACP',
  '0xcB5E412977f09E7B358117769947769947769947': 'pawr.link Treasury',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC Contract (ETH)',
  // Discovered from receipt analysis
  '0xdc5d8200A030798bc6227240f68b4dd9542686ef': 'BaseSettler (Uniswap)',
  '0xec9641ebdcdfcad27bc10472d26bdd61cbf71d5c': 'x402 Payout',
  '0x071Feb1CF5837d5a988ccd61eef9379cdf1f0c31': 'Bankr Top-up',
  '0x071f7dd29185a3b84406edeac50f042cdf1f0c31': 'Bankr Top-up',
  '0xbaba5d4bd641db7de8001df70c9f313b1ded8f73': 'Baba Protocol',
  '0xbAba775a0400a5e442335ceaa4820edb1ded8f73': 'Baba Protocol',
  '0xf17b5dD382b048ff4c05c1c9e4e24cfc5c6adad9': 'External Wallet',
  '0xA6a8736f18f383f1cc2d938576933e5ea7df01a1': 'x402 Facilitator Fee',
  '0xF0c7fF3141D37E8C70b08e0AFBc68AAD3364EBc6': 'x402 Customer',
}

// Rate limiting configuration
export const RATE_LIMIT = {
  windowMs: 60_000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  defaultRevalidate: 60, // seconds
}
