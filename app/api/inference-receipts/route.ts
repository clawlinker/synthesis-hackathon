import { type NextRequest } from 'next/server'
import { loadInferenceReceipts } from '@/data/inference-receipts'

// Inference receipts from agent_log.json
// Returns entries where action contains 'llm' or 'model' to identify LLM usage

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Load inference receipts from agent_log.json
    const allReceipts = loadInferenceReceipts('/root/synthesis-hackathon/agent_log.json')

    // If agent_log.json parsing returned empty (e.g., missing file), use sample data
    const receipts = allReceipts.length > 0 ? allReceipts : []
    
    // Apply pagination
    const paginatedReceipts = receipts.slice(offset, offset + limit)

    return Response.json({
      receipts: paginatedReceipts,
      total: receipts.length,
      limit,
      offset,
      source: 'agent_log.json',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Failed to fetch inference receipts:', err)
    return Response.json(
      { error: 'Failed to fetch inference receipts' },
      { status: 500 }
    )
  }
}
