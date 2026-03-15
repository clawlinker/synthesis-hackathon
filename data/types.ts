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

export interface BlockscoutApiResponse {
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
