"use client"

import { useEffect, useState } from "react"

/* ================= TYPES ================= */

export type AccountType = "BULLION" | "HELLION" | "TORION"

export type Account = {
  type: AccountType
  wallet: string
  baseBalance: number
  active: boolean
}

/* ================= CONFIG ================= */

const STORAGE_KEY = "account_v1"

/* ================= HOOK ================= */

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  /* -------- LOAD FROM STORAGE -------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: Account = JSON.parse(raw)
        setAccount(parsed)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  /* -------- CREATE ACCOUNT -------- */
  const createAccount = (type: AccountType, wallet: string) => {
    const baseBalance =
      type === "BULLION"
        ? 300
        : type === "HELLION"
        ? 1500
        : 100000

    const acc: Account = {
      type,
      wallet,
      baseBalance,
      active: true,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(acc))
    setAccount(acc)
  }

  /* -------- LIQUIDATE -------- */
  const liquidate = () => {
    if (!account) return
    const updated: Account = { ...account, active: false }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setAccount(updated)
  }

  /* -------- REDEPOSIT -------- */
  const redeposit = () => {
    if (!account) return
    const updated: Account = { ...account, active: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setAccount(updated)
  }

  /* -------- LOGOUT / RESET -------- */
  const clearAccount = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAccount(null)
  }

  return {
    account,
    loading, // 🔑 controla redirects
    createAccount,
    liquidate,
    redeposit,
    clearAccount,
  }
}
