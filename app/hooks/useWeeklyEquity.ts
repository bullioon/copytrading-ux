"use client"

import { useEffect, useState } from "react"
import { Trade } from "../types/trading"
import { AccountType } from "./useAccount"

export type EquityPoint = {
  balance: number
  time: number
}

const STORAGE_KEY = "weekly_equity_mt5"

/* ================= HOOK ================= */

export default function useWeeklyEquity(
  trades: Trade[],
  accountType: AccountType,
  baseBalance: number
) {
  const [equity, setEquity] = useState<EquityPoint[]>([
    { balance: baseBalance, time: Date.now() },
  ])

  /* -------- RECALCULATE EQUITY (MT5 STYLE) -------- */
  useEffect(() => {
    if (trades.length === 0) return

    const closedPnl =
      trades
        .filter(t => t.status === "closed")
        .reduce((sum, t) => sum + (t.pnlUsd ?? 0), 0)

    const floatingPnl =
      trades
        .filter(t => t.status === "open")
        .reduce((sum, t) => sum + (t.pnlUsd ?? 0), 0)

    const balance =
      baseBalance + closedPnl + floatingPnl

    setEquity(prev => {
      const last = prev[prev.length - 1]
      if (last && Math.abs(last.balance - balance) < 0.01) {
        return prev
      }

      const next = [
        ...prev,
        {
          balance: Number(balance.toFixed(2)),
          time: Date.now(),
        },
      ]

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      )

      return next
    })
  }, [trades, baseBalance])

  return equity
}
