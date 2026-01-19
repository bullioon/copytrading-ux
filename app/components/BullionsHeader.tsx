"use client"

import type { Tier } from "@/app/types/account"

const TIER_COLOR: Record<Tier, string> = {
  BULLION: "text-green-400 border-green-900",
  HELLION: "text-red-400 border-red-900",
  TORION: "text-purple-400 border-purple-900",
}

export default function BullionsHeader({
  tier,
  status,
  connectedTraders,
  openTrades,
}: {
  tier: Tier
  status: "idle" | "copying"
  connectedTraders: number
  openTrades: number
}) {
  const live = status === "copying" && connectedTraders > 0
  const COLOR = TIER_COLOR[tier]

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 border-b bg-black ${COLOR}`}
    >
      <span className="text-2xl font-bold tracking-tight">
        CENTORION
      </span>

      <div className="flex items-center gap-6 text-xs font-mono opacity-70">
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              live ? "bg-current animate-pulse" : "bg-white/20"
            }`}
          />
          {live ? "ENGINE LIVE" : "ENGINE IDLE"}
        </span>

        <span>TRADERS: {connectedTraders}</span>
        <span>OPEN: {openTrades}</span>
      </div>
    </header>
  )
}
