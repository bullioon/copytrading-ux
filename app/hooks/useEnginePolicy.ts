"use client"

import { useEffect, useMemo, useRef } from "react"
import type { StrategyHealth } from "@/app/components/StrategyTransitionPreview"

export type EngineRegime = "NORMAL" | "DEFENSE" | "RECOVERY" | "COOLDOWN"

export type EnginePolicy = {
  regime: EngineRegime
  allowTrading: boolean
  riskMultiplier: number
  cadenceMultiplier: number
  reasons: string[]
}

export function useEnginePolicy({
  drawdownPct,
  health,
  disableRiskBrake,
}: {
  drawdownPct: number
  health: StrategyHealth
  disableRiskBrake?: boolean
}): EnginePolicy {
  const lastRegimeRef = useRef<EngineRegime>("NORMAL")
  const lastDrawdownRef = useRef<number>(0)

  const policy = useMemo<EnginePolicy>(() => {
    const dd = Number.isFinite(drawdownPct) ? drawdownPct : 0

    // ✅ OVERRIDE HARD: gana SIEMPRE y devuelve policy limpia
    // (esto evita que te quedes con reasons de COOLDOWN / Hard stop)
    if (disableRiskBrake) {
      return {
        regime: "RECOVERY", // o "NORMAL" si quieres, pero RECOVERY es más “seguro”
        allowTrading: true,
        riskMultiplier: 0.35,     // ✅ nunca 0
        cadenceMultiplier: 0.75,  // ✅ nunca 0
        reasons: ["OVERRIDE: protections disabled (manual control)"],
      }
    }

    const reasons: string[] = []

    const DEFENSE_DD = -8
    const COOLDOWN_DD = -12
    const NORMAL_EXIT_DD = -3

    const improving = dd > lastDrawdownRef.current

    let regime: EngineRegime = lastRegimeRef.current

    // ===============================
    // REGIME SELECTION
    // ===============================
    if (dd <= COOLDOWN_DD) {
      regime = "COOLDOWN"
      reasons.push(`Hard stop: drawdown ${dd}% <= ${COOLDOWN_DD}%`)
    } else if (health === "critical") {
      regime = "DEFENSE"
      reasons.push("Health is critical")
    } else if (dd <= DEFENSE_DD) {
      regime = "DEFENSE"
      reasons.push(`Defense: drawdown ${dd}% <= ${DEFENSE_DD}%`)
    } else {
      if (lastRegimeRef.current === "DEFENSE" && improving) {
        regime = "RECOVERY"
        reasons.push("Improving after defense → recovery mode")
      }

      if (health === "stable" && dd > NORMAL_EXIT_DD) {
        regime = "NORMAL"
        reasons.push(`Recovered: drawdown ${dd}% > ${NORMAL_EXIT_DD}% and health stable`)
      } else if (regime === "NORMAL" && health === "warning") {
        regime = "RECOVERY"
        reasons.push("Health warning → soft recovery mode")
      }
    }

    // ===============================
    // OUTPUTS
    // ===============================
    let allowTrading = true
    let riskMultiplier = 1
    let cadenceMultiplier = 1

    if (regime === "NORMAL") {
      allowTrading = true
      riskMultiplier = 1.0
      cadenceMultiplier = 1.0
    } else if (regime === "RECOVERY") {
      allowTrading = true
      riskMultiplier = 0.6
      cadenceMultiplier = 0.8
    } else if (regime === "DEFENSE") {
      allowTrading = true
      riskMultiplier = 0.4
      cadenceMultiplier = 0.7
    } else {
      // COOLDOWN
      allowTrading = false
      riskMultiplier = 0.0
      cadenceMultiplier = 0.0
      reasons.push("Cooldown active: trading paused")
    }

    if (reasons.length === 0) reasons.push("Normal operation")

    return { regime, allowTrading, riskMultiplier, cadenceMultiplier, reasons }
  }, [drawdownPct, health, disableRiskBrake])

  useEffect(() => {
    lastRegimeRef.current = policy.regime
    lastDrawdownRef.current = Number.isFinite(drawdownPct) ? drawdownPct : 0
  }, [policy.regime, drawdownPct])

  return policy
}
