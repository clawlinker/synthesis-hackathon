import { type Receipt } from '@/app/types'

export interface InferenceLogEntry {
  timestamp: string
  model: string
  model_cost_usd: number
  action?: string
  description?: string
  phase?: string
  cron?: string
}

export interface BasescanApiResponse {
  status: string
  message: string
  result: Array<{
    hash: string
    from: string
    to: string
    value: string
    tokenSymbol: string
    timeStamp: string
    blockNumber: string
    tokenDecimal: string
  }>
}

export interface BasescanSingleTxResponse {
  status: string
  message: string
  result: Array<{
    hash: string
    from: string
    to: string
    value: string
    tokenSymbol: string
    timeStamp: string
    blockNumber: string
    tokenDecimal: string
  }>
}
