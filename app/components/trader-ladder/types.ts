export type LadderLevel = {
  id: string
  title: string
  capital: number
  feeUsd: number
  maxDrawdownPct: number // 0.30 = 30%
  targetReturnPct: number // 3.00 = 300%
  locked?: boolean
}

export type LadderRunMock = {
  activeLevelId: string
  status: "not_started" | "active" | "failed" | "passed"
  equity: number
  returnPct: number
  maxDdPct: number
  nextPayoutAtISO: string
}