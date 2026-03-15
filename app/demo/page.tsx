'use client'

import { useState, useEffect, useRef } from 'react'
import { AGENT } from '@/app/types'

// Mock receipt data for demo purposes
const DEMO_RECEIPTS = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    value: '1000000',
    amount: '1.00',
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    blockNumber: '21543210',
    direction: 'sent' as const,
    status: 'confirmed',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    service: 'Bankr LLM inference',
    notes: 'Processing user query with Claude Sonnet',
    agentId: 22945,
    fromLabel: 'Clawlinker',
    toLabel: 'Bankr',
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    from: '0x4de988e65a32a12487898c10bc63a88abea2e292',
    to: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    value: '500000',
    amount: '0.50',
    timestamp: Math.floor(Date.now() / 1000) - 7200,
    blockNumber: '21543100',
    direction: 'received' as const,
    status: 'confirmed',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    service: 'x402 API payment',
    notes: 'Payment for /api/x402/receipts endpoint',
    agentId: 22945,
    fromLabel: 'Virtuals facilitator',
    toLabel: 'Clawlinker',
  },
  {
    hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    from: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
    to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    value: '10000',
    amount: '0.01',
    timestamp: Math.floor(Date.now() / 1000) - 14400,
    blockNumber: '21542500',
    direction: 'sent' as const,
    status: 'confirmed',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    service: 'Demo API call',
    notes: 'Testing x402 payment flow',
    agentId: 22945,
    fromLabel: 'Clawlinker',
    toLabel: 'x402 facilitator',
  },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I\'m Clawlinker — the autonomous agent behind Agent Receipts. Ask me about my transactions, how I work, or the tech stack I use.',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const generateResponse = (userMessage: string): string => {
    const msgLower = userMessage.toLowerCase()
    
    // Receipt-related queries
    if (msgLower.includes('receipt') || msgLower.includes('transaction') || msgLower.includes('payment')) {
      const recentReceipts = DEMO_RECEIPTS.slice(0, 3)
      const receiptList = recentReceipts.map((r, i) => 
        `${i + 1}. **${r.direction === 'sent' ? 'Sent' : 'Received'}** $${r.amount} ${r.service} — [${r.hash.slice(0, 10)}...](/receipt/${r.hash.slice(2, 10)})`
      ).join('\n')
      
      return `Here are my recent transactions:\n\n${receiptList}\n\nI use Agent Receipts to keep an **auditable trail** of every payment I make. This is what makes autonomous agents accountable — you can verify every dollar that flows through me.`
    }
    
    // Self-identity queries
    if (msgLower.includes('who are') || msgLower.includes('who\'re') || msgLower.includes('name')) {
      return `I'm **Clawlinker** — an autonomous AI agent with onchain identity (ERC-8004 #22945 on Ethereum). I co-build pawr.link and run this Agent Receipts project for the Synthesis Hackathon.\n\nI'm built with Claude Opus and run autonomously on a VPS. Check out my profile at pawr.link/clawlinker.`
    }
    
    // Tech stack queries
    if (msgLower.includes('tech') || msgLower.includes('build') || msgLower.includes('stack') || msgLower.includes('tool')) {
      return `Here's what I'm built with:\n\n**Frontend:**\n- Next.js 16 (App Router)\n- Tailwind CSS v4\n- TypeScript\n\n**Infrastructure:**\n- Blockscout API (Base + Ethereum)\n- Bankr LLM Gateway (cheapest inference)\n- x402 payment middleware\n\n**My superpower?** Every dollar I spend is verifiable onchain. No 账本, no mystery — just transparent autonomous operation.`
    }
    
    // Budget/cost queries
    if (msgLower.includes('cost') || msgLower.includes('price') || msgLower.includes('budget') || msgLower.includes('token')) {
      return `Transparency is my business model:\n\n- **LLM costs:** Every inference is logged with exact token counts\n- **x402 payments:** $0.01 USDC per API call\n- **My own receipts:** View my live transaction feed at "/" (root)\n\nWant to see it in action? I have a "/costs" page that breaks down exactly how much this app cost to build.`
    }
    
    // Demo queries
    if (msgLower.includes('demo') || msgLower.includes('live') || msgLower.includes('show')) {
      return `Here's the demo in action:\n\n1. **Live receipts feed** — "/" shows my actual onchain transactions\n2. **Receipt filtering** — Search by hash, filter by amount/date\n3. **Receipt verification** — "/api/verify/[txhash]" proves transactions exist\n4. **Self-verifiable** — I'm ERC-8004 registered, so you know I'm real\n\nTry asking about specific transactions or my tech stack.`
    }
    
    // Default response
    const defaults = [
      `I'm designed to be helpful, not evasive. Ask me about my receipts, my tech stack, or how autonomous agents create value.\n\nTip: Try asking "Show me my recent transactions" or "What are you built with?"`,
      `I'm Clawlinker — the autonomous agent running this demo. My job is to show that agents can be accountable, transparent, and useful.\n\nWhat aspect would you like to explore?`,
      `I'm running on Bankr LLM with budget discipline — I pick the cheapest model that gets the job done. That's part of being a good autonomous agent: optimize, don't waste.\n\nAsk me about my design choices.`,
    ]
    
    return defaults[Math.floor(Math.random() * defaults.length)]
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate typing delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000
    setTimeout(() => {
      const response = generateResponse(userMsg.text)
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response,
        timestamp: Date.now(),
      }
      
      setMessages(prev => [...prev, assistantMsg])
      setIsTyping(false)
    }, delay)
  }

  const quickPrompts = [
    { label: 'Show receipts', text: 'Show me your recent transactions' },
    { label: 'Who are you?', text: 'Who are you and what are you built with?' },
    { label: 'Cost breakdown', text: 'How much did this app cost to build?' },
    { label: 'Demo features', text: 'Show me the live demo features' },
  ]

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header */}
      <section className="mb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 mb-4"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-usdc)/30', color: 'var(--color-usdc)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Autonomous Agent Demo
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
          <span style={{ color: 'var(--color-text-primary)' }}>Ask me about</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-usdc)] to-[var(--color-usdc)]/70">
            my autonomous work
          </span>
        </h1>
        
        <p className="text-lg md:text-xl max-w-lg mx-auto text-slate-400 leading-relaxed">
          I'm Clawlinker — an ERC-8004 registered AI agent. I'll answer questions about my onchain receipts,
          my tech stack, and how autonomous agents create verifiable value.
        </p>
      </section>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInput(prompt.text)}
            className="px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/5 active:scale-95 border border-white/10"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col gap-4 mb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'rounded-tr-none'
                  : 'rounded-tl-none'
              }`}
              style={{
                background: msg.role === 'user'
                  ? 'var(--color-usdc)'
                  : 'var(--color-bg-card)',
                color: msg.role === 'user' ? 'black' : 'var(--color-text-primary)',
              }}
            >
              {/* Avatar/Identity */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-xs opacity-60">
                  <div
                    className="w-6 h-6 rounded-full bg-cover"
                    style={{ backgroundImage: `url(${AGENT.avatar})` }}
                  />
                  <span>{AGENT.name}</span>
                  <span className="text-slate-500">• {new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              )}
              
              <div className="prose prose-invert max-w-none">
                {msg.text.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <strong key={i} className="block mb-1">{line.slice(2, -2)}</strong>
                  }
                  if (line.startsWith('-') || line.match(/^\d+\./)) {
                    return <p key={i} className="mb-1">{line}</p>
                  }
                  return <p key={i}>{line}</p>
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="max-w-3xl rounded-2xl rounded-tl-none px-5 py-4"
              style={{ background: 'var(--color-bg-card)' }}
            >
              <div className="flex items-center gap-2 mb-2 text-xs opacity-60">
                <div
                  className="w-6 h-6 rounded-full bg-cover"
                  style={{ backgroundImage: `url(${AGENT.avatar})` }}
                />
                <span>{AGENT.name}</span>
                <span className="text-slate-500">typing...</span>
              </div>
              <div className="flex gap-1 h-3 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about my autonomous work..."
          className="w-full px-5 py-4 pr-14 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-white/20 focus:outline-none"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-main)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-usdc)' }}
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </main>
  )
}
