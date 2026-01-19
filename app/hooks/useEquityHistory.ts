"use client"

import { useEffect, useState } from "react"
import type { Trade } from "./useLiveTrades"

export type EquityPoint = {
  balance: number
  time: number
}

const STORAGE_KEY = "equity_history_v1"
const BASE_BALANCE = 1487.23

export default function useEquityHistory(trades: Trade[]) {
  const [equity, setEquity] = useState<EquityPoint[]>([])

  // cargar equity guardada
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setEquity(JSON.parse(raw))
      } catch {}
    }
  }, [])

  // recalcular equity SOLO cuando se cierra un trade
  useEffect(() => {
    const closedTrades = trades.filter(
      (t) => t.status === "closed" && typeof t.pnl === "number"
    )

    let balance = BASE_BALANCE
    const next: EquityPoint[] = []

    closedTrades.forEach((t) => {
      balance = balance * (1 + t.pnl! / 100)

      next.push({
        balance: Number(balance.toFixed(2)),
        time: t.closedAt ?? Date.now(),
      })
    })

    setEquity(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [trades])

  return equity
}
