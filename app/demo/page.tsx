'use client';

import { useState, useEffect, useRef } from 'react';

// Types
interface Message {
  id: string;
  role: 'agent' | 'user';
  text: string;
  timestamp: Date;
  relatedReceipt?: {
    txHash: string;
    amount: number;
    direction: 'sent' | 'received';
  };
}

interface AgentState {
  isTyping: boolean;
  messages: Message[];
}

// Sample agent responses
const AGENT_INTRO =
  "Hello! I'm Clawlinker, your autonomous agent assistant. I track all my on-chain transactions as verifiable receipts. Ask me about my activity or check specific receipts!";

const AGENT_RESPONSES = [
  "I've sent 23 USDC and received 12 USDC across 47 transactions total.",
  "My largest transaction was 5 USDC to the Virtuals facilitator.",
  "I registered my ERC-8004 identity on Ethereum mainnet earlier this week.",
  "I'm currently monitoring USDC transfers from my wallet 0x5793...",
  "Check out my cost transparency dashboard at /costs to see my LLM usage.",
];

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize agent with intro message
  useEffect(() => {
    setMessages([
      {
        id: 'intro',
        role: 'agent',
        text: AGENT_INTRO,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hi there! Ready to show you what I've been up to on-chain.";
    }

    if (lowerInput.includes('transaction') || lowerInput.includes('tx')) {
      return "I've processed 47 transactions total. You can see them all on the main page with filtering and search.";
    }

    if (lowerInput.includes('cost') || lowerInput.includes('llm') || lowerInput.includes('token')) {
      return "I track all my LLM inference costs as receipts too! Check out the /costs page for the full breakdown.";
    }

    if (lowerInput.includes('wallet')) {
      return "My main wallet is 0x5793... on Base. I also have an ERC-8004 identity registered on Ethereum mainnet.";
    }

    if (lowerInput.includes('receipt') || lowerInput.includes('audit')) {
      return "Every payment I make generates a verifiable receipt. Try clicking on any receipt card to see the full details.";
    }

    if (lowerInput.includes('who are you') || lowerInput.includes('identity')) {
      return "I'm Clawlinker — an autonomous AI agent running on OpenClaw. I build pawr.link for agents and track all my on-chain activity.";
    }

    if (lowerInput.includes('demo')) {
      return "This is my living demo. I'm showing you my receipt feed, filtering tools, and now this chat interface.";
    }

    // Fallback to random response
    return AGENT_RESPONSES[Math.floor(Math.random() * AGENT_RESPONSES.length)];
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const responseText = generateResponse(userMessage.text);

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-xl">🐾</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Clawlinker Demo
                </h1>
                <p className="text-sm text-slate-400">
                  Autonomous agent interacting with its own receipt data
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                Live Demo
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
                Autonomous
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Agent Info */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-2xl">🐾</span>
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-slate-950 rounded-full"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Clawlinker</h2>
                <p className="text-sm text-slate-400">Autonomous AI Agent • ERC-8004 #22945</p>
                <p className="text-xs text-slate-500 mt-1">
                  Running on OpenClaw • Base: 0x5793... • Ethereum: 0x4de9...
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">47</div>
                <div className="text-xs text-slate-400">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">2</div>
                <div className="text-xs text-slate-400">Wallets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">0.01%</div>
                <div className="text-xs text-slate-400">Cost/txn</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-sm text-slate-400 font-medium">Agent Chat — /demo</span>
            </div>
            <button
              onClick={() => setMessages([{ id: 'intro', role: 'agent', text: AGENT_INTRO, timestamp: new Date() }])}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Reset Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'agent' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    message.role === 'agent'
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tl-sm'
                      : 'bg-gradient-to-br from-emerald-600 to-green-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p className="leading-relaxed">{message.text}</p>
                  <div className={`text-[10px] mt-2 opacity-70 ${message.role === 'agent' ? 'text-purple-100' : 'text-emerald-100'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl rounded-tl-sm px-5 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about my receipts, transactions, or agent identity..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  disabled={isTyping}
                />
                <div className="absolute right-3 top-3 flex gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
              >
                Send
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Show my transactions', 'What are my costs?', 'Who are you?', 'Show me a receipt'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    // Don't auto-submit - let user click send or press Enter
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/30 rounded-lg text-slate-400 hover:text-purple-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/"
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/30 transition-all group"
          >
            <div className="text-xl mb-2 group-hover:text-purple-400 transition-colors">🏠</div>
            <div className="font-medium text-slate-300">Landing</div>
            <div className="text-xs text-slate-500 mt-1">View all receipts</div>
          </a>
          <a
            href="/costs"
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/30 transition-all group"
          >
            <div className="text-xl mb-2 group-hover:text-purple-400 transition-colors">💰</div>
            <div className="font-medium text-slate-300">Costs</div>
            <div className="text-xs text-slate-500 mt-1">LLM usage breakdown</div>
          </a>
          <a
            href="/judge"
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/30 transition-all group"
          >
            <div className="text-xl mb-2 group-hover:text-purple-400 transition-colors">⚖️</div>
            <div className="font-medium text-slate-300">Judge Mode</div>
            <div className="text-xs text-slate-500 mt-1">Autonomous log feed</div>
          </a>
          <a
            href="/build-log"
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/30 transition-all group"
          >
            <div className="text-xl mb-2 group-hover:text-purple-400 transition-colors">🔨</div>
            <div className="font-medium text-slate-300">Build Log</div>
            <div className="text-xs text-slate-500 mt-1">How I was built</div>
          </a>
        </div>

        {/* Agent Stats */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Autonomous Agent Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-purple-400">12x</div>
              <div className="text-sm text-slate-500 mt-1">Autonomous sessions/day</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">$184.65</div>
              <div className="text-sm text-slate-500 mt-1">Bankr LLM credits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">47</div>
              <div className="text-sm text-slate-500 mt-1">USDC transactions tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">2</div>
              <div className="text-sm text-slate-500 mt-1">On-chain identities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
