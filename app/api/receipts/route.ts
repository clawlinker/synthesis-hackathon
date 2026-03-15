import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { AGENT, BANKR_AGENT, USDC_CONTRACT, type Receipt, AGENTS } from '@/app/types'
import sampleReceipts from '@/data/sample-receipts.json'
import { ADDRESS_LABELS } from '@/data/address-labels'
import { AGENT_REGISTRY, resolveAgent } from '@/data/erc8004-resolver'
import { sampleInferenceReceipts } from '@/data/inference-receipts'

const BASESCAN_API = 'https://api.basescan.org/api'

function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase()
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label
  }
  return undefined
}

function getServiceFromTx(tx: any, wallet: string): string | undefined {
  const to = tx.to.toLowerCase()
  const from = tx.from.toLowerCase()
  const other = from === wallet.toLowerCase() ? to : from
  
  // Specific service logic
  if (other === '0x5776d6d49132516709e11e6e3676e43750163af8') return 'x402 Payment'
  if (other === '0x9c9563816900f862356b243750163af850163af8') return 'Virtuals Job'
  
  return labelAddress(other)
}

function enrichReceiptWithAgentData(tx: any): Partial<Receipt> {
  const fromAgent = resolveAgent(tx.from)
  const toAgent = resolveAgent(tx.to)
  
  return {
    fromAgent: fromAgent ? {
      id: fromAgent.id,
      name: fromAgent.name,
      ens: fromAgent.ens,
      avatar: fromAgent.avatar,
    } : undefined,
    toAgent: toAgent ? {
      id: toAgent.id,
      name: toAgent.name,
      ens: toAgent.ens,
      avatar: toAgent.avatar,
    } : undefined,
  }
}

// Load agent_log.json for inference receipts
function loadInferenceReceiptsFromLog(): Receipt[] {
  try {
    const logPath = path.join(process.cwd(), 'agent_log.json')
    const logContent = fs.readFileSync(logPath, 'utf-8')
    const logs = JSON.parse(logContent) as any[]
    
    // Filter for LLM-powered entries and convert to inference receipts
    const inferenceReceipts: Receipt[] = logs
      .filter((entry) => entry.model && entry.model_cost_usd && entry.model_cost_usd > 0)
      .map((entry, index) => {
        const timestamp = Date.parse(entry.timestamp) / 1000
        return {
          hash: `inference-${index}-${entry.timestamp}`,
          from: '0x0000000000000000000000000000000000000000',
          to: AGENT.wallet,
          value: Math.round(entry.model_cost_usd * 1e6).toString(),
          amount: entry.model_cost_usd.toFixed(6),
          timestamp: Math.floor(timestamp),
          blockNumber: '0',
          direction: 'received' as const,
          status: 'confirmed' as const,
          tokenSymbol: 'USD',
          tokenDecimal: '6',
          service: `Bankr LLM — ${entry.action || entry.phase || 'inference'} (${entry.model.split('/')[1] || 'unknown'})`,
          agentId: AGENT.id.toString(),
          notes: entry.description || 'LLM-powered autonomous operation',
        }
      })
    
    return inferenceReceipts
  } catch (e) {
    console.warn('Failed to load inference receipts from agent_log.json:', e)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const walletParam = url.searchParams.get('wallet')
    const includeInference = url.searchParams.get('inference') !== 'false' // default to true
    
    // Determine which wallet(s) to fetch
    let walletsToFetch: { wallet: string; name: string; agentId: string }[] = []
    
    if (walletParam) {
      // Single wallet specified
      const lowerWallet = walletParam.toLowerCase()
      if (lowerWallet === AGENT.wallet.toLowerCase()) {
        walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      } else if (lowerWallet === BANKR_AGENT.wallet.toLowerCase()) {
        walletsToFetch.push({ wallet: BANKR_AGENT.wallet, name: 'Bankr', agentId: BANKR_AGENT.id.toString() })
      } else {
        // Default to Clawlinker if unknown wallet
        walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      }
    } else {
      // No wallet specified - fetch both
      walletsToFetch.push({ wallet: AGENT.wallet, name: 'Clawlinker', agentId: AGENT.id.toString() })
      walletsToFetch.push({ wallet: BANKR_AGENT.wallet, name: 'Bankr', agentId: BANKR_AGENT.id.toString() })
    }
    
    // Fetch receipts for all wallets
    const allReceipts: Receipt[] = []
    
    for (const { wallet, agentId } of walletsToFetch) {
      const params = new URLSearchParams({
        module: 'account',
        action: 'tokentx',
        address: wallet,
        contractaddress: USDC_CONTRACT,
        sort: 'desc',
        page: '1',
        offset: '50',
      })

      // Add API key if available
      if (process.env.BASESCAN_API_KEY) {
        params.set('apikey', process.env.BASESCAN_API_KEY)
      }

      const res = await fetch(`${BASESCAN_API}?${params}`, {
        next: { revalidate: 60 }, // cache 60s
      })

      if (!res.ok) {
        console.warn(`Basescan API error for ${wallet}: ${res.status}`)
        continue
      }

      const data = await res.json()

      if (data.status !== '1' || !Array.isArray(data.result)) {
        console.warn(`No results for ${wallet}`)
        continue
      }

      const receipts = data.result.map((tx: any) => {
        const direction = tx.from.toLowerCase() === wallet.toLowerCase() ? 'sent' : 'received'
        const agentData = enrichReceiptWithAgentData(tx)
        
        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          amount: (parseInt(tx.value) / 1e6).toFixed(2),
          timestamp: parseInt(tx.timeStamp),
          blockNumber: tx.blockNumber,
          direction,
          status: 'confirmed' as const,
          tokenSymbol: tx.tokenSymbol,
          tokenDecimal: tx.tokenDecimal,
          agentId: agentId,
          service: getServiceFromTx(tx, wallet),
          fromLabel: labelAddress(tx.from),
          toLabel: labelAddress(tx.to),
          fromAgent: agentData.fromAgent,
          toAgent: agentData.toAgent,
        }
      })
      
      allReceipts.push(...receipts)
    }

    // Sort USDC receipts by timestamp (newest first)
    allReceipts.sort((a, b) => b.timestamp - a.timestamp)
    
    // Load inference receipts from agent_log.json
    let inferenceReceipts: Receipt[] = []
    if (includeInference) {
      inferenceReceipts = loadInferenceReceiptsFromLog()
      
      // Fallback to sample inference receipts if agent_log.json is empty
      if (inferenceReceipts.length === 0) {
        inferenceReceipts = sampleInferenceReceipts
      }
    }
    
    // Combine and sort all receipts
    const combinedReceipts = [...allReceipts, ...inferenceReceipts]
    combinedReceipts.sort((a, b) => b.timestamp - a.timestamp)
    
    if (combinedReceipts.length > 0) {
      return NextResponse.json({ 
        receipts: combinedReceipts, 
        source: allReceipts.length > 0 ? 'live+inference' : 'sample+inference',
        hasInferenceReceipts: includeInference && inferenceReceipts.length > 0,
      })
    }
    
    // Fall back to sample data if live fetch failed
    const enrichedReceipts = sampleReceipts.map(r => {
      const fromAgent = resolveAgent(r.from)
      const toAgent = resolveAgent(r.to)
      return {
        ...r,
        fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
        toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
      }
    })
    
    return NextResponse.json({ 
      receipts: enrichedReceipts, 
      source: 'sample+inference',
      hasInferenceReceipts: false,
    })
  } catch (error) {
    console.error('Failed to fetch receipts:', error)
    const enrichedReceipts = sampleReceipts.map(r => {
      const fromAgent = resolveAgent(r.from)
      const toAgent = resolveAgent(r.to)
      return {
        ...r,
        fromAgent: fromAgent ? { id: fromAgent.id, name: fromAgent.name, ens: fromAgent.ens, avatar: fromAgent.avatar } : undefined,
        toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, ens: toAgent.ens, avatar: toAgent.avatar } : undefined,
      }
    })
    return NextResponse.json({ 
      receipts: enrichedReceipts, 
      source: 'sample+inference',
      hasInferenceReceipts: false,
    })
  }
}
