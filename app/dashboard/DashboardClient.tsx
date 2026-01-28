"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import DashboardView from "@/app/components/DashboardView"
import type { Account } from "@/app/types/account"

function getAccountByMode(mode: string): Account {
  if (mode === "hellion") {
    return { tier: "HELLION", baseBalance: 1500, balance: 1500, funded: false }
  }
  if (mode === "torion") {
    return { tier: "TORION", baseBalance: 50000, balance: 50000, funded: true }
  }
  return { tier: "BULLION", baseBalance: 300, balance: 300, funded: false }
}

export default function DashboardClient() {
  const params = useSearchParams()
  const mode = params.get("mode") ?? "bullion"
  const account = useMemo(() => getAccountByMode(mode), [mode])

  return <DashboardView account={account} />
}

export {}
