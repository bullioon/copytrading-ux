import type { Tier } from "@/app/types/account"

export const TIER_THEME: Record<
  Tier,
  {
    text: string
    border: string
    glow: string
    line: string
    softBg: string
  }
> = {
  BULLION: {
    text: "text-green-400",
    border: "border-green-900",
    glow: "rgba(34,197,94,0.18)",
    line: "#4ade80",
    softBg: "bg-green-900/10",
  },
  HELLION: {
    text: "text-red-400",
    border: "border-red-900",
    glow: "rgba(239,68,68,0.18)",
    line: "#f87171",
    softBg: "bg-red-900/10",
  },
  TORION: {
    text: "text-purple-400",
    border: "border-purple-900",
    glow: "rgba(168,85,247,0.18)",
    line: "#c084fc",
    softBg: "bg-purple-900/10",
  },
}
