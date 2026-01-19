// app/types/strategy.ts

export type StrategyEventType =
  | "DECISION"
  | "SYSTEM"
  | "PROGRESS"
  | "FAIL"

export type StrategyEvent = {
  id: string
  time: number        // Date.now()
  type: StrategyEventType
  label: string       // texto humano
  impact?: number     // opcional (+$, %, etc)
}
