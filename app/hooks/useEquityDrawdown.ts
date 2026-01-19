"use client"

import { useMemo } from "react"

type Params = {
  equityBuffer: number[]
}

/**
 * Calculates max drawdown (%) from equity curve
 */
export function useEquityDrawdown({ equityBuffer }: Params): number {
  return useMemo(() => {
    if (!equityBuffer || equityBuffer.length < 2) return 0

    let peak = equityBuffer[0]
    let maxDD = 0

    for (const value of equityBuffer) {
      if (value > peak) peak = value
      const dd = ((value - peak) / peak) * 100
      if (dd < maxDD) maxDD = dd
    }

    return Number(maxDD.toFixed(2))
  }, [equityBuffer])
}
