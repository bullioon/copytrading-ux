export type TradeStatus = "open" | "closed"

export type Trade = {
  id: number
  pair: "BTC/USDT" | "ETH/USDT" | "SOL/USDT"
  traderId: number
  traderName: string
  entryPrice: number
  exitPrice: number | null
  pnlUsd: number
  openedAt: number
  closedAt: number | null
  status: TradeStatus
}
