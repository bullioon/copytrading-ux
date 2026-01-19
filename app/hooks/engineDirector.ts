"use client"

/* ================= TYPES ================= */

export type EnginePhase =
  | "onboarding"
  | "confidence"
  | "variance"
  | "decay"
  | "collapse"

export type PhaseProfile = {
  winBoost: number
  lossDampen: number
}

/* ================= PHASE PROFILES ================= */

export const PHASE_PROFILES: Record<EnginePhase, PhaseProfile> = {
  onboarding: {
    winBoost: 1.25,   // ganas más seguido
    lossDampen: 0.6,  // pierdes poco
  },
  confidence: {
    winBoost: 1.1,
    lossDampen: 0.85,
  },
  variance: {
    winBoost: 1,
    lossDampen: 1,
  },
  decay: {
    winBoost: 0.9,
    lossDampen: 1.2,
  },
  collapse: {
    winBoost: 0.75,
    lossDampen: 1.6,
  },
}

/* ================= PHASE DECISION ================= */

export function getEnginePhase(params: {
  closedTrades: number
  equity: number
  baseBalance: number
}) : EnginePhase {

  const { closedTrades, equity, baseBalance } = params
  const equityRatio = equity / baseBalance

  // 🟢 ONBOARDING: primeras victorias
  if (closedTrades < 20) return "onboarding"

  // 🟡 CONFIDENCE: cree que ya sabe
  if (closedTrades < 50) return "confidence"

  // 🟠 VARIANCE: emociones
  if (closedTrades < 90) return "variance"

  // 🔴 DECAY: degradación lenta
  if (equityRatio > 0.6) return "decay"

  // ⚫ COLLAPSE: evento fuerte
  return "collapse"
}
