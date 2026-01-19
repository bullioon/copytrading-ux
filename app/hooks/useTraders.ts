"use client"

import { useEffect, useMemo, useState } from "react"

/* ================= TYPES ================= */

export type RiskProfile = "conservative" | "balanced" | "aggressive"
export type Role = "RISK" | "ENTRY" | "EXIT"

export type AssignedRoles = {
  RISK?: number
  ENTRY?: number
  EXIT?: number
}

export type TraderTrait =
  | "LOW_DRAWDOWN"
  | "HIGH_LOT_ENTRY"
  | "CONSISTENT"
  | "AGGRESSIVE"
  | "TIGHT_STOPS"
  | "LOW_WINRATE_HIGH_RR"

export type Trader = {
  id: number
  name: string

  strategy: string
  strengths: string[]
  weaknesses: string[]

  winRate: number
  avgWin: number
  avgLoss: number

  traits?: TraderTrait[]
}

/* ================= STATIC DATA ================= */

const TRAITS: TraderTrait[] = [
  "LOW_DRAWDOWN",
  "HIGH_LOT_ENTRY",
  "CONSISTENT",
  "AGGRESSIVE",
  "TIGHT_STOPS",
  "LOW_WINRATE_HIGH_RR",
]

const ARCHETYPES = [
  {
    strategy: "Mean Reversion",
    strengths: ["Stable entries"],
    weaknesses: ["Misses trends"],
    winRate: 0.58,
    avgWin: 0.4,
    avgLoss: -0.8,
  },
  {
    strategy: "Trend Following",
    strengths: ["Good exits"],
    weaknesses: ["Gives back profit"],
    winRate: 0.54,
    avgWin: 0.7,
    avgLoss: -1.1,
  },
  {
    strategy: "Momentum Scalping",
    strengths: ["Fast execution"],
    weaknesses: ["Sharp reversals"],
    winRate: 0.62,
    avgWin: 0.5,
    avgLoss: -1.2,
  },
]

const NAMES = ["Ax", "Nyx", "Atlas", "Vega", "Echo", "Nova"]

/* ================= HELPERS ================= */

const pick = <T,>(arr: T[], n: number): T[] =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n)

const uniqSorted = (xs: number[]) =>
  [...new Set(xs)].filter(Number.isFinite).sort((a, b) => a - b)

/* ================= HOOK ================= */

type UseTradersOpts = {
  /**
   * ✅ si true: al generar traders, autoselecciona/“conecta” el primero
   * para que el engine siempre tenga pool (útil para tiers que se quedan vacíos).
   */
  autoConnectFirst?: boolean
}

export function useTraders(opts?: UseTradersOpts) {
  const autoConnectFirst = opts?.autoConnectFirst ?? true

  const [traders, setTraders] = useState<Trader[]>([])
  const [assignedRoles, setAssignedRoles] = useState<AssignedRoles>({})
  const [connectedTraders, setConnectedTraders] = useState<number[]>([])

  /* ===== GENERATE TRADERS (CLIENT ONLY) ===== */
  useEffect(() => {
    const generated: Trader[] = ARCHETYPES.map((arch, i) => ({
      id: i + 1,
      name: NAMES[i % NAMES.length],
      ...arch,
      traits: pick(TRAITS, 2),
    }))

    setTraders(generated)

    // ✅ opcional: si quieres que “siempre haya pool” para el engine
    if (autoConnectFirst && generated.length) {
      const first = generated[0].id
      setConnectedTraders([first])
      setAssignedRoles(prev => (Object.keys(prev).length ? prev : { ENTRY: first }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ===== DERIVED ===== */

  const selectedTraders = useMemo(() => {
    return uniqSorted(Object.values(assignedRoles).filter(Boolean) as number[])
  }, [assignedRoles])

  const hasPendingChanges = useMemo(() => {
    const a = uniqSorted(selectedTraders).join(",")
    const b = uniqSorted(connectedTraders).join(",")
    return a !== b
  }, [selectedTraders, connectedTraders])

  /* ===== ROLE ACTIONS ===== */

  const assignRole = (role: Role, traderId: number) => {
    setAssignedRoles(prev => {
      // ✅ un trader no puede estar en 2 roles
      const cleaned = Object.fromEntries(
        Object.entries(prev).filter(([_, id]) => id !== traderId)
      ) as AssignedRoles

      return { ...cleaned, [role]: traderId }
    })
  }

  const clearRole = (role: Role) => {
    setAssignedRoles(prev => {
      const next: AssignedRoles = { ...prev }
      delete next[role]
      return next
    })
  }

  /* ===== APPLY STRATEGY ===== */

  const applyStrategy = () => {
    // ✅ NO uses selectedTraders “del render” si acabas de asignar roles
    // mejor saca snapshot del estado actual dentro del setter:
    setAssignedRoles(prev => {
      const snap = uniqSorted(Object.values(prev).filter(Boolean) as number[])
      setConnectedTraders(snap)
      return prev
    })
  }

  /* ===== RISK PROFILE ===== */

  const getRiskProfile = (t: Trader): RiskProfile => {
    if (t.avgLoss <= -1.5) return "aggressive"
    if (t.winRate < 0.55) return "balanced"
    return "conservative"
  }

  /* ===== EXTRA FLAGS (para que DashboardView NO truene) ===== */

  const aggressiveCount = useMemo(() => {
    return traders.filter(t => (t.traits ?? []).includes("AGGRESSIVE")).length
  }, [traders])

  const isHighRisk = useMemo(() => {
    const selected = new Set(selectedTraders)
    return traders.some(
      t => selected.has(t.id) && (t.traits ?? []).includes("AGGRESSIVE")
    )
  }, [traders, selectedTraders])

  const isBlocked = useMemo(() => {
    // ✅ “blocked” solo si NO hay mínimo ENTRY (no exijas los 3 siempre)
    // porque en tu Quick presets a veces asignas 1-2 roles y luego aplicas.
    const hasAny = !!assignedRoles.ENTRY || !!assignedRoles.RISK || !!assignedRoles.EXIT
    return !hasAny
  }, [assignedRoles])

  /* ================= RETURN ================= */

  return {
    traders,

    assignedRoles,
    assignRole,
    clearRole,

    selectedTraders,
    connectedTraders,

    hasPendingChanges,
    applyStrategy,

    getRiskProfile,

    isHighRisk,
    isBlocked,
    aggressiveCount,
  }
}
