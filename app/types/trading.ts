export type MarketPrices = {
  btc: number
  eth: number
  sol: number
}

export type Trader = {
  id: number
  name: string
  strategy: string
}

export type Trade = {
  id: number
  pair: "BTC/USDT" | "ETH/USDT" | "SOL/USDT"
  traderId: number
  traderName: string
  entryPrice: number
  exitPrice?: number
  pnl?: number
  pnlUsd?: number
  openedAt: number
  closedAt?: number
  status: "open" | "closed"
}
