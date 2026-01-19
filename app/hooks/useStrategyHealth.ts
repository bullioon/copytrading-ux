"use client"

import { useMemo } from "react"
import type { StrategyHealth } from "@/app/components/StrategyTransitionPreview"

export function useStrategyHealth({
  pnl,
  config,
}: {
  pnl: number
  config: { warningDD: number; criticalDD: number }
}): StrategyHealth {
  return useMemo(() => {
    if (pnl <= config.criticalDD) return "critical"
    if (pnl <= config.warningDD) return "warning"
    return "stable"
  }, [pnl, config.criticalDD, config.warningDD])
}
