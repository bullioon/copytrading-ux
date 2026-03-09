import type { LadderLevel, LadderRunMock } from "./types"

export const LADDER_LEVELS: LadderLevel[] = [
  {
    id: "L10",
    title: "10K",
    capital: 10_000,
    feeUsd: 150,
    maxDrawdownPct: 0.30,  // 30%
    targetReturnPct: 3.00, // 300%
  },
  {
    id: "L50",
    title: "50K",
    capital: 50_000,
    feeUsd: 0,             // unlocked by promotion
    maxDrawdownPct: 0.30,
    targetReturnPct: 3.00,
    locked: true,
  },
  {
    id: "L100",
    title: "100K",
    capital: 100_000,
    feeUsd: 0,             // unlocked by promotion
    maxDrawdownPct: 0.30,
    targetReturnPct: 3.00,
    locked: true,
  },
]

export const MOCK_RUN: LadderRunMock = {
  activeLevelId: "L10",
  status: "active",
  equity: 12_450,
  returnPct: 0.245,  // 24.5%
  maxDdPct: 0.08,    // 8% dd used (visual)
  nextPayoutAtISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 13).toISOString(),
}