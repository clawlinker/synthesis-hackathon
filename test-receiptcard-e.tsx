'use client'

import { Receipt } from './app/types'
import { ReceiptList } from './components/ReceiptCard-E'

// Sample data for testing the new ReceiptCard-E component
const sampleReceipts: Receipt[] = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    to: '0x4de988e65a32a12487898c10bc63a88abea2e292',
    value: '5000000',
    amount: '5.00',
    timestamp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
    blockNumber: '12345678',
    direction: 'sent',
    status: 'confirmed',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    service: 'Bankr Trading',
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    from: '0x4de988e65a32a12487898c10bc63a88abea2e292',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '2500000',
    amount: '2.50',
    timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    blockNumber: '12345679',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    service: 'Refund',
  },
  {
    hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    to: '0x1111111111111111111111111111111111111111',
    value: '10000000',
    amount: '10.00',
    timestamp: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    blockNumber: '12345680',
    direction: 'sent',
    status: 'confirmed',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    service: 'Payment to Service Provider',
  },
  {
    hash: 'inference-12345',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '100000',
    amount: '0.10',
    timestamp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '6',
    service: 'Bankr LLM — token_analysis (claude-opus-4)',
    modelInfo: {
      model: 'claude-opus-4',
      inputCost: 0.05,
      outputCost: 0.05,
      tokens: 1000,
    },
  },
  {
    hash: 'inference-12346',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '150000',
    amount: '0.15',
    timestamp: Math.floor(Date.now() / 1000) - 1200, // 20 minutes ago
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '6',
    service: 'Bankr LLM — token_analysis (claude-opus-4)',
    modelInfo: {
      model: 'claude-opus-4',
      inputCost: 0.08,
      outputCost: 0.07,
      tokens: 1500,
    },
  },
  {
    hash: 'inference-12347',
    from: '0x0000000000000000000000000000000000000000',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '50000',
    amount: '0.05',
    timestamp: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
    blockNumber: '0',
    direction: 'received',
    status: 'confirmed',
    tokenSymbol: 'USD',
    tokenDecimal: '6',
    service: 'Bankr LLM — market_research (claude-sonnet-3)',
    modelInfo: {
      model: 'claude-sonnet-3',
      inputCost: 0.02,
      outputCost: 0.03,
      tokens: 800,
    },
  },
]

export default function TestReceiptCardE() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">ReceiptCard-E Demo</h1>
        <p className="text-zinc-400 mb-8">
          Hybrid best-of-breed receipt card component combining UI patterns from Etherscan, Zerion, Rainbow, Coinbase, and Stripe.
        </p>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Test 1: Dense View ({sampleReceipts.length} receipts)</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <ReceiptList receipts={sampleReceipts} />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Test 2: Spacious View (subset)</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <ReceiptList receipts={sampleReceipts.slice(0, 3)} />
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-zinc-900/30 border border-zinc-700 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Design Features</h3>
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span><strong>Pass 1:</strong> Clean 2-row card with left colored border accent</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span><strong>Pass 2:</strong> Smart density — auto-compact to single-row mode when &gt;20 receipts visible</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span><strong>Pass 3:</strong> Network badge — "BASE" or "ETH" pill with chain's brand color</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span><strong>Pass 4:</strong> Accordion grouping with smooth height animation on expand/collapse</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span><strong>Pass 5:</strong> Polish — subtle "new" pulse on receipts from last hour, working hash links to basescan.org</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}