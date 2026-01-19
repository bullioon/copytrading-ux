"use client"

import { useEffect, useState } from "react"

/* ================= TYPES ================= */

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

export type MarketPrices = {
  btc: number
  eth: number
  sol: number
}

/* ================= CONFIG ================= */

const STORAGE_KEY = "live_trades_v5"
const MAX_TRADES_PER_DAY = 5
const TRADE_USD_SIZE = 1000

/* ================= HOOK ================= */

export default function useLiveTrades(
  market: MarketPrices | null,
  connectedTraders: { id: number; name: string }[],
  enabled: boolean
) {
  const [trades, setTrades] = useState<Trade[]>([])

  /* ---------- LOAD ---------- */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    try {
      const parsed: Trade[] = JSON.parse(raw)
      setTrades(parsed)
    } catch {
      console.warn("Invalid trade cache")
    }
  }, [])

  /* ---------- OPEN / CLOSE ---------- */
  useEffect(() => {
    if (!enabled) return
    if (!market) return
    if (connectedTraders.length === 0) return

    const today = new Date().toDateString()
    const todaysTrades = trades.filter(
      t => new Date(t.openedAt).toDateString() === today
    )

    if (todaysTrades.length >= MAX_TRADES_PER_DAY) return

    const openTimeout = setTimeout(() => {
      const pairs = [
        { pair: "BTC/USDT", price: market.btc },
        { pair: "ETH/USDT", price: market.eth },
        { pair: "SOL/USDT", price: market.sol },
      ] as const

      const chosenPair =
        pairs[Math.floor(Math.random() * pairs.length)]

      const trader =
        connectedTraders[
          Math.floor(Math.random() * connectedTraders.length)
        ]

      if (!trader) return

      const trade: Trade = {
        id: Date.now(),
        pair: chosenPair.pair,
        traderId: trader.id,
        traderName: trader.name,
        entryPrice: chosenPair.price,
        openedAt: Date.now(),
        status: "open",
      }

      /* -------- OPEN -------- */
      setTrades(prev => {
        const next: Trade[] = [...prev, trade]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })

      /* -------- CLOSE -------- */
      setTimeout(() => {
        setTrades(prev => {
          const updated: Trade[] = prev.map(t => {
            if (t.id !== trade.id) return t

            const isWin = Math.random() < 0.6
            const pct = isWin
              ? 0.3 + Math.random() * 1.7
              : -(0.4 + Math.random() * 1.6)

            const pnlUsd = (pct / 100) * TRADE_USD_SIZE

            const closedTrade: Trade = {
              ...t,
              pnl: Number(pct.toFixed(2)),
              pnlUsd: Number(pnlUsd.toFixed(2)),
              exitPrice: Number(
                (t.entryPrice * (1 + pct / 100)).toFixed(2)
              ),
              closedAt: Date.now(),
              status: "closed",
            }

            return closedTrade
          })

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updated)
          )

          return updated
        })
      }, 8000)
    }, 15000)

    return () => clearTimeout(openTimeout)
  }, [market, connectedTraders, enabled, trades])

  return trades
}
