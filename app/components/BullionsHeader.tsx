"use client"

import type { Tier } from "@/app/types/account"

const TIER_STYLES: Record<
  Tier,
  {
    badge: string
    dot: string
    label: string
    sub: string
  }
> = {
  BULLION: {
    badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
    label: "STRATEGY LAB",
    sub: "ACTIVE TIER · BULLION",
  },
  HELLION: {
    badge: "border-red-400/20 bg-red-400/10 text-red-300",
    dot: "bg-red-400",
    label: "STRATEGY LAB",
    sub: "ACTIVE TIER · HELLION",
  },
  TORION: {
    badge: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    dot: "bg-violet-400",
    label: "STRATEGY LAB",
    sub: "ACTIVE TIER · TORION",
  },
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
  const tone = TIER_STYLES[tier]

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 bg-black/72 backdrop-blur-xl"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.03), 0 10px 28px rgba(0,0,0,0.45), 0 0 42px rgba(99,102,241,0.14), 0 0 58px rgba(168,85,247,0.10)",
        background:
          "linear-gradient(180deg, rgba(8,10,18,0.92) 0%, rgba(5,6,12,0.82) 100%)",
      }}
    >
      <div
        className="px-4 py-3 md:px-6 md:py-4"
        style={{
          background:
            "radial-gradient(900px circle at 50% -120%, rgba(99,102,241,0.16), transparent 55%), radial-gradient(700px circle at 85% 10%, rgba(168,85,247,0.12), transparent 50%)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          {/* LEFT */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${tone.dot} shadow-[0_0_14px_currentColor]`}
                />
              </div>

              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold tracking-[0.26em] text-white/85 md:text-[12px]">
                  {tone.label}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <div className="text-[11px] font-semibold tracking-[0.18em] text-white/55 md:text-[12px]">
                    {tone.sub}
                  </div>

                  <div
                    className={[
                      "rounded-full border px-2.5 py-1 text-[10px] tracking-[0.16em]",
                      tone.badge,
                    ].join(" ")}
                  >
                    {tier}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT DESKTOP */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[9px] tracking-[0.18em] text-white/35">NETWORK</div>
              <div className="mt-1 text-[11px] font-semibold text-white/90">SOLANA</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[9px] tracking-[0.18em] text-white/35">BUNKER</div>
              <div className="mt-1 text-[11px] font-semibold text-white/90">ON</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[9px] tracking-[0.18em] text-white/35">ENGINE</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-white/90">
                <span
                  className={`h-2 w-2 rounded-full ${
                    live ? "bg-emerald-400 animate-pulse" : "bg-white/20"
                  }`}
                />
                {live ? "LIVE" : "IDLE"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[9px] tracking-[0.18em] text-white/35">TRADERS</div>
              <div className="mt-1 text-[11px] font-semibold tabular-nums text-white/90">
                {connectedTraders}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[9px] tracking-[0.18em] text-white/35">OPEN</div>
              <div className="mt-1 text-[11px] font-semibold tabular-nums text-white/90">
                {openTrades}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STRIP */}
        <div className="mt-3 grid grid-cols-4 gap-2 md:hidden">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-[9px] tracking-[0.18em] text-white/35">NET</div>
            <div className="mt-1 text-[11px] font-semibold text-white/90">SOL</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-[9px] tracking-[0.18em] text-white/35">BUNKER</div>
            <div className="mt-1 text-[11px] font-semibold text-white/90">ON</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-[9px] tracking-[0.18em] text-white/35">ENGINE</div>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-white/90">
              <span
                className={`h-2 w-2 rounded-full ${
                  live ? "bg-emerald-400 animate-pulse" : "bg-white/20"
                }`}
              />
              {live ? "LIVE" : "IDLE"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-[9px] tracking-[0.18em] text-white/35">OPEN</div>
            <div className="mt-1 text-[11px] font-semibold tabular-nums text-white/90">
              {openTrades}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}