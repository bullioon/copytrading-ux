export type Trader = {
  id: number
  name: string

  level: "STANDARD" | "PRO" | "TORION"

  winRate: number
  avgRoi: number
  maxDrawdown: number

  strengths: string[]
  weaknesses: string[]

  isOnline: boolean
}

