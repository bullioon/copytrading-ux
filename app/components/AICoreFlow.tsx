"use client"

import { useEffect, useMemo, useState } from "react"

export type Mode = "NEW" | "CURIOUS"
export type Intent = "STARTER" | "MT5" | "FUNDED"
export type Tier = "BULLION" | "HELLION" | "TORION"

export default function AICoreFlow({
  onTierChange,
}: {
  onTierChange?: (tier: Tier, intent: Intent | null, mode: Mode) => void
}) {
  const [mode, setMode] = useState<Mode>("NEW")
  const [intent, setIntent] = useState<Intent | null>(null)

  const tier: Tier = useMemo(() => {
    if (intent === "FUNDED") return "TORION"
    if (intent === "MT5") return "HELLION"
    return "BULLION"
  }, [intent])

  const palette = useMemo(() => {
    // neutral when nothing picked
    if (intent === null) {
      return {
        accent: "text-white/85",
        border: "border-white/10",
        glow: "rgba(255,255,255,0.06)",
        badge: "border-white/12 bg-white/[0.03] text-white/70",
        underline: "rgba(255,255,255,0.22)",
      }
    }
    if (tier === "BULLION") {
      return {
        accent: "text-emerald-200",
        border: "border-emerald-400/35",
        glow: "rgba(34,197,94,0.16)",
        badge: "border-emerald-300/20 bg-emerald-300/[0.10] text-emerald-100",
        underline: "rgba(34,197,94,0.28)",
      }
    }
    if (tier === "HELLION") {
      // ✅ HELLION red
      return {
        accent: "text-red-200",
        border: "border-red-400/35",
        glow: "rgba(239,68,68,0.16)",
        badge: "border-red-300/20 bg-red-500/[0.12] text-red-100",
        underline: "rgba(239,68,68,0.30)",
      }
    }
    return {
      accent: "text-purple-200",
      border: "border-purple-400/35",
      glow: "rgba(168,85,247,0.18)",
      badge: "border-purple-300/20 bg-purple-500/[0.14] text-purple-100",
      underline: "rgba(168,85,247,0.30)",
    }
  }, [intent, tier])

  // ✅ notify parent (correct: useEffect, not useMemo)
  useEffect(() => {
    onTierChange?.(tier, intent, mode)
  }, [onTierChange, tier, intent, mode])

  const headline = useMemo(() => {
    if (intent === null) return "Select your path."
    if (tier === "BULLION") return "BULLION selected."
    if (tier === "HELLION") return "HELLION selected."
    return "TORION selected."
  }, [intent, tier])

  const sub = useMemo(() => {
    if (intent === null) return "Each option is a unique tier. Pick one — we’ll lock the rest for clarity."
    if (tier === "BULLION") return "Start with $50 minimum. Recommended $300+ for performance-optimized allocation."
    if (tier === "HELLION") return "Connect MT5 and scale execution across accounts. Built for capacity and control."
    return "Direct funded routing up to ~400K depending on setup. Quality-first execution with lower personal risk."
  }, [intent, tier])

  // ✅ NEW/CURIOUS chooses Bullion starter
  const chooseStarterByMode = (m: Mode) => {
    setMode(m)
    setIntent("STARTER")
  }

  return (
    <section
      className={["relative w-full rounded-[22px] border bg-black/60 p-6 overflow-hidden", palette.border].join(" ")}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 120px ${palette.glow}` }}
    >
      {/* overlays never block clicks */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at 50% 45%, ${palette.glow}, rgba(0,0,0,0) 62%)` }}
      />

      <div className="relative z-10">
        {/* top */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.26em] text-white/55">STRATEGY LAB · TIER SELECTOR</div>
            <div className="mt-2 text-[15px] font-semibold tracking-tight text-white/90">{headline}</div>
            <div className="mt-1 text-[12px] text-white/60 leading-relaxed">{sub}</div>
          </div>

          <div className={["shrink-0 rounded-full border px-3 py-2", palette.badge].join(" ")}>
            <span className="text-[10px] tracking-widest">AI ROUTER</span>
          </div>
        </div>

        {/* mode row */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] tracking-widest text-white/85 font-semibold">You are...</div>
            <div className="mt-1 text-[11px] text-white/55">New or just curious (Bullion starter)</div>
          </div>

          <div className="inline-flex rounded-2xl border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => chooseStarterByMode("NEW")}
              className={[
                "px-3 py-2 rounded-xl text-[10px] tracking-widest transition",
                mode === "NEW" ? "bg-white/10 text-white" : "text-white/60 hover:text-white/85",
              ].join(" ")}
            >
              NEW
            </button>
            <button
              type="button"
              onClick={() => chooseStarterByMode("CURIOUS")}
              className={[
                "px-3 py-2 rounded-xl text-[10px] tracking-widest transition",
                mode === "CURIOUS" ? "bg-white/10 text-white" : "text-white/60 hover:text-white/85",
              ].join(" ")}
            >
              CURIOUS
            </button>
          </div>
        </div>

        {/* choices (FTMO-style cards) */}
        <div className="mt-3 grid gap-3">
          <ChoiceCard
            active={intent === "STARTER"}
            disabled={intent !== null && intent !== "STARTER"}
            accent="emerald"
            badge="BULLION"
            title="Starter routing"
            desc="Minimum $50. Start fast with AI copy-trading."
            foot="Recommended: $300+ allocation (performance optimized)."
            bestTag="RECOMMENDED"
            onClick={() => setIntent("STARTER")}
          />

          <ChoiceCard
            active={intent === "MT5"}
            disabled={intent !== null && intent !== "MT5"}
            accent="red"
            badge="HELLION"
            title="MT5 scaling"
            desc="Connect MetaTrader 5. Route execution across your accounts."
            foot="Multi-account · capacity maximization."
            icon="/mt5.png"
            bestTag="PRO"
            onClick={() => setIntent("MT5")}
          />

          <ChoiceCard
            active={intent === "FUNDED"}
            disabled={intent !== null && intent !== "FUNDED"}
            accent="purple"
            badge="TORION"
            title="Funded routing"
            desc="Direct funded path. Lower personal risk. Quality-first execution."
            foot="Up to ~400K routing capacity (depends on setup)."
            icon="/ftm.jpg"
            bestTag="BEST VALUE"
            onClick={() => setIntent("FUNDED")}
          />
        </div>

        {/* dynamic highlighted benefit line (underlined) */}
        <div className="mt-4 text-[12px] text-white/75">
          <span className="text-white/55">Key benefit:</span>{" "}
          <span
            className="font-semibold"
            style={{
              textDecoration: "underline",
              textDecorationColor: palette.underline,
              textUnderlineOffset: 6,
              textDecorationThickness: 2,
            }}
          >
            {intent === null
              ? "Pick a tier to reveal the execution path."
              : tier === "BULLION"
              ? "Fast start + strict guardrails (starter copy routing)."
              : tier === "HELLION"
              ? "MT5 multi-account scaling for maximum execution capacity."
              : "Funded capital routing for higher consistency and lower personal risk."}
          </span>
        </div>

        {/* actions */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIntent(null)}
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-[10px] tracking-widest text-white/70 hover:bg-white/[0.05] hover:border-white/20 transition"
          >
            RESET
          </button>

          <div className="text-[10px] tracking-widest text-white/45">
            {intent === null ? "locked: none" : "locked: other tiers"}
          </div>
        </div>
      </div>
    </section>
  )
}

function ChoiceCard({
  active,
  disabled,
  accent,
  badge,
  title,
  desc,
  foot,
  icon,
  bestTag,
  onClick,
}: {
  active: boolean
  disabled: boolean
  accent: "emerald" | "red" | "purple"
  badge: string
  title: string
  desc: string
  foot: string
  icon?: string
  bestTag?: string
  onClick: () => void
}) {
  const c =
    accent === "emerald"
      ? { border: "border-emerald-400/35", glow: "rgba(34,197,94,0.16)", text: "text-emerald-200" }
      : accent === "red"
      ? { border: "border-red-400/35", glow: "rgba(239,68,68,0.16)", text: "text-red-200" }
      : { border: "border-purple-400/35", glow: "rgba(168,85,247,0.18)", text: "text-purple-200" }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "text-left rounded-2xl border bg-black/45 p-4 transition overflow-hidden",
        disabled ? "opacity-35 cursor-not-allowed" : "hover:bg-white/[0.04] hover:border-white/20",
        active ? c.border : "border-white/10",
      ].join(" ")}
      style={{
        boxShadow: active
          ? `0 0 0 1px rgba(255,255,255,0.05), 0 0 70px ${c.glow}`
          : "0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[11px] tracking-widest text-white/85 font-semibold">{title}</div>
            {bestTag ? (
              <span
                className={[
                  "rounded-full border px-2 py-[2px] text-[9px] tracking-widest",
                  active ? c.border : "border-white/12",
                  active ? "bg-white/[0.04]" : "bg-black/35",
                  active ? c.text : "text-white/70",
                ].join(" ")}
              >
                {bestTag}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-[10px] tracking-widest text-white/55">{desc}</div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {icon ? <img src={icon} alt={badge} className="h-5 w-5 object-contain opacity-90" /> : null}
          <span
            className={[
              "rounded-full border px-3 py-1 text-[9px] tracking-widest",
              active ? c.border : "border-white/12",
              active ? "bg-white/[0.04]" : "bg-black/35",
              active ? c.text : "text-white/70",
            ].join(" ")}
          >
            {badge}
          </span>
        </div>
      </div>

      <div className="mt-3 text-[10px] tracking-widest text-white/45">{foot}</div>

      {active ? <div className="mt-3 text-[10px] tracking-widest text-white/70">Selected · Other tiers locked</div> : null}
    </button>
  )
}