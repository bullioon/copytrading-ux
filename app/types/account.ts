export type Tier = "BULLION" | "HELLION" | "TORION"

export type Account = {
  tier: Tier
  baseBalance: number
  balance: number
  funded: boolean
}
