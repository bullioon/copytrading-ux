"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import type { StrategyEvent } from "@/app/types/strategy"
import type { Account, Tier } from "@/app/types/account"

import useMarketPrices from "../hooks/useMarketPrices"
import { useTraders, Role } from "../hooks/useTraders"
import { useTradingEngine } from "../hooks/useTradingEngine"
import { useStrategyHealth } from "../hooks/useStrategyHealth"
import { useEquityDrawdown } from "../hooks/useEquityDrawdown"
import { useEnginePolicy } from "../hooks/useEnginePolicy"


import BullionsHeader from "./BullionsHeader"
import LiveTradesMT5 from "./LiveTradesMT5"
import EquityCard from "./EquityCard"
import LiveActivityFeed from "@/app/components/LiveActivityFeed"


import StrategyAssignmentPanel from "@/app/components/StrategyAssignmentPanel"
import PlanBConfigPanel from "./PlanBConfigPanel"
import StrategyMessages from "./StrategyMessages"
import TraderGrid from "@/app/components/TraderGrid"
import TraderTree from "./TraderTree"
import StrategySlots from "./StrategySlots"
import StrategyTransitionPreview from "./StrategyTransitionPreview"
import { useSixXSFeedback } from "../hooks/useSixXSFeedback"

// ✅ ESTE IMPORT FALTABA
import PhantomDeposit from "@/app/components/PhantomDeposit"
import type { TriggerOption } from "./PlanBConfigPanel"


/* ================= TYPES ================= */

type TabKey = "dashboard" | "advanced" | "wallet" | "support"

type WalletTxKind = "DEPOSIT" | "WITHDRAW"


type WalletTx = {
  id: string
  kind: WalletTxKind
  amountUsd: number
  token: "USDC" | "SOL" | "USDT" | string
  ts: number // ms
  status?: "CONFIRMED" | "PENDING" | "FAILED"
  sig?: string // solana signature (optional)
  note?: string
}

function fmtShortTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function kindLabel(k: WalletTxKind) {
  return k === "DEPOSIT" ? "DEPOSIT" : "WITHDRAW"
}

function kindTone(k: WalletTxKind) {
  return k === "DEPOSIT"
    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100/90"
    : "border-sky-300/20 bg-sky-300/10 text-sky-100/90"
}


/* ================= TYPES ================= */

type StartupPresetId = "SAFE_COPY" | "BALANCED_COPY" | "AGGRO_COPY"
type FxBurst = "NONE" | "QUICKCOPY" | "APPLY" | "TERMINAL" | "EQUITY"

/* ================= HELPERS ================= */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
function fmtTimeMMSS(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
function fmtPct(n: number) {
  return `${Math.round(n)}%`
}
function fmtAgo(sec: number) {
  if (sec < 60) return `${sec}s ago`
  const m = Math.round(sec / 60)
  return `${m}m ago`
}

function fmtUsd(n: number, opts?: { sign?: boolean; decimals?: number }) {
  const decimals = opts?.decimals ?? 2
  const num = Number(n)
  if (!Number.isFinite(num)) return "$0.00"

  const sign = opts?.sign ? (num > 0 ? "+" : num < 0 ? "-" : "") : ""
  const abs = Math.abs(num)

  const fixed = abs.toFixed(decimals)
  const [intPart, decPart] = fixed.split(".")
  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  return `${sign}$${intWithCommas}.${decPart ?? "00"}`
}

function fmtUsdInt(n: number, opts?: { sign?: boolean }) {
  return fmtUsd(n, { sign: opts?.sign, decimals: 0 })
}

function fmtDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec))

  const days = Math.floor(s / 86400)
  const remDay = s % 86400
  const h = Math.floor(remDay / 3600)
  const remH = remDay % 3600
  const m = Math.floor(remH / 60)
  const ss = remH % 60

  const HH = String(h).padStart(2, "0")
  const MM = String(m).padStart(2, "0")
  const SS = String(ss).padStart(2, "0")

  if (days > 0) return `${days}d ${HH}:${MM}:${SS}`
  return `${HH}:${MM}:${SS}`
}

/* ================= phone detection ================= */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)

    const onChange = () => setMatches(!!mql.matches)
    onChange()

    // Safari old fallback
    if (mql.addEventListener) mql.addEventListener("change", onChange)
    else mql.addListener(onChange)

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

/* ================= THEME ================= */

const TIER_THEME: Record<Tier, { text: string; border: string; line: string; glow: string }> = {
  BULLION: {
    text: "text-green-400",
    border: "border-green-900",
    line: "rgba(74,222,128,0.75)",
    glow: "rgba(74,222,128,0.22)",
  },
  HELLION: {
    text: "text-slate-300",
    border: "border-slate-700",
    line: "rgba(148,163,184,0.70)",
    glow: "rgba(148,163,184,0.18)",
  },
  TORION: {
    text: "text-purple-400",
    border: "border-purple-900",
    line: "rgba(192,132,252,0.75)",
    glow: "rgba(192,132,252,0.22)",
  },
}

/* ================= NEON GLOBAL STYLES ================= */

function AddictiveNeonStyles() {
  return (
    <style jsx global>{`
      @keyframes neonPulsePurple {
        0% {
          box-shadow: 0 0 0 rgba(168, 85, 247, 0);
          transform: translateZ(0);
        }
        50% {
          box-shadow: 0 0 46px rgba(168, 85, 247, 0.26);
        }
        100% {
          box-shadow: 0 0 0 rgba(168, 85, 247, 0);
        }
      }
      @keyframes neonPulseCyan {
        0% {
          box-shadow: 0 0 0 rgba(34, 211, 238, 0);
        }
        50% {
          box-shadow: 0 0 46px rgba(34, 211, 238, 0.24);
        }
        100% {
          box-shadow: 0 0 0 rgba(34, 211, 238, 0);
        }
      }
      @keyframes neonPulseGreen {
        0% {
          box-shadow: 0 0 0 rgba(34, 197, 94, 0);
        }
        50% {
          box-shadow: 0 0 46px rgba(34, 197, 94, 0.22);
        }
        100% {
          box-shadow: 0 0 0 rgba(34, 197, 94, 0);
        }
      }

      /* ✅ Phantom deposit pulse */
      @keyframes phantomPulse {
        0% {
          box-shadow: 0 0 0 rgba(168, 85, 247, 0);
          transform: translateZ(0);
        }
        50% {
          box-shadow: 0 0 28px rgba(168, 85, 247, 0.45), 0 0 64px rgba(168, 85, 247, 0.25);
        }
        100% {
          box-shadow: 0 0 0 rgba(168, 85, 247, 0);
        }
      }

      @keyframes popIn {
        0% {
          transform: translateY(6px) scale(0.98);
          opacity: 0;
        }
        100% {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      .neon-card {
        background: radial-gradient(900px 220px at 10% 0%, rgba(168, 85, 247, 0.1), transparent 60%),
          radial-gradient(700px 200px at 80% 20%, rgba(34, 211, 238, 0.08), transparent 60%), rgba(0, 0, 0, 0.45);
      }

      .btn-neon {
        background: radial-gradient(
          160px 120px at 20% 20%,
          rgba(255, 255, 255, 0.1),
          rgba(255, 255, 255, 0.02)
        );
      }

      .burst-quickcopy {
        animation: neonPulsePurple 0.9s ease-in-out 1;
      }
      .burst-apply {
        animation: neonPulseGreen 0.9s ease-in-out 1;
      }
      .burst-terminal {
        animation: neonPulseCyan 0.9s ease-in-out 1;
      }
      .burst-equity {
        animation: neonPulseGreen 0.9s ease-in-out 1;
      }

      .panel-pop {
        animation: popIn 220ms ease-out 1;
      }

      .chip-glass {
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
      }

      /* ✅ class para usar en el botón DEPOSIT */
      .phantom-pulse {
        animation: phantomPulse 2.2s ease-in-out infinite;
      }
    `}</style>
  )
}

/* ================= SOCIAL PULSE SEED ================= */

type SocialKind = "WITHDRAW" | "PROFIT" | "COPY" | "PAYOUT" | "ALERT"

const SOCIAL_FEED: Array<{
  user: string
  kind: SocialKind
  valueUsd?: number
  agoSec: number
  note: string
}> = [
  { user: "krato", kind: "WITHDRAW", valueUsd: 948, agoSec: 42, note: "withdrew" },
  { user: "tony", kind: "COPY", agoSec: 86, note: "is copying AX · mirroring entry" },
  { user: "mari", kind: "PAYOUT", valueUsd: 1200, agoSec: 121, note: "payout processed" },
  { user: "hex", kind: "COPY", agoSec: 176, note: "is copying EURUSD · mirroring entry" },
  { user: "atlas", kind: "ALERT", agoSec: 210, note: "low latency route enabled" },
  { user: "nyx", kind: "WITHDRAW", valueUsd: 320, agoSec: 260, note: "withdrew" },
]

/* ================= PRO OFFERS (DYNAMIC STRATEGY FEED) ================= */

type ProOffer = {
  id: string
  name: string
  subtitle: string
  preset: StartupPresetId
  createdAt: number
  expiresAt: number
  slotsLeft: number
  proOnly: boolean
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateOfferName(seed: number) {
  const A = ["PHANTOM", "NOVA", "OBSIDIAN", "NEBULA", "ECLIPSE", "HYDRA", "ORACLE", "SPECTRE", "KRAKEN", "ATLAS"]
  const B = ["SCALP", "PULSE", "DRIFT", "VORTEX", "EDGE", "VECTOR", "GAMMA", "RIFT", "ARC", "FLOW"]
  const C = ["X", "PRIME", "ZERO", "SIGMA", "ULTRA", "NIGHT", "AURA", "CORE", "NODE", "FORGE"]
  const a = A[seed % A.length]
  const b = B[(seed * 7) % B.length]
  const c = C[(seed * 13) % C.length]
  return `${a} ${b} ${c}`
}

function buildOffer(now: number): ProOffer {
  const seed = (now + Math.floor(Math.random() * 10_000)) % 1_000_000
  const preset = pick<StartupPresetId>(["SAFE_COPY", "BALANCED_COPY", "AGGRO_COPY"])
  const ttlSec = preset === "SAFE_COPY" ? 70 : preset === "BALANCED_COPY" ? 85 : 95

  const subtitle =
    preset === "SAFE_COPY"
      ? "Low variance · tight DD guard"
      : preset === "BALANCED_COPY"
        ? "Fast entry · controlled risk"
        : "High vol · aggressive timing"

  const proOnly = true

  return {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    name: generateOfferName(seed),
    subtitle,
    preset,
    createdAt: now,
    expiresAt: now + ttlSec * 1000,
    slotsLeft: preset === "AGGRO_COPY" ? 2 : preset === "BALANCED_COPY" ? 3 : 4,
    proOnly,
  }
}

/* ================= TOP STRATEGIES (ROTATING NAMES) ================= */

type TopCard = { name: string; subtitle: string; preset: StartupPresetId }

function makeTopCard(preset: StartupPresetId): TopCard {
  const now = Date.now()
  const seed = (now + Math.floor(Math.random() * 10_000)) % 1_000_000
  const name = generateOfferName(seed)

  const subtitle =
    preset === "SAFE_COPY"
      ? "Low variance · tight DD guard"
      : preset === "BALANCED_COPY"
        ? "Fast entry · controlled risk"
        : "High vol · aggressive timing"

  return { name, subtitle, preset }
}
/* ================= 6XS TERMINAL (typing) ================= */

function SixXSTerminal({
  items,
  glow,
  wrapperClassName = "",
  runActive,
  nextDecisionIn,
  stateLabel,
}: {
  items: { id: string; text: string; ts: number; kind: "info" | "good" | "warn" }[]
  glow: string
  wrapperClassName?: string
  runActive?: boolean
  nextDecisionIn?: number
  stateLabel?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // ✅ SOLO 1 MENSAJE: el último
  const last = items.length ? items[items.length - 1] : null

  // typing state
  const [typingId, setTypingId] = useState<string | null>(null)
  const [typed, setTyped] = useState<string>("")

  useEffect(() => {
    if (!mounted) return
    const msg = last
    if (!msg) return
    if (typingId === msg.id) return

    setTypingId(msg.id)
    setTyped("")

    const full = msg.text
    let i = 0

    const t = setInterval(() => {
      i++
      setTyped(full.slice(0, i))
      if (i >= full.length) clearInterval(t)
    }, 14)

    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, last?.id])

  const showText = last ? (mounted && typingId === last.id ? typed : last.text) : ""
  const isTyping = !!last && mounted && typingId === last.id && typed.length < (last.text?.length ?? 0)

  // ===================== LED LOGIC =====================
  const stateU = String(stateLabel ?? "").toUpperCase()
  const textL = String(last?.text ?? "").toLowerCase()

  // thinking = cuando está SCANNING/ARMED o cuando el texto dice "configuring"
  const isThinking =
    !!runActive &&
    (stateU === "SCANNING" ||
      stateU === "ARMED" ||
      textL.includes("configuring") ||
      textL.includes("configur") ||
      textL.includes("routing") ||
      textL.includes("waiting for a clean entry"))

  type LedMode = "IDLE" | "THINKING" | "GOOD" | "BAD" | "LIVE"

  const ledMode: LedMode = !runActive
    ? "IDLE"
    : last?.kind === "warn"
      ? "BAD"
      : last?.kind === "good"
        ? "GOOD"
        : isThinking
          ? "THINKING"
          : "LIVE"

  const LED = {
    IDLE: {
      dot: "bg-white/25",
      ring: "ring-white/10",
      glow: "rgba(255,255,255,0.10)",
      label: "IDLE",
    },
    THINKING: {
      dot: "bg-amber-300 animate-pulse",
      ring: "ring-amber-300/20",
      glow: "rgba(252,211,77,0.22)",
      label: `THINKING · next ${nextDecisionIn ?? 0}s`,
    },
    GOOD: {
      dot: "bg-emerald-300 animate-pulse",
      ring: "ring-emerald-300/20",
      glow: "rgba(74,222,128,0.22)",
      label: `LIVE · next ${nextDecisionIn ?? 0}s`,
    },
    BAD: {
      dot: "bg-rose-300 animate-pulse",
      ring: "ring-rose-300/20",
      glow: "rgba(251,113,133,0.22)",
      label: `ALERT · next ${nextDecisionIn ?? 0}s`,
    },
    LIVE: {
      dot: "bg-emerald-200/80",
      ring: "ring-emerald-200/10",
      glow: "rgba(74,222,128,0.14)",
      label: `LIVE · next ${nextDecisionIn ?? 0}s`,
    },
  }[ledMode]

  // burbuja ya existente
  const bubbleTone =
    last?.kind === "warn"
      ? "border-rose-300/20 bg-rose-300/5 text-rose-50/90"
      : last?.kind === "good"
        ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-50/90"
        : isThinking
          ? "border-amber-300/20 bg-amber-300/5 text-amber-50/90"
          : "border-white/10 bg-black/35 text-white/85"

  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-black/55 p-4 neon-card ${wrapperClassName}`}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 55px ${LED.glow}`,
      }}
    >
     {/* HEADER */}
<div className="flex items-start justify-between gap-3">
  <div className="flex items-center gap-3 min-w-0">
    {/* ICONO 6XS (SIN FONDO) */}
    <img
      src="/x9.png"
      alt="6XS"
      className="h-8 w-8 object-contain opacity-95 shrink-0"
      draggable={false}
    />

    <div className="min-w-0">
      <div className="text-[10px] tracking-widest text-white/55">
        6XS TERMINAL
      </div>
      <div className="mt-1 text-[12px] text-white/65 truncate">
        I’m here. I’m six. Your Assistant.
      </div>
  
            {/* ✅ LIVE LED */}
            <div className="mt-1 flex items-center gap-2 text-[12px] text-white/85 font-semibold">
              <span className={`h-2 w-2 rounded-full ${LED.dot}`} />
              <span className="text-white/85">{LED.label}</span>
            </div>
          </div>
        </div>

        {/* STATUS pill */}
        <div className={`rounded-2xl border border-white/10 bg-black/40 px-3 py-2 ring-1 ${LED.ring}`}>
          <div className="text-[10px] tracking-widest text-white/45">STATUS</div>
          <div className="mt-1 text-[12px] text-white/85 font-semibold">
            {runActive ? `${String(stateLabel ?? "…")}` : "IDLE"}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mt-4">
        {last ? (
          <div
            key={last.id}
            className={`rounded-2xl border px-4 py-3 text-[12px] leading-relaxed ${bubbleTone}`}
            style={{ boxShadow: `0 0 22px ${LED.glow}` }}
          >
            <span className="font-semibold text-white/90">6XS ▸ </span>
            <span>{showText}</span>
            {isTyping ? <span className="ml-1 animate-pulse text-white/90">▍</span> : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-[12px] text-white/70">
            <span className="font-semibold text-white/90">6XS ▸ </span>
            Standing by… tell me what you want to run.
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-white/35">One thought at a time. No hype. Always a next step.</div>
    </section>
  )
}

/* ================= PRO STRATEGY FEED (SSR SAFE) ================= */



function ProStrategyFeed({
  tier,
  borderClass,
  glow,
  onPickOffer,
  onUpgrade,
}: {
  tier: Tier
  borderClass: string
  glow: string
  onPickOffer: (offer: ProOffer) => void
  onUpgrade: () => void
}) {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])


  const [now, setNow] = useState(0)
  const [offers, setOffers] = useState<ProOffer[]>([])

  useEffect(() => {
    if (!hydrated) return

    const t0 = Date.now()
    setNow(t0)
    setOffers([buildOffer(t0 - 2000), buildOffer(t0 - 8000), buildOffer(t0 - 14000)])

    const tick = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(tick)
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    const t = setInterval(() => {
      setOffers(prev => {
        const n = Date.now()
        const next = [buildOffer(n), ...prev]
        return next.slice(0, 7)
      })
    }, 9000)
    return () => clearInterval(t)
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    setOffers(prev => prev.filter(o => o.expiresAt > now))
  }, [hydrated, now])

  const isPro = tier === "TORION"
  

  return (
    <section
      className={["rounded-3xl border p-4", borderClass].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 46px ${glow}`,
        background:
          "radial-gradient(900px 260px at 10% 0%, rgba(168,85,247,0.14), rgba(34,211,238,0.12), rgba(0,0,0,0.55))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/60">PRO STRATEGY DROPS</div>
          <div className="mt-1 text-[12px] text-white/70">
            New names + windows constantly. <span className="text-white/90 font-semibold">Live while timer is up.</span>
          </div>
        </div>

        {!isPro ? (
          <button
            onClick={onUpgrade}
            className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold tracking-widest text-white/90 hover:bg-white/15"
            style={{ boxShadow: `0 0 18px ${glow}` }}
          >
            UNLOCK PRO
          </button>
        ) : (
          <div className="shrink-0 rounded-2xl border border-white/15 bg-black/35 px-3 py-2">
            <div className="text-[10px] tracking-widest text-white/55">PRO</div>
            <div className="mt-1 text-[11px] text-white/90 font-semibold">LIVE</div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {!hydrated ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[11px] text-white/60">
            Spawning next drop…
          </div>
        ) : offers.length ? (
          offers.map(o => {
            const leftSec = Math.max(0, Math.floor((o.expiresAt - now) / 1000))
            const mmss = fmtTimeMMSS(leftSec)
            const locked = o.proOnly && !isPro

            return (
              <button
                key={o.id}
                onClick={() => {
                  if (locked) return
                  onPickOffer(o)
                }}
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-left transition",
                  "border-white/15 bg-black/30 hover:bg-white/10",
                  locked ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold tracking-widest text-white/95 truncate">
                      {o.name} · {o.preset.replaceAll("_", " ")}
                    </div>
                    <div className="mt-1 text-[11px] text-white/70">{o.subtitle}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[10px] tracking-widest text-white/45">WINDOW</div>
                    <div className="mt-1 text-[12px] text-white/90 font-semibold tabular-nums">{mmss}</div>
                    <div className="mt-1 text-[10px] text-white/50">{o.slotsLeft} slots</div>
                  </div>
                </div>

                {locked ? (
                  <div className="mt-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[11px] text-white/65">
                    PRO only — unlock to run this drop.
                  </div>
                ) : null}
              </button>
            )
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[11px] text-white/60">
            Spawning next drop…
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-white/40">Tip: constant rotation = always something new to try.</div>
    </section>
  )
}



function QuickCopyTopStrategies({
  borderClass,
  glow,
  enabled,
  hint,
  onPick,
  onSpecialCta,
  runActive,
  runPresetId,
  runRemainingSec,
  onStop,
  starting,
  specialHot,
  signals,
}: {
  borderClass: string
  glow: string
  enabled: boolean
  hint?: string
  onPick: (id: StartupPresetId) => void
  onSpecialCta: () => void
  runActive: boolean
  runPresetId: StartupPresetId | null
  runRemainingSec: number
  onStop: () => void
  starting: boolean
  specialHot: boolean
  signals: { drawdownPct: number; lossStreak: number; equityFlatMs: number }
}) {

// ✅ AHORA sí: hooks dentro del component
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const [top, setTop] = useState<Record<StartupPresetId, TopCard>>({
    SAFE_COPY: {
      name: "SAFE COPY",
      subtitle: "Low variance · tight DD guard",
      preset: "SAFE_COPY",
    },
    BALANCED_COPY: {
      name: specialHot ? "RECOVERY ACCESS" : "BALANCED",
      subtitle: specialHot
        ? "Recovery window detected · fast attempt"
        : "Fast entry · controlled risk",
      preset: "BALANCED_COPY",
    },
    AGGRO_COPY: {
      name: "AGGRO",
      subtitle: "High vol · aggressive timing",
      preset: "AGGRO_COPY",
    },
  })

  const timeLeft = useMemo(() => fmtDuration(runRemainingSec), [runRemainingSec])

  // ✅ PRESET DROP WINDOWS (max 6d)
  const MAX_DAYS = 6
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  type WindowState = { startAt: number; durSec: number }
  const [win, setWin] = useState<Record<StartupPresetId, WindowState> | null>(null)

  useEffect(() => {
    if (!hydrated) return
    const now = Date.now()
    const mk = (minD: number, maxD: number): WindowState => {
      const d = Math.min(MAX_DAYS, minD + Math.floor(Math.random() * (maxD - minD + 1)))
      const durSec = d * 24 * 60 * 60
      const elapsed = Math.floor(Math.random() * Math.max(1, Math.floor(durSec * 0.65)))
      return { startAt: now - elapsed * 1000, durSec }
    }
    setWin({
      SAFE_COPY: mk(1, 2),
      BALANCED_COPY: mk(2, 4),
      AGGRO_COPY: mk(3, 6),
    })
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    const t = setInterval(() => {
      setWin(prev => {
        if (!prev) return prev
        const now = Date.now()
        const keys: StartupPresetId[] = ["SAFE_COPY", "BALANCED_COPY", "AGGRO_COPY"]
        const k = keys[Math.floor(Math.random() * keys.length)]
        const mk = (minD: number, maxD: number): WindowState => {
          const d = Math.min(MAX_DAYS, minD + Math.floor(Math.random() * (maxD - minD + 1)))
          const durSec = d * 24 * 60 * 60
          return { startAt: now, durSec }
        }
        const next = { ...prev }
        next[k] = k === "SAFE_COPY" ? mk(1, 2) : k === "BALANCED_COPY" ? mk(2, 4) : mk(3, 6)
        return next
      })
    }, 12000)
    return () => clearInterval(t)
  }, [hydrated])

  // ================= SPECIAL WINDOW UX =================
const specialLabel = useMemo(() => {
  if (!specialHot) return null
  // decide nombre según motivo
  const boredom = signals.equityFlatMs >= 22_000
  const pain = signals.drawdownPct <= -6 && signals.lossStreak >= 2
  if (pain) return "RECOVERY ACCESS"
  if (boredom) return "VOLATILITY WINDOW"
  return "SPECIAL WINDOW"
}, [specialHot, signals.drawdownPct, signals.lossStreak, signals.equityFlatMs])

const specialReason = useMemo(() => {
  if (!specialHot) return ""
  const parts: string[] = []
  if (signals.drawdownPct <= -4) parts.push(`DD ${signals.drawdownPct}%`)
  if (signals.lossStreak >= 1) parts.push(`streak ${signals.lossStreak}`)
  if (signals.equityFlatMs >= 10_000) parts.push(`flat ${(signals.equityFlatMs / 1000).toFixed(0)}s`)
  return parts.join(" · ")
}, [specialHot, signals.drawdownPct, signals.lossStreak, signals.equityFlatMs])

const effectiveBalancedName = specialHot ? "RECOVERY ACCESS" : "BALANCED"
const effectiveBalancedSubtitle = specialHot
  ? "Recovery window detected · higher variance · fast attempt"
  : "Fast entry · controlled risk"

  useEffect(() => {
    if (!hydrated) return
    if (runActive) return

    setTop({
      SAFE_COPY: makeTopCard("SAFE_COPY"),
      BALANCED_COPY: makeTopCard("BALANCED_COPY"),
      AGGRO_COPY: makeTopCard("AGGRO_COPY"),
    })

    const t = setInterval(() => {
      setTop({
        SAFE_COPY: makeTopCard("SAFE_COPY"),
        BALANCED_COPY: makeTopCard("BALANCED_COPY"),
        AGGRO_COPY: makeTopCard("AGGRO_COPY"),
      })
    }, 7000)

    return () => clearInterval(t)
  }, [hydrated, runActive])

  const totalSec = useMemo(() => {
    if (!runPresetId) return 0
    return runPresetId === "SAFE_COPY"
      ? 24 * 60 * 60
      : runPresetId === "BALANCED_COPY"
        ? 3 * 24 * 60 * 60
        : 7 * 24 * 60 * 60
  }, [runPresetId])

  const progressPct = useMemo(() => {
    if (!runActive || !totalSec) return 0
    const elapsed = Math.max(0, totalSec - Math.max(0, runRemainingSec))
    const pct = (elapsed / totalSec) * 100
    return Math.max(0, Math.min(100, pct))
  }, [runActive, totalSec, runRemainingSec])

  const progressLabel = useMemo(() => {
    if (!runActive || !totalSec) return "0%"
    return `${Math.round(progressPct)}%`
  }, [runActive, totalSec, progressPct])

  const PRESET_INFO: Record<
  StartupPresetId,
  { risk: string; dd: string; pace: string; bestFor: string; tag?: string }
> = {
  SAFE_COPY: {
    risk: "LOW RISK",
    dd: "DD guard ~ -4%",
    pace: "slow / stable",
    bestFor: "Best for first run + protecting balance",
  },

  BALANCED_COPY: {
    risk: specialHot ? "RECOVERY" : "MED RISK",
    dd: specialHot ? "Recovery window · DD relief" : "DD guard ~ -6%",
    pace: specialHot ? "fast / reactive" : "moderate",
    bestFor: specialHot
      ? "Best when you’re stuck or down (can snap back)"
      : "Best for most users",
    tag: specialHot ? "SPECIAL" : "RECOMMENDED",
  },

  AGGRO_COPY: {
    risk: "HIGH RISK",
    dd: "DD guard ~ -8%",
    pace: "fast / volatile",
    bestFor: "Best for chasing spikes (can swing hard)",
  },
}
  const badgeFor = (id: StartupPresetId) =>
    id === "SAFE_COPY"
      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
      : id === "BALANCED_COPY"
        ? "border-sky-300/25 bg-sky-300/10 text-sky-100"
        : "border-rose-300/25 bg-rose-300/10 text-rose-100"

const renderPresetButton = (id: StartupPresetId) => {
  const card = top[id]
  const info = PRESET_INFO[id]
  const recommended = id === "BALANCED_COPY"

  const w = win?.[id]
const now = Date.now()
const elapsedSec = w ? Math.max(0, Math.floor((now - w.startAt) / 1000)) : 0
const remainingSec = w ? Math.max(0, w.durSec - elapsedSec) : 0
const windowPct = w && w.durSec > 0 ? Math.min(100, Math.max(0, (elapsedSec / w.durSec) * 100)) : 0
const windowLeft = w ? fmtDuration(remainingSec) : "—"


  return (
    <button
      key={id}
      disabled={!enabled}
      onClick={() => enabled && onPick(id)}
      className={[
        "w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left transition",
        enabled ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed pointer-events-none",

        // ✅ pulse + ring SOLO para BALANCED cuando specialHot
        id === "BALANCED_COPY" && specialHot ? "ring-1 ring-rose-300/30 animate-pulse" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold tracking-widest text-white/95 truncate">{card.name}</div>
          <div className="mt-1 text-[11px] text-white/70">{card.subtitle}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className={`inline-flex rounded-xl border px-2 py-1 text-[10px] tracking-widest ${badgeFor(id)}`}>
            {info.risk}
          </div>

          {recommended ? (
            <div className="mt-2 inline-flex rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[10px] tracking-widest text-white/75">
              RECOMMENDED
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-white/55 leading-snug">
        <span className="text-white/75 font-semibold">{info.dd}</span> · {info.pace}
        <br />
        <span className="text-white/70">{info.bestFor}</span>

        {/* WINDOW BAR */}
<div className="mt-3">
  <div className="flex items-center justify-between text-[10px] tracking-widest text-white/55">
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
      DROP WINDOW
    </span>
    <span className="text-white/70">{windowLeft}</span>
  </div>

  <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
    <div
      className="h-full rounded-full bg-white/25"
      style={{ width: `${windowPct}%` }}
    />
  </div>

  <div className="mt-2 text-[10px] text-white/55">
    Limited slot window · rotates automatically.
  </div>
</div>

      </div>
    </button>
  )
}
  return (
    <section
      className={["rounded-3xl border p-4", borderClass].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 46px ${glow}`,
        background:
          "radial-gradient(900px 260px at 10% 0%, rgba(34,211,238,0.16), rgba(168,85,247,0.14), rgba(0,0,0,0.55))",
      }}
    >
      {/* PROGRESS BAR (TOP) */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-widest text-white/45">{runActive ? "RUN WINDOW" : "STANDBY"}</div>
          <div className="text-[10px] tracking-widest text-white/55 tabular-nums">{runActive ? progressLabel : ""}</div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/35">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background:
                "linear-gradient(90deg, rgba(34,211,238,0.65), rgba(168,85,247,0.65), rgba(74,222,128,0.55))",
              boxShadow: `0 0 22px ${glow}`,
              transition: "width 250ms linear",
            }}
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/60">STARTUP PRESETS · LIMITED WINDOWS</div>

          {!runActive ? (
            <div className="mt-1 text-[12px] text-white/70">
              Pick a style → we auto-assign roles + apply.
            </div>
          ) : (
            <div className="mt-1 text-[12px] text-white/70">
              Running <span className="text-white/95 font-semibold">{String(runPresetId).replaceAll("_", " ")}</span> ·
              Remaining <span className="text-white/95 font-semibold tabular-nums">{timeLeft}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {runActive ? (
            <button
              onClick={onStop}
              className="rounded-2xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-[11px] font-semibold tracking-widest text-rose-100 hover:bg-rose-300/15"
            >
              STOP
            </button>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/60">MODE</div>
              <div className="mt-1 text-[11px] text-white/90 font-semibold">QUICK</div>
            </div>
          )}
        </div>
      </div>

      {!enabled && (
        <div className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-3">
          <div className="text-[11px] text-rose-100/90">{hint ?? "No traders available — connect one to execute."}</div>
        </div>
      )}



{specialHot ? (
 
 <button
    type="button"
    disabled={!enabled || runActive || starting}
    onClick={() => {
      if (!enabled || runActive || starting) return
      onSpecialCta()
    }}
    className={[
      "mt-3 w-full text-left rounded-2xl border px-4 py-3 transition panel-pop",
      "border-rose-300/25 bg-rose-300/10 hover:bg-rose-300/15",
      (!enabled || runActive || starting) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    ].join(" ")}
    style={{ boxShadow: `0 0 26px ${glow}` }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] tracking-widest text-rose-100/80">
          SPECIAL WINDOW · RECOVERY ACCESS
        </div>

        <div className="mt-1 text-[12px] text-white/90 font-semibold">
          Tap to run BALANCED now (recommended).
        </div>

        <div className="mt-1 text-[10px] text-white/55">
          dd {signals.drawdownPct}% · streak {signals.lossStreak} · flat {(signals.equityFlatMs / 1000).toFixed(0)}s
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <div className="rounded-xl border border-rose-300/25 bg-rose-300/15 px-3 py-2 text-[10px] tracking-widest text-rose-100 animate-pulse">
          LIVE
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[10px] tracking-widest text-white/80">
          RUN →
        </div>
      </div>
    </div>
  </button>
) : null}

    <div className="mt-3 space-y-2">
  {renderPresetButton("SAFE_COPY")}
  {renderPresetButton("BALANCED_COPY")}
  {renderPresetButton("AGGRO_COPY")}
</div>


      <div className="mt-3 text-[10px] text-white/45">
        {runActive
          ? "Window active. Stop anytime — diploma on finish."
          : "Pick a profile. Then choose allocation to start execution."}
      </div>
    </section>
  )
}

/* ================= DASHBOARD ================= */


function MobileTabBar({
  tab,
  onTab,
}: {
  tab: TabKey
  onTab: (k: TabKey) => void
}) {
  const items: Array<{ k: TabKey; label: string; sub: string }> = [
    { k: "dashboard", label: "DASH", sub: "core" },
    { k: "advanced", label: "ADV", sub: "roles" },
    { k: "wallet", label: "WALLET", sub: "funds" },
    { k: "support", label: "SUP", sub: "help" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto max-w-5xl px-3 py-2">
        <div className="grid grid-cols-4 gap-2">
          {items.map(it => {
            const active = tab === it.k
            return (
              <button
                key={it.k}
                onClick={() => onTab(it.k)}
                className={[
                  "rounded-2xl border px-2 py-2 text-center transition",
                  active
                    ? "border-white/20 bg-white/10"
                    : "border-white/10 bg-black/40 hover:bg-white/5",
                ].join(" ")}
              >
                <div className={["text-[11px] tracking-widest font-semibold", active ? "text-white/90" : "text-white/60"].join(" ")}>
                  {it.label}
                </div>
                <div className={["text-[9px] tracking-widest", active ? "text-white/55" : "text-white/35"].join(" ")}>
                  {it.sub}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


const TABS: ReadonlyArray<readonly [TabKey, string]> = [
  ["dashboard", "DASH"],
  ["advanced", "ADVANCED"],
  ["wallet", "WALLET"],
  ["support", "SUPPORT"],
] as const


export default function DashboardView({ account: walletAccount }: { account: Account }) {
  const router = useRouter()

  

const [tab, setTab] = useState<TabKey>("dashboard")

  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([
    {
      id: "seed-dep",
      kind: "DEPOSIT",
      amountUsd: 0.12,
      token: "SOL",
      ts: Date.now() - 1000 * 60 * 60 * 6,
      status: "CONFIRMED",
      note: "Test deposit · Phantom",
    },
  ])

  function pushWalletTx(tx: Omit<WalletTx, "id" | "ts">) {
    setWalletTxs(prev => [
      { id: `tx-${Date.now()}`, ts: Date.now(), ...tx },
      ...prev,
    ])
  }

  const walletTxsSorted = useMemo(
    () => [...walletTxs].sort((a, b) => b.ts - a.ts),
    [walletTxs]
  )


function goTab(next: TabKey) {
  setTab(next)
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", next)
    window.history.replaceState({}, "", url.toString())
  }
}

  const theme = TIER_THEME[walletAccount.tier]

const isTorion = walletAccount.tier === "TORION"
const depositMinUsd = isTorion ? 0 : 50


  
  const VERSION = "v6.9.0"

    const isMobile = useMediaQuery("(max-width: 768px)")

    // ✅ SSR / hydration stable guard (DashboardView scope)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  function WalletActivity({ items }: { items: WalletTx[] }) {
  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">TRANSACTIONS</div>
          <div className="mt-1 text-[12px] text-white/65">Real deposits & withdrawals</div>
        </div>
        <div className="text-[10px] tracking-widest text-white/45">
          {items.length ? `${items.length} items` : "EMPTY"}
        </div>
      </div>

      {!items.length ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-[12px] text-white/60">
          No transactions yet. Make a deposit to start building history.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {items.slice(0, 8).map((tx) => {
            const isDep = tx.kind === "DEPOSIT"
            const status = tx.status ?? "CONFIRMED"

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
              >

                
                {/* LEFT */}
                
                <div className="min-w-0 flex items-center gap-3">
                  {/* icon bubble */}
                  <div
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/35"
                    style={{
                      boxShadow: isDep
                        ? "0 0 0 1px rgba(255,255,255,0.05), 0 0 20px rgba(34,197,94,0.12)"
                        : "0 0 0 1px rgba(255,255,255,0.05), 0 0 20px rgba(56,189,248,0.12)",
                    }}
                  >
                    <span className="text-[14px]">{isDep ? "⬇" : "⬆"}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-1 text-[10px] tracking-widest ${kindTone(tx.kind)}`}>
                        {kindLabel(tx.kind)}
                      </span>
                      <span className="text-[10px] tracking-widest text-white/45">{status}</span>
                    </div>

                    <div className="mt-1 truncate text-[12px] font-semibold text-white/85">
                      {tx.note ?? (isDep ? "Incoming funds" : "Outgoing transfer")}
                    </div>

                    <div className="mt-1 text-[10px] tracking-widest text-white/45">
                      {new Date(tx.ts).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right">
                  <div className="text-[12px] font-semibold tabular-nums text-white/90">
                    {isDep ? "+" : "-"}
                    {fmtUsd(tx.amountUsd, { decimals: 2 })}
                  </div>
                  <div className="mt-1 text-[10px] tracking-widest text-white/50">{tx.token}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ================= PRESET DROPS (ROTATING) =================

const DROPS = [
  { id: "safe", title: "OBSIDIAN EDGE", sub: "low variance · tight DD guard", tag: "SAFE" },
  { id: "balanced", title: "NEON HYDRA", sub: "adaptive recovery · mid tempo", tag: "BAL" },
  { id: "aggro", title: "HELLION RUSH", sub: "higher volatility · faster flips", tag: "AGGRO" },
  { id: "safe2", title: "TORION COIL", sub: "patient entries · defense first", tag: "SAFE" },
  { id: "bal2", title: "QUANTUM DRIFT", sub: "smooth curve · controlled risk", tag: "BAL" },
  { id: "agg2", title: "VORTEX SNAP", sub: "momentum bias · sharp exits", tag: "AGGRO" },
]

function shuffle<T>(a: T[]) {
  const x = [...a]
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[x[i], x[j]] = [x[j], x[i]]
  }
  return x
}

const [drops, setDrops] = useState(() => shuffle(DROPS).slice(0, 3))

useEffect(() => {
  const t = setInterval(() => {
    setDrops(shuffle(DROPS).slice(0, 3))
  }, 4200)
  return () => clearInterval(t)
}, [])


// ✅ Lite mode solo por query (?lite=1)
const lite = useMemo(() => {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("lite") === "1"
}, [])


const MIN_BULLION_DEPOSIT = 50

 
/* ================= WALLET CARD (PHANTOM / SOLANA INSPIRED) ================= */
const DEMO_CARD_BALANCE = 336 // visual only
const [hoverCard, setHoverCard] = useState(false)
const [animUsd, setAnimUsd] = useState(0)

useEffect(() => {
  // anima 0 -> DEMO_CARD_BALANCE cuando NO está hover
  if (hoverCard) return

  let raf = 0
  const from = 0
  const to = DEMO_CARD_BALANCE
  const dur = 1100
  const t0 = performance.now()

  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / dur)
    const e = 1 - Math.pow(1 - p, 3) // easing suave
    setAnimUsd(from + (to - from) * e)
    if (p < 1) raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}, [hoverCard])

const cardShownUsd = hoverCard ? 0 : animUsd


/* ================= BULLION / WALLET BALANCE ================= */

const isBullion = walletAccount.tier === "BULLION"

// saldo interno (Phantom → crédito interno)
const [bullionsBalanceUsd, setBullionsBalanceUsd] = useState<number>(0)

type WalletTxKind = "DEPOSIT" | "WITHDRAW"
type WalletTx = {
  id: string
  kind: WalletTxKind
  amountUsd: number
  token: "USDC" | "SOL" | "USDT" | string
  ts: number
  status?: "CONFIRMED" | "PENDING" | "FAILED"
  note?: string
}


// saldo total visible (base + interno)
const [walletBalanceUsd, setWalletBalanceUsd] = useState<number>(0)
useEffect(() => {
  const tierU = String(walletAccount?.tier ?? "").toUpperCase()

  // ✅ seeds por tier (lo que tú pediste)
  const tierSeed =
    tierU === "HELLION" ? 1500 :
    tierU === "TORION" ? 3000 :
    0

  // ✅ DEMON seed: solo testing
  const isDemon =
    tierU === "DEMON" ||
    String((walletAccount as any)?.handle ?? "").toLowerCase() === "demon" ||
    String((walletAccount as any)?.name ?? "").toLowerCase() === "demon"
  const demonSeedUsd = 50

  const rawBase = Number(walletAccount?.baseBalance)
  const accountBase = Number.isFinite(rawBase) ? rawBase : 0

  // ✅ prioridad:
  // - BULLION: 0
  // - DEMON: 50
  // - HELLION/TORION: seed si accountBase viene 0
  // - si accountBase > 0: respeta accountBase
  const baseBalance =
    isBullion ? 0 :
    isDemon ? demonSeedUsd :
    (accountBase > 0 ? accountBase : tierSeed)

  const internal = Number(bullionsBalanceUsd ?? 0)
  setWalletBalanceUsd(Math.max(0, baseBalance + internal))
}, [
  walletAccount?.tier,
  walletAccount?.baseBalance,
  (walletAccount as any)?.handle,
  (walletAccount as any)?.name,
  bullionsBalanceUsd,
  isBullion,
])

  /* ===== FX + METRICS ===== */
  const [fx, setFx] = useState<FxBurst>("NONE")
  const [integrity, setIntegrity] = useState(88)
  const [stability, setStability] = useState(72)
  const [uptimeSec, setUptimeSec] = useState(0)
  const [starting, setStarting] = useState(false)

  /* ===== STRATEGY EVENTS (small log) ===== */
  const [strategyEvents, setStrategyEvents] = useState<StrategyEvent[]>([])
  function pushEvent(e: Omit<StrategyEvent, "id" | "time">) {
    setStrategyEvents(prev => {
      const next: StrategyEvent = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time: Date.now(),
        ...e,
      }
      
      return [next, ...prev].slice(0, 50)
    })
  }


  type QuickEvent =
  | { type: "SPECIAL_TRIGGERED"; ts: number; dd: number; streak: number; flatMs: number }
  | { type: "PRESET_VIEWED"; ts: number; presetId: StartupPresetId }
  | { type: "PRESET_CLICKED"; ts: number; presetId: StartupPresetId; specialHot: boolean; ttsMs?: number }
  | { type: "ALLOC_OPENED"; ts: number; ctx: "PRESET" | "ADVANCED" }
  | { type: "ALLOC_CONFIRMED"; ts: number; amount: number; presetId?: StartupPresetId | null }

const [quickEvents, setQuickEvents] = useState<QuickEvent[]>([])
function logQuick(e: QuickEvent) {
  setQuickEvents(prev => [...prev, e].slice(-200))
}

  /* ===== 6XS (CONVERSATIONAL) ===== */
  type SixXSKind = "info" | "good" | "warn"
  type SixXSMsg = { id: string; text: string; ts: number; kind: SixXSKind }
  const [sixxs, setSixxs] = useState<SixXSMsg[]>([])

  /* ===== 6XS PRESENCE / IDLE STATE ===== */
  const DECISION_INTERVAL_SEC = 9
  const [nextDecisionIn, setNextDecisionIn] = useState<number>(DECISION_INTERVAL_SEC)
  const lastActivityMsRef = useRef<number>(Date.now())
  const sixxsPinUntilMsRef = useRef<number>(0)
  const lastIdlePingMsRef = useRef<number>(0)
  const lastPhaseRef = useRef<string>("")
  const sixxsMuteUntilMsRef = useRef<number>(0)


  // ✅ Hook: sonido + pulse (y unlock)
  const { pulseClass, playTone, unlockAudioOnce } = useSixXSFeedback({ items: sixxs })

  function markActivity() {
    lastActivityMsRef.current = Date.now()
    setNextDecisionIn(DECISION_INTERVAL_SEC)
  }
function x9(text: string, impact: number = 0, opts?: { muteMs?: number; force?: boolean }) {
  const ts = Date.now()

  // ✅ si hay mute activo, nadie escribe excepto force
  if (!opts?.force && ts < (sixxsMuteUntilMsRef.current || 0)) return

  // ✅ activa mute si lo pides
  if (opts?.muteMs && opts.muteMs > 0) {
    sixxsMuteUntilMsRef.current = ts + opts.muteMs
  }

  const kind: SixXSKind = impact < 0 ? "warn" : impact > 0 ? "good" : "info"
  const id = `${ts}-${Math.random().toString(16).slice(2)}`

  // ✅ push siempre (sin merge) para que NO te lo “editen”
  setSixxs(prev => [...prev, { id, text, ts, kind }].slice(-6))

  pushEvent({ type: "SYSTEM", label: `6XS ▸ ${text}`, impact })
}

  /* ===== TOAST ===== */
  const [toast, setToast] = useState<{ title: string; sub?: string } | null>(null)
  function showToast(title: string, sub?: string) {
    setToast({ title, sub })
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  /* ===== TRADERS ===== */
  const {
    traders,
    assignedRoles,
    assignRole,
    clearRole,
    connectedTraders,
    applyStrategy,
    hasPendingChanges,
    isHighRisk,
    isBlocked,
    aggressiveCount,
    getRiskProfile,
  } = useTraders()

  const connectedTraderObjects = useMemo(
    () => traders.filter(t => connectedTraders.includes(t.id)),
    [traders, connectedTraders]
  )

  // ✅ si no hay traders conectados, usamos el pool completo para SIM
  const engineTraders = useMemo(() => {
    return connectedTraderObjects.length ? connectedTraderObjects : traders
  }, [connectedTraderObjects, traders])

  /* ================= RUN WINDOW + STOP + DIPLOMA ================= */

  type RunState = {
    active: boolean
    presetId: StartupPresetId | null
    durationSec: number
    startedAtMs: number
    startPnl: number
    startBalance: number
  }

  const [run, setRun] = useState<RunState>({
    active: false,
    presetId: null,
    durationSec: 0,
    startedAtMs: 0,
    startPnl: 0,
    startBalance: 0,
  })

  /* ===== ROLE SELECTION (MIN) ===== */
const [activeRole, setActiveRole] = useState<Role | null>(null)


  // ✅ SSR SAFE: no Date.now in initial state
  const [nowMs, setNowMs] = useState<number>(0)
  useEffect(() => {
    if (!hydrated) return
    setNowMs(Date.now())
    const t = setInterval(() => setNowMs(Date.now()), 250)
    return () => clearInterval(t)
  }, [hydrated])

  const runElapsedSec = run.active ? Math.max(0, Math.floor((nowMs - run.startedAtMs) / 1000)) : 0
  const runRemainingSec = run.active ? Math.max(0, run.durationSec - runElapsedSec) : 0

  /* ===== EQUITY BUFFER ===== */
  const [equityBuffer, setEquityBuffer] = useState<number[]>([])

  /* ===== BASELINE (BALANCE INICIAL FIJO) ===== */
  const [baselineUsd, setBaselineUsd] = useState<number | null>(null)

  /* ===== DRAWDOWN + HEALTH ===== */
const drawdown = useEquityDrawdown({ equityBuffer })
const [planBTrigger, setPlanBTrigger] = useState<TriggerOption>(-6)



/* ===== PLAN B TRADER (BACKUP) ===== */
const [planBTraderId, setPlanBTraderId] = useState<number | null>(null)

const healthStatus = useStrategyHealth({
  pnl: drawdown,
  config: { warningDD: planBTrigger + 2, criticalDD: planBTrigger },
})/* ================= CAPITAL ================= */

// ✅ saldo asignado al engine (lo “bloqueado” para correr estrategia)
const [allocatedUsd, setAllocatedUsd] = useState<number>(0)

/* ===== RISK BRAKE OVERRIDE ===== */
const [disableRiskBrake, setDisableRiskBrake] = useState(false)


useEffect(() => {
  const tierU = String(walletAccount?.tier ?? "").toUpperCase()

  // ✅ DEMON seed: solo para testing
  const isDemon =
    String((walletAccount as any)?.handle ?? "").toLowerCase() === "demon" ||
    String((walletAccount as any)?.name ?? "").toLowerCase() === "demon" ||
    String((walletAccount as any)?.tier ?? "").toUpperCase() === "DEMON"

  const demonSeedUsd = 50

  // ✅ base:
  // - DEMON: 50
  // - BULLION: 0 (free)
  // - otros: baseBalance del account
  const rawAccountBase = Number(walletAccount?.baseBalance)
  const accountBase = Number.isFinite(rawAccountBase) ? rawAccountBase : 0

const tierSeed =
  tierU === "HELLION" ? 1500 :
  tierU === "TORION" ? 3000 :
  0

const base =
  isDemon ? demonSeedUsd :
  isBullion ? 0 :
  (accountBase > 0 ? accountBase : tierSeed)

  const bullion = Number(bullionsBalanceUsd ?? 0)

  const total = Math.max(0, base + bullion)

  setWalletBalanceUsd(total)
}, [
  walletAccount?.tier,
  walletAccount?.baseBalance,
  bullionsBalanceUsd,
  isBullion,
  (walletAccount as any)?.handle,
  (walletAccount as any)?.name,
])

const realBalanceUsd = walletBalanceUsd
const canTrade = !isBullion || realBalanceUsd >= MIN_BULLION_DEPOSIT


/* ===== AVAILABLE FOR ALLOCATION (NO DEPENDE DEL ENGINE) ===== */
const availableUsd = run.active ? Math.max(0, realBalanceUsd - allocatedUsd) : realBalanceUsd

/* ================= ENGINE ACCOUNT (SEPARADO DEL WALLET) ================= */
// ✅ El engine usa allocatedUsd SOLO cuando está corriendo.
// ✅ Cuando está apagado, le damos el balance real para que NO muestre 0.

const engineAccount = useMemo(() => {
  
  const baseBalance = run.active ? allocatedUsd : realBalanceUsd
  return {
    baseBalance,
    active: run.active,
  }
}, [run.active, allocatedUsd, realBalanceUsd])


/* ================= POLICY (SIN CICLOS) ================= */

const [engineDdPct, setEngineDdPct] = useState(0)

const policy = useEnginePolicy({
  drawdownPct: engineDdPct,
  health: healthStatus,
  disableRiskBrake,
})


/* ================= ENGINE INPUT ================= */
/**
 * El engine SOLO opera con allocatedUsd cuando run.active.
 * Cuando run.active = false, el engine puede mostrar saldo real,
 * pero NO opera.
 */

const engineBaseBalance = run.active ? allocatedUsd : realBalanceUsd

console.log("[ALLOC]", {
  runActive: run.active,
  allocatedUsd,
  realBalanceUsd,
  engineBaseBalance,
})

/* ================= ENGINE ================= */


const market = useMarketPrices() // ✅ REAL


const engine = useTradingEngine({
  account: engineAccount,   // ❗ NO uses `account` real aquí
  traders: engineTraders,
  market,
  policy,
  runActive: run.active,
  disableRiskBrake,
})


const { metrics, trades, status } = engine

useEffect(() => {
  const open = trades.filter(t => t.status === "open")
  console.log("[UI TRADES CHECK]", {
    total: trades.length,
    open: open.length,
    sampleOpen: open[0],
    sampleAll: trades[0],
  })
}, [trades])


/* ================= UI TRADES DEBUG ================= */

useEffect(() => {
  const open = trades.filter(t => t.status === "open")
  console.log("[UI TRADES]", {
    total: trades.length,
    open: open.length,
    sample: open[0],
  })
}, [trades])

/* ================= TRADE TRANSITIONS (OPEN / CLOSE) ================= */

const prevTradesRef = useRef<typeof trades>([])

useEffect(() => {
  const prev = prevTradesRef.current
  const curr = trades

  const prevById = new Map(prev.map(t => [t.id, t]))
  const currById = new Map(curr.map(t => [t.id, t]))

  /* ===== OPEN (NUEVO) ===== */
  for (const t of curr) {
    if (!prevById.has(t.id) && t.status === "open") {
      playTone?.("good")
      x9(`Opened ${t.pair} ${t.direction} · risk ${fmtUsd(t.riskUsd)}`, +1)

      pushEvent({
        type: "SYSTEM",
        label: `OPEN ${t.pair} ${t.direction}`,
        impact: +1,
      })

      // 🔥 aquí luego conectas proximity / speed / truster
      // reactToTrade?.({ type: "OPEN", trade: t })
    }
  }

  /* ===== CLOSE (open → closed) ===== */
  for (const p of prev) {
    const t = currById.get(p.id)
    if (p.status === "open" && t && t.status === "closed") {
      const impact = t.pnlUsd > 0 ? 1 : t.pnlUsd < 0 ? -1 : 0

      playTone?.(impact > 0 ? "good" : impact < 0 ? "warn" : "info")

      x9(
        `Closed ${t.pair} · ${t.closeReason} · PnL ${fmtUsd(t.pnlUsd, { sign: true })}`,
        impact
      )

      pushEvent({
        type: "SYSTEM",
        label: `CLOSE ${t.pair} ${t.closeReason} ${fmtUsd(t.pnlUsd, { sign: true })}`,
        impact,
      })

      // 🔥 aquí luego conectas proximity / speed / truster
      // reactToTrade?.({ type: "CLOSE", trade: t })
    }
  }

  prevTradesRef.current = curr
}, [trades, playTone])

/* ================= ENGINE VISUAL CHECK ================= */

useEffect(() => {
  console.log("[ENGINE VISUAL CHECK]", {
    engineStatus: status,
    runActive: run.active,
    traders: engineTraders.length,
    marketOk: !!market,
    baseBalance: engineBaseBalance,
    allowTrading: policy.allowTrading,
    paused: metrics.paused,
    openTrades: trades.filter(t => t.status === "open").length,
    synthBtc: metrics.synthPrices?.btc,
  })
}, [
  status,
  run.active,
  engineTraders.length,
  market,
  engineBaseBalance,
  policy.allowTrading,
  metrics.paused,
  metrics.synthPrices?.btc,
  trades.length,
])

/* ================= DRAWDOWN MIRROR ================= */

useEffect(() => {
  const dd = Number.isFinite(metrics.drawdownPct) ? metrics.drawdownPct : 0
  setEngineDdPct(dd)
}, [metrics.drawdownPct])

/* ================= OPEN TRADES (UI) ================= */

const openTrades = useMemo(
  () => trades.filter(t => t.status === "open"),
  [trades]
)

/* ================= SIGNALS (PSYCHO) ================= */

/* ===== LOSS STREAK ===== */
const lossStreak = useMemo(() => {
  const closed = [...trades]
    .filter(t => t.status === "closed")
    .sort((a, b) => b.closedAt - a.closedAt)

  let s = 0
  for (const t of closed) {
    if (t.pnlUsd < 0) s++
    else break
  }
  return s
}, [trades])

/* ===== EQUITY FLAT (ms) ===== */
const lastEquityMoveMsRef = useRef<number>(Date.now())

useEffect(() => {
  const n = equityBuffer.length
  if (n < 2) return
  const prev = equityBuffer[n - 2]
  const curr = equityBuffer[n - 1]
  if (Math.abs(curr - prev) >= 0.01) lastEquityMoveMsRef.current = Date.now()
}, [equityBuffer])

const [clock, setClock] = useState(0)
useEffect(() => {
  const t = setInterval(() => setClock(c => c + 1), 1000)
  return () => clearInterval(t)
}, [])

const equityFlatMs = useMemo(() => {
  return Math.max(0, Date.now() - lastEquityMoveMsRef.current)
}, [clock])


/* ===== SPECIAL WINDOW ON/OFF ===== */
const specialHot = useMemo(() => {
  const a = drawdown <= -6 && lossStreak >= 2
  const b = equityFlatMs >= 22_000 && (drawdown <= -4 || lossStreak >= 1)
  return a || b
}, [drawdown, lossStreak, equityFlatMs])

const specialFirstSeenMsRef = useRef<number>(0)
const specialWasHotRef = useRef<boolean>(false)

useEffect(() => {
  if (!specialHot) {
    specialWasHotRef.current = false
    specialFirstSeenMsRef.current = 0
    return
  }
  if (specialWasHotRef.current) return
  specialWasHotRef.current = true
  specialFirstSeenMsRef.current = Date.now()

  logQuick({
    type: "SPECIAL_TRIGGERED",
    ts: Date.now(),
    dd: drawdown,
    streak: lossStreak,
    flatMs: equityFlatMs,
  })
}, [specialHot, drawdown, lossStreak, equityFlatMs])

/* ===== BASELINE (BALANCE INICIAL FIJO, SIEMPRE WALLET REAL) ===== */
useEffect(() => {
  // Si no hay run, limpia baseline para que el próximo run vuelva a fijarlo
  if (!run.active) {
    if (baselineUsd !== null) setBaselineUsd(null)
    return
  }

  // Al iniciar un run: baseline = wallet real (NO allocated)
  if (baselineUsd === null && realBalanceUsd > 0) {
    setBaselineUsd(realBalanceUsd)
  }
}, [run.active, baselineUsd, realBalanceUsd])



/* ===== 6XS STATE MACHINE ===== */
const sixxsState = useMemo(() => {
  if (!run.active) return "IDLE"
  if (!policy?.allowTrading) return "LOCKED"
  if (openTrades.length > 0) return "IN_POSITION"

  if (status === "copying") return "SCANNING"
  if (status === "idle") return "IDLE"

  return "ARMED"
}, [run.active, policy?.allowTrading, openTrades.length, status])

const lastSixxsStateRef = useRef<string>("")

useEffect(() => {
  if (lastSixxsStateRef.current === sixxsState) return
  lastSixxsStateRef.current = sixxsState

  if (sixxsState === "IDLE") x9("Idle. Start a run to begin scanning.", 0)
  if (sixxsState === "LOCKED") x9("Holding. Policy block active — no new entries.", -1)
  if (sixxsState === "IN_POSITION") x9("In position. Managing risk + exits.", 0)
  if (sixxsState === "SCANNING") x9("Scanning… waiting for a clean entry.", 0)
  if (sixxsState === "ARMED") x9("Armed. Ready for next signal.", 0)

  markActivity()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [sixxsState])

const enginePnl = Number.isFinite(metrics?.pnl) ? Number(metrics.pnl) : 0

// ✅ lo que el usuario siente como “balance”: wallet real + pnl del engine
const currentTotalUsd = realBalanceUsd + enginePnl

const ref = baselineUsd ?? realBalanceUsd
const deltaFromBase = currentTotalUsd - ref

const balanceTone =
  deltaFromBase < 0 ? "text-rose-300" :
  deltaFromBase > 0 ? "text-emerald-300" :
  "text-white/90"


  /* ===== 6XS HEARTBEAT + NEXT DECISION COUNTDOWN ===== */
  useEffect(() => {
    if (!run.active) return

    if (lastPhaseRef.current !== "RUN_START") {
      lastPhaseRef.current = "RUN_START"
      x9("Run is live. Monitoring signals…", 0)
      markActivity()
    }
const t = setInterval(() => {
  const now = Date.now()

  // ✅ si hay “mute” activo (SPECIAL / evento fuerte), no escribas nada
  if (now < (sixxsMuteUntilMsRef.current || 0)) return

  setNextDecisionIn(s => (s <= 1 ? DECISION_INTERVAL_SEC : s - 1))

  const idleForMs = now - lastActivityMsRef.current
  const canPing = now - lastIdlePingMsRef.current > 8000

  if (idleForMs > 12000 && canPing) {
    lastIdlePingMsRef.current = now

    const st = String(status || "").toLowerCase()
    const reasons = policy?.reasons?.length ? policy.reasons.join(" • ") : ""
    const regime = policy?.regime ? String(policy.regime) : ""

        if (
          reasons.toLowerCase().includes("blocked") ||
          reasons.toLowerCase().includes("pause") ||
          regime.toLowerCase().includes("halt")
        ) {
          x9(`Holding. Policy block active. ${reasons ? `(${reasons})` : ""}`, -1)
          return
        }

        if (st.includes("copy")) {
  // ✅ si hay pin activo, NO pises el mensaje
  if (Date.now() < (sixxsPinUntilMsRef.current || 0)) return
  x9("Configuring execution… almost ready.", 0)
  return
}
        x9(`Scanning… Next decision in ${DECISION_INTERVAL_SEC}s.`, 0)
      }
    }, 1000)

    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.active, status, policy])


 /* ================= CAPITAL ALLOCATION (ONE STRATEGY AT A TIME) ================= */

const [allocOpen, setAllocOpen] = useState(false)
const [allocContext, setAllocContext] = useState<
  | { mode: "PRESET"; presetId: StartupPresetId }
  | { mode: "ADVANCED_APPLY" }
  | null
>(null)

const toNum = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "")
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

const lastGoodBalanceRef = useRef<number>(0)

useEffect(() => {
  const v = toNum(availableUsd)
  if (v > 0) lastGoodBalanceRef.current = v
}, [availableUsd])


/* ===== OPEN ALLOCATION ===== */
function requestAllocation(ctx: NonNullable<typeof allocContext>) {
  // telemetry
  logQuick({
    type: "ALLOC_OPENED",
    ts: Date.now(),
    ctx: ctx.mode === "PRESET" ? "PRESET" : "ADVANCED",
  })

  if (run.active) {
    showToast("Already running", "STOP the current strategy first")
    x9("You already have an active strategy. Stop it first.", -1)
    return
  }

  setAllocContext(ctx)
  setAllocOpen(true)
}
function confirmAllocation(amount: number) {
  const safeAvailable = Number.isFinite(availableUsd) ? availableUsd : 0
  if (safeAvailable <= 0) {
    showToast("No funds available", "Your available balance is $0.00")
    setAllocOpen(false)
    return
  }

  if (!allocContext) {
    setAllocOpen(false)
    setStarting(false)
    return
  }

  const amt = Number(amount)
  const safeAmount = clamp(Number.isFinite(amt) ? amt : 0, 0, safeAvailable)

  // ✅ capture context once, then clear
  const ctx = allocContext
  setAllocContext(null)

  // ✅ close modal
  setAllocOpen(false)

  // ✅ allocate to engine (ONE TIME)
  setAllocatedUsd(safeAmount)

  // ✅ apply strategy/preset FIRST (so it doesn't get blocked by run.active)
  if (ctx.mode === "PRESET") {
    // no timeout needed, but keeping a tiny delay avoids racey UI logs
    setTimeout(() => applyStartupPreset(ctx.presetId, safeAmount), 0)
  } else {
    setTimeout(() => applyStrategy(), 0)
  }

  // ✅ start run AFTER applying strategy/preset
  setRun({
    active: true,
    presetId: ctx.mode === "PRESET" ? ctx.presetId : null,
    durationSec:
      ctx.mode === "PRESET"
        ? (ctx.presetId === "SAFE_COPY"
            ? 24 * 60 * 60
            : ctx.presetId === "BALANCED_COPY"
              ? 3 * 24 * 60 * 60
              : 7 * 24 * 60 * 60)
        : 3 * 24 * 60 * 60,
    startedAtMs: Date.now(),
    startPnl: 0,

    // 🔥 snapshot REAL (no allocated)
    startBalance: toNum(realBalanceUsd),
  })

  // ✅ UI feedback
  setStarting(false)
  showToast("RUN LIVE", `Allocated ${fmtUsd(safeAmount)}`)
  x9(`Run started · allocated ${fmtUsd(safeAmount)} · engine armed`, 1)
}


  /* ===== UPTIME + SOFT PROGRESS ===== */
  useEffect(() => {
    if (!run.active) return

    const t = setInterval(() => {
      setUptimeSec(s => s + 1)
      setIntegrity(v => clamp(v + 0.02, 70, 99))

      const isExecuting = String(status || "").toLowerCase().includes("copy")
      setStability(v => clamp(v + (isExecuting ? 0.04 : 0.015), 60, 98))
    }, 1000)

    return () => clearInterval(t)
  }, [run.active, status])

  useEffect(() => {
  if (starting && run.active) {
    setStarting(false)
  }
}, [starting, run.active])

  /* ===== HEALTH EVENT LOG ===== */
  const lastHealthRef = useRef<string | null>(null)
  useEffect(() => {
    if (!healthStatus) return
    if (lastHealthRef.current === healthStatus) return
    if (lastHealthRef.current !== null) {
      pushEvent({
        type: healthStatus === "stable" ? "PROGRESS" : healthStatus === "warning" ? "SYSTEM" : "FAIL",
        label:
          healthStatus === "stable"
            ? "Health stabilized — routes normalized"
            : healthStatus === "warning"
              ? "Warning — drawdown pressure rising"
              : "Critical — Plan B threshold threatened",
        impact: healthStatus === "critical" ? -2 : healthStatus === "warning" ? -1 : 1,
      })
    }
    lastHealthRef.current = healthStatus
  }, [healthStatus])

  const [diplomaOpen, setDiplomaOpen] = useState(false)
  const [diploma, setDiploma] = useState<{
    presetId: StartupPresetId
    endedBy: "AUTO" | "MANUAL"
    durationSec: number
    elapsedSec: number
    progressPct: number
    startBalance: number
    endBalance: number
    pnlDelta: number
    background: string
    issuedAt: number
  } | null>(null)

  function endRun(endedBy: "AUTO" | "MANUAL") {
    if (!run.active || !run.presetId || !metrics) return

    const endBalance = (equityBuffer?.[equityBuffer.length - 1] ?? metrics.balance) + bullionsBalanceUsd
    const endPnl = metrics.pnl
    const pnlDelta = endPnl - run.startPnl
    const elapsedSec = Math.min(run.durationSec, Math.floor((Date.now() - run.startedAtMs) / 1000))
    const progressPct = run.durationSec > 0 ? Math.min(100, Math.round((elapsedSec / run.durationSec) * 100)) : 0

    setRun({
      active: false,
      presetId: null,
      durationSec: 0,
      startedAtMs: 0,
      startPnl: 0,
      startBalance: 0,
    })

    setDiploma({
      presetId: run.presetId,
      endedBy,
      durationSec: run.durationSec,
      elapsedSec,
      progressPct,
      startBalance: run.startBalance,
      endBalance,
      pnlDelta,
      background: " ",
      issuedAt: Date.now(),
    })

    setDiplomaOpen(true)

    pushEvent({
      type: endedBy === "AUTO" ? "SYSTEM" : "DECISION",
      label: endedBy === "AUTO" ? "Run completed — window expired" : "Run stopped manually",
      impact: endedBy === "AUTO" ? 1 : -1,
    })

    showToast("Run finished", endedBy === "AUTO" ? "Window completed" : "Stopped manually")
    x9(endedBy === "AUTO" ? "Window complete. Certificate generated." : "Manual stop confirmed. Certificate generated.", 1)
  }

  useEffect(() => {
    if (!run.active) return
    if (run.durationSec > 0 && runRemainingSec <= 0) endRun("AUTO")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runRemainingSec, run.active])


  
  /* ===== STARTUP PRESETS (TOP STRATEGIES) ===== */
  function applyStartupPreset(id: StartupPresetId, allocationUsd: number) {
    if (run.active) {
      showToast("Already running", "STOP the current strategy first")
      x9("Already running a strategy. Stop it before starting another.", -1)
      return
    }

    x9(`Loading ${id.replaceAll("_", " ")}. Routing execution modules…`, 1)

const hardMax =
  toNum(equityBuffer?.[equityBuffer.length - 1] ?? metrics?.balance ?? 0) + toNum(bullionsBalanceUsd)

const locked = clamp(allocationUsd, 0, hardMax)

setAllocatedUsd(locked)
x9(`Capital locked → ${fmtUsd(locked)} (max ${fmtUsd(hardMax)})`, 1)

    const hasConnected = connectedTraderObjects.length > 0
    const pool = hasConnected ? connectedTraderObjects : traders
    const isSim = !hasConnected

if (isSim) {
  x9("No traders connected. SIM MODE engaged (engine simulated trades).", 0)
  showToast("SIM MODE", "No traders connected — simulated execution ON")
  // ✅ NO return — dejamos que el engine siga y cree trades
}

    // ✅ DURACIÓN EN DÍAS (UI strategy run window)
 
    const MAX_DAYS = 6

// “perfil” base: safe tiende a menos, aggro tiende a más, pero siempre <= 6
const days =
  id === "SAFE_COPY" ? (1 + Math.floor(Math.random() * 2)) :          // 1–2
  id === "BALANCED_COPY" ? (2 + Math.floor(Math.random() * 3)) :      // 2–4
  (3 + Math.floor(Math.random() * 4))                                 // 3–6

const durationSec = Math.min(MAX_DAYS, days) * 24 * 60 * 60


    setRun({
      active: true,
      presetId: id,
      durationSec,
      startedAtMs: Date.now(),
      startPnl: metrics?.pnl ?? 0,
      startBalance: (equityBuffer?.[equityBuffer.length - 1] ?? metrics?.balance ?? 0) + bullionsBalanceUsd,
    })

    x9("Window armed. Monitoring drawdown + stability.", 1)

    const t1 = pool[0]?.id
    const t2 = pool[1]?.id ?? pool[0]?.id

    ;(["RISK", "ENTRY", "EXIT"] as Role[]).forEach(r => {
      try {
        clearRole(r)
      } catch {}
    })

    if (id === "SAFE_COPY") {
      if (t1 != null) assignRole("RISK", t1)
      setPlanBTrigger(-4)
    }
    if (id === "BALANCED_COPY") {
      if (t1 != null) assignRole("ENTRY", t1)
      if (t2 != null) assignRole("RISK", t2)
      setPlanBTrigger(-6)
    }
    if (id === "AGGRO_COPY") {
      if (t1 != null) assignRole("ENTRY", t1)
      if (t2 != null) assignRole("EXIT", t2)
      setPlanBTrigger(-8)
    }

    x9(`Strategy loaded → ${id.replaceAll("_", " ")}`, 2)

    setFx("QUICKCOPY")
    setTimeout(() => setFx("EQUITY"), 220)
    setTimeout(() => setFx("TERMINAL"), 420)
    setTimeout(() => setFx("APPLY"), 620)
    setTimeout(() => setFx("NONE"), 1100)

    if (isSim) {
      const base = equityBuffer?.[equityBuffer.length - 1] ?? metrics?.balance ?? 0
      const nudge =
        id === "SAFE_COPY"
          ? Math.random() * 0.8 - 0.3
          : id === "BALANCED_COPY"
            ? Math.random() * 1.6 - 0.6
            : Math.random() * 2.4 - 1.2

      setEquityBuffer(prev => {
        const last = prev.length ? prev[prev.length - 1] : base
        const next = [...prev, last + nudge]
        return next.length > 160 ? next.slice(-160) : next
      })

      x9(`SIM tick → ${nudge >= 0 ? "+" : ""}${nudge.toFixed(2)} USD (preview)`, nudge >= 0 ? 1 : -1)
      showToast("🧪 STRATEGY (SIM)", `Preset: ${id.replaceAll("_", " ")}`)
      x9("Simulated execution armed. Visual feedback only.", 0)

      setIntegrity(v => clamp(v + 1.2, 70, 99))
      setStability(v => clamp(v + 1.6, 60, 98))
      return
    }

    showToast("🚀 STRATEGY LIVE", `Preset: ${id.replaceAll("_", " ")}`)
    x9("Execution pipeline armed. Live routing starting…", 1)

    // ✅ deja que React “asiente” los roles antes de aplicar strategy
setTimeout(() => {
  // aplica routing/roles a la estrategia
  applyStrategy()

  // por si el engine quedó en pausa por policy/risk brake
  try {
    engine.actions.setPaused(false)
  } catch {}

  x9("Routing applied. Scanning for first entry…", 0)

  // tu checker de “no entry yet”
  setTimeout(() => {
    const hasOpen = (engine?.trades ?? []).some(t => t.status === "open")
    const last = equityBuffer?.[equityBuffer.length - 1] ?? metrics?.balance ?? 0
    const start = run.startBalance || last

    if (!hasOpen && Math.abs(last - start) < 0.01) {
      x9("Armed. Waiting for first signal… (no entry yet)", 0)
      showToast("Armed", "Waiting for first entry signal")
      setFx("TERMINAL")
      setTimeout(() => setFx("NONE"), 600)
    }
  }, 1200)
}, 120) // 👈 clave: NO 0, ponle 120ms

    setIntegrity(v => clamp(v + 1.2, 70, 99))
    setStability(v => clamp(v + 1.6, 60, 98))
  }

  /* ===== DERIVED UI VALUES ===== */
  const equityDisplay = equityBuffer
  const initialDisplay = realBalanceUsd

  const assignedCount = useMemo(
    () => Object.values(assignedRoles as any).filter(Boolean).length,
    [assignedRoles]
  )
  const hasAtLeastOneRole = assignedCount > 0
  const canApply = hasAtLeastOneRole && !run.active && !starting && !isBlocked


  /* ===== GUARD (ONLY ONCE) ===== */
const waiting =
  !hydrated ? "hydration" :
  !market ? "market" :
  !metrics ? "metrics" :
  null

  if (waiting) {
  return (
    <main className={`min-h-screen bg-black font-mono ${theme.text}`}>
      <AddictiveNeonStyles />
      <BullionsHeader tier={walletAccount.tier} status="idle" connectedTraders={0} openTrades={0} />
      <div className="p-6 text-xs text-white/60">
        loading: <span className="text-white/90 font-semibold">{waiting}</span>
      </div>
    </main>
  )
}

// ================= LITE MODE (QUERY FLAG) =================
if (lite) {
  const equityLite = realBalanceUsd + enginePnl

  return (
    <main className={`min-h-screen bg-black font-mono ${theme.text} pb-28`}>
      <AddictiveNeonStyles />

      <BullionsHeader
        tier={walletAccount.tier}
        status={status}
        connectedTraders={connectedTraderObjects.length}
        openTrades={openTrades.length}
      />

      <Toast toast={toast} />

      <div className="p-4 space-y-3">
        {/* HERO CARD */}
        <div
          className="rounded-[24px] border border-white/10 bg-black/55 p-4 neon-card"
          style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 60px ${theme.glow}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-widest text-white/55">LITE MODE</div>
              <div className="mt-1 text-[13px] text-white/90 font-semibold">Mobile dashboard</div>
              <div className="mt-1 text-[11px] text-white/55">
                Clean + fast. Full UI: remove <span className="text-white/80 font-semibold">?lite=1</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
              <div className="text-[10px] tracking-widest text-white/45">STATUS</div>
              <div className="mt-1 text-[12px] text-white/85 font-semibold">
                {run.active ? "RUNNING" : "IDLE"}
              </div>
            </div>
          </div>

          {/* BIG METRIC */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="text-[10px] tracking-widest text-white/45">EQUITY</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white/95 tabular-nums">
              {fmtUsd(equityLite)}
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              Wallet {fmtUsd(realBalanceUsd)} · Engine PnL {fmtUsd(enginePnl, { sign: true })}
            </div>
          </div>


          {/* QUICK ACTIONS */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => goTab("wallet")}
              className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-[11px] tracking-widest text-white/80 hover:bg-white/5"
            >
              WALLET
            </button>

            <button
              onClick={() => goTab("advanced")}
              className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-[11px] tracking-widest text-white/80 hover:bg-white/5"
            >
              ADVANCED
            </button>
          </div>
        </div>

        {/* MINI FEED */}
        <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-white/55">LAST EVENTS</div>
            <div className="text-[10px] tracking-widest text-white/35">{strategyEvents.length}</div>
          </div>

          <div className="mt-3 space-y-2">
            {(strategyEvents.slice(0, 4) ?? []).map(e => (
              <div key={e.id} className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2">
                <div className="text-[11px] text-white/80">{e.label}</div>
                <div className="mt-1 text-[10px] text-white/35">{new Date(e.time).toLocaleTimeString()}</div>
              </div>
            ))}
            {!strategyEvents.length ? (
              <div className="text-[11px] text-white/45">No events yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom tabs in lite too */}
      {isMobile ? <MobileTabBar tab={tab} onTab={goTab} /> : null}
    </main>
  )
}

return (
  <main className={`min-h-screen bg-black font-mono ${theme.text}`}>
    <AddictiveNeonStyles />

    <BullionsHeader
      tier={walletAccount.tier}
      status={status}
      connectedTraders={connectedTraderObjects.length}
      openTrades={openTrades.length}
    />

    <Toast toast={toast} />

    <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-28">

      {/* ================= TOP MENU (DESKTOP) ================= */}
      {!isMobile ? (
        <div className="rounded-2xl border border-white/10 bg-black/35 p-2 flex flex-wrap gap-2">
          {TABS.map(([tabKey, tabLabel]) => {
            const active = tab === tabKey
            return (
            <button
            key={tabKey}
            type="button"
            onClick={() => goTab(tabKey)}
            className={[
            "rounded-xl px-4 py-2 text-[11px] tracking-widest transition",
            active
            ? "border border-white/20 bg-white/10 text-white/90"
            : "border border-white/10 bg-black/40 text-white/60 hover:bg-white/5",
            ].join(" ")}
           >
           {tabLabel}
           </button>
        )
          })}
        </div>
      ) : null}

      {/* ================= DASHBOARD ================= */}
      {tab === "dashboard" ? (
        <section
          className={["rounded-[28px] border p-5 md:p-6 neon-card", theme.border].join(" ")}
          style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 70px ${theme.glow}` }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
            

  {/* LEFT */}
  <div className="md:col-span-8 space-y-4 md:space-y-6">
    
    {/* EQUITY */}

{isBullion && realBalanceUsd < MIN_BULLION_DEPOSIT ? (
  <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-[11px] text-white/75">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-full border border-purple-300/20 bg-purple-300/10 px-2 py-[2px] text-[10px] tracking-widest text-purple-100">
          ACCESS
        </span>
        <span className="text-white/85">
          Deposit <span className="text-white">{`$${MIN_BULLION_DEPOSIT}`}</span> to activate trading
        </span>
      </div>

      <span className="text-white/50">Phantom confirmation → credit</span>
    </div>
  </div>
) : null}


  <EquityCard
  equity={equityBuffer} // o equityDisplay si ese usas para chart
  initialBalance={baselineUsd ?? realBalanceUsd}
  border={theme.border}
  lineColor={theme.line} // si theme.line existe; si no, bórralo
  pnl={enginePnl}
  health={healthStatus}
  warningDD={planBTrigger + 2}
  criticalDD={planBTrigger}
  missionTargetUsd={(baselineUsd ?? realBalanceUsd) * 1.1} // meta 10% (cámbialo si quieres)
  showBalanceCore
  startupEnabled={!run.active}
  startupHint={run.active ? "RUNNING" : "Pick a preset"}
  balanceTone={balanceTone}
  balanceDeltaUsd={deltaFromBase}
  onStartupPreset={(id) => requestAllocation({ mode: "PRESET", presetId: id })}
  onRequestDisableProtections={() => setDisableRiskBrake(true)}
/>

<QuickCopyTopStrategies
  borderClass={theme.border}
  glow={theme.glow}
  enabled={!run.active}
  hint={run.active ? "RUNNING" : undefined}
  onPick={(id) => requestAllocation({ mode: "PRESET", presetId: id })}
  onSpecialCta={() => requestAllocation({ mode: "PRESET", presetId: "BALANCED_COPY" })}
  runActive={run.active}
  runPresetId={run.presetId}
  runRemainingSec={runRemainingSec}
  onStop={() => {
    // si ya tienes stopRun() úsalo aquí
    setRun(prev => ({ ...prev, active: false, presetId: null, durationSec: 0 }))
  }}
  starting={starting}
  specialHot={false} // ✅ por ahora (hasta que tengas lógica)
  signals={{ drawdownPct: engineDdPct, lossStreak, equityFlatMs: 0 }} // ✅ sin "signals" externo
/>


    {/* 6XS TERMINAL */}
    <SixXSTerminal
      items={sixxs}
      glow={theme.glow}
      wrapperClassName="rounded-[24px] border border-white/10 bg-black/45 p-4"
      runActive={run.active}
      nextDecisionIn={nextDecisionIn}
      stateLabel={sixxsState}
    />

    {/* LIVE TRADES */}
    <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-white/55">MT5 Stream</div>
        <div className="text-[10px] tracking-widest text-white/35">
          open {openTrades.length}
        </div>
      </div>

      <div className="mt-3">
        <LiveTradesMT5 trades={openTrades} market={market} />
      </div>
    </div>


    {/* EVENTS (mini feed) */}
    <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-white/55">LAST EVENTS</div>
        <div className="text-[10px] tracking-widest text-white/35">{strategyEvents.length}</div>
      </div>

      <div className="mt-3 space-y-2">
        {(strategyEvents.slice(0, 6) ?? []).map(e => (
          <div key={e.id} className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2">
            <div className="text-[11px] text-white/80">{e.label}</div>
            <div className="mt-1 text-[10px] text-white/35">
              {new Date(e.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {!strategyEvents.length ? (
          <div className="text-[11px] text-white/45">No events yet.</div>
        ) : null}
      </div>
    </div>
  </div>

  {/* RIGHT */}

  <div className="md:col-span-4 space-y-4 md:space-y-6">

{/* 🔥 LIVE ACTIVITY FEED */}

  <LiveActivityFeed />


    {/* PRO DROPS */}
    <ProStrategyFeed
      tier={walletAccount.tier}
      borderClass={theme.border}
      glow={theme.glow}
      onPickOffer={offer => requestAllocation({ mode: "PRESET", presetId: offer.preset })}
      onUpgrade={() => router.push(`/onboarding?target=pro`)}
    />

    {/* DEPOSIT */}
    <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
      <div className="text-[10px] tracking-widest text-white/55">DEPOSIT</div>
      <div className="mt-3">


{/* ================= PHANTOM DEPOSIT PANEL (WRAPPER UI) ================= */}
<div className="rounded-[28px] border border-white/10 bg-black/45 p-5 neon-card">
  {/* HEADER */}
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {/* icon */}
        <div className="flex items-center gap-2">
       
       <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-black/40">
  <img
    src="/phantom.svg"
    alt="Phantom"
    className="h-4 w-4 object-contain opacity-95"
    draggable={false}
  />
</div>

          <div className="text-[10px] tracking-widest text-white/60">PHANTOM DEPOSIT</div>
        </div>

        {/* chips */}
        <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] tracking-widest text-white/70">
          ONLY
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] tracking-widest text-emerald-100">
          SOLANA
        </span>
        <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] tracking-widest text-white/70">
          Mainnet
        </span>
      </div>

      <div className="mt-2 text-[18px] font-semibold text-white/90">
        Bullions balance: <span className="tabular-nums">{fmtUsd(bullionsBalanceUsd ?? 0)}</span>
      </div>

      <div className="mt-1 text-[12px] text-white/55">
        Only Phantom is supported. Connect Phantom to credit your internal balance.
      </div>
    </div>

    <div className="shrink-0 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[11px] tracking-widest text-white/70">
      phantom
    </div>
  </div>


{(bullionsBalanceUsd ?? 0) < 50 ? (
  <div className="mt-3 rounded-2xl border border-violet-300/25 bg-black/30 px-4 py-3">
    <div className="text-[12px] text-white/80">
      <span className="text-violet-200 font-semibold">USE PHANTOM WALLET</span>{" "}
      <a
        href="https://phantom.com"
        target="_blank"
        rel="noreferrer"
        className="text-violet-200 underline underline-offset-4 hover:text-violet-100"
      >
        to add your first deposit!
      </a>
    </div>
  </div>
) : null}


  {/* BODY (TU COMPONENTE REAL) */}
<div className="mt-3">
  <PhantomDeposit
    network="mainnet-beta"
    minUsd={50}
    onBalanceCredit={(usdAmount) => {
      const credit = Math.max(0, Number(usdAmount) || 0)
      if (!credit) return

      // 1) balance interno
      setWalletBalanceUsd(v => v + credit)

      // 2) tx funcional (tu estructura real)
      pushWalletTx({
        kind: "DEPOSIT",
        amountUsd: credit,
        token: "SOL",
        status: "CONFIRMED",
        note: "Deposit credited · Phantom · Solana mainnet",
      })

      x9(`Deposit credited → +${fmtUsd(credit)}`, 1)
    }}
  />
</div>


  {/* FOOTER LINE */}
  <div className="mt-3 text-[10px] text-white/40">
    Credits are internal (casino-style). Confirmed tx → updates dashboard balance.
  </div>
</div>


      </div>
    </div>
  </div>
</div>
        </section>
      ) : null}

      {/* ================= ADVANCED ================= */}
      {tab === "advanced" ? (
        <div className="space-y-10 panel-pop">
          <section className="rounded-[28px] border border-white/10 bg-black/55 p-5 neon-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest text-white/45">ADVANCED MODE</div>
                <div className="mt-1 text-[13px] text-white/85 font-semibold">
                  Manual strategy configuration
                </div>
                <div className="mt-1 text-[12px] text-white/55">
                  Assign roles, configure risk, enable Plan B and inspect logs.
                </div>
              </div>

              <button
                onClick={() => router.push(`/onboarding?target=`)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] tracking-widest text-white/70 hover:bg-white/5"
              >
                UPGRADE
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <MiniStat label="assigned roles" value={String(assignedCount)} />
              <MiniStat label="pending changes" value={hasPendingChanges ? "yes" : "no"} />
              <MiniStat label="apply" value={canApply ? "ready" : "locked"} />
            </div>
          </section>

          <section className="space-y-4">
            <StrategySlots
              traders={traders}
              assignedRoles={assignedRoles}
              activeRole={activeRole}
              onSelectRole={(role: Role) => {
                setActiveRole(role)
                pushEvent({ type: "SYSTEM", label: `Role selected → ${String(role)}`, impact: 0 })
                showToast("Role selected", String(role))
                x9(`Role selected → ${String(role)}`, 0)
              }}
              onClearRole={(r: Role) => {
                clearRole(r)
                pushEvent({ type: "SYSTEM", label: `Role cleared → ${String(r)}`, impact: 0 })
                showToast("Cleared role", String(r))
                x9(`Role cleared → ${String(r)}`, 0)
              }}
              getRiskProfile={getRiskProfile}
              signals={{
                drawdownPct: engine.metrics.drawdownPct,
                lossStreak: engine.metrics.lossStreak,
                equityFlatMs: engine.metrics.equityFlatMs,
              }}
            />

            <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-[10px] text-white/70">
              <div className="tracking-widest text-white/45">QUICK ANALYTICS (last 6)</div>
              <div className="mt-2 space-y-1">
                {quickEvents.slice(-6).map((e, i) => (
                  <div key={i} className="tabular-nums">
                    • {e.type}
                    {"presetId" in e ? ` · ${String((e as any).presetId)}` : ""}
                    {"ttsMs" in e && (e as any).ttsMs != null
                      ? ` · tts ${(Number((e as any).ttsMs) / 1000).toFixed(1)}s`
                      : ""}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] tracking-widest uppercase opacity-60">
              dd {engine.metrics.drawdownPct}% · streak {engine.metrics.lossStreak} · flat{" "}
              {(engine.metrics.equityFlatMs / 1000).toFixed(0)}s
            </div>

            <TraderTree
              tier={walletAccount.tier}
              traders={traders}
              assignedRoles={assignedRoles}
              activeRole={null}
              onAssignRole={(role: Role, traderId: number) => {
                assignRole(role, traderId)
                const t = traders.find(x => x.id === traderId)
                pushEvent({
                  type: "DECISION",
                  label: `${String(role)} assigned → ${t?.name ?? `#${traderId}`}`,
                  impact: 1,
                })
                showToast("Assigned", `${String(role)} → ${t?.name ?? `#${traderId}`}`)
                x9(`Assigned ${String(role)} → ${t?.name ?? `#${traderId}`}`, 1)
              }}
              onUpgrade={(target?: any) => router.push(`/onboarding?target=${target ?? ""}`)}
            />
          </section>

          <section className="space-y-4">
            <StrategyAssignmentPanel
              traders={traders}
              assignedRoles={assignedRoles}
              activeRole={null}
              borderClass={theme.border}
              onSelectRole={() => {}}
              onClearRole={(r: Role) => {
                clearRole(r)
                pushEvent({ type: "SYSTEM", label: `Role cleared → ${String(r)}`, impact: 0 })
                showToast("Cleared role", String(r))
                x9(`Role cleared → ${String(r)}`, 0)
              }}
              onAssignRole={(role: Role, traderId: number) => {
                assignRole(role, traderId)
                const t = traders.find(x => x.id === traderId)
                pushEvent({
                  type: "DECISION",
                  label: `${String(role)} assigned → ${t?.name ?? `#${traderId}`}`,
                  impact: 1,
                })
                showToast("Assigned", `${String(role)} → ${t?.name ?? `#${traderId}`}`)
                x9(`Assigned ${String(role)} → ${t?.name ?? `#${traderId}`}`, 1)
              }}
              planBTraderId={planBTraderId}
              onSetPlanBTrader={(id: number | null) => {
                setPlanBTraderId(id)
                const t = id ? traders.find(x => x.id === id) : null
                pushEvent({
                  type: "SYSTEM",
                  label: id ? `Plan B trader set → ${t?.name ?? `#${id}`}` : "Plan B trader cleared",
                  impact: 0,
                })
                showToast("Plan B updated", id ? `${t?.name ?? `#${id}`}` : "cleared")
                x9(id ? `Plan B set → ${t?.name ?? `#${id}`}` : "Plan B cleared", 0)
              }}
            />

<PlanBConfigPanel
  enabled={hasAtLeastOneRole}
  health={healthStatus}
  trigger={planBTrigger}
  onChangeTrigger={(v: TriggerOption) => {
    setPlanBTrigger(v)
    x9(`Plan B trigger set → ${v}%`, 0)
  }}
  backupCount={planBTraderId ? 1 : 0}
  onEnterAssignMode={() => showToast("Plan B mode", "Pick a trader in PLAN B slot")}
/>


            <StrategyMessages
              selectedTraders={[]}
              connectedTraders={connectedTraders}
              isHighRisk={isHighRisk}
              isBlocked={isBlocked}
              aggressiveCount={aggressiveCount}
            />

            <StrategyTransitionPreview
              health={healthStatus}
              currentDrawdown={drawdown}
              triggerThreshold={planBTrigger}
              planBTraders={[
                { id: 301, name: "Atlas", role: "Execution Backup" },
                { id: 302, name: "Nyx", role: "Risk Support" },
              ]}
            />
          </section>

          <section>
            <TraderGrid
              tier={walletAccount.tier}
              traders={traders}
              assignedRoles={assignedRoles}
              activeRole={null}
              onAssignRole={(role: Role, traderId: number) => {
                assignRole(role, traderId)
                const t = traders.find(x => x.id === traderId)
                pushEvent({
                  type: "DECISION",
                  label: `${String(role)} assigned → ${t?.name ?? `#${traderId}`}`,
                  impact: 1,
                })
                showToast("Assigned", `${String(role)} → ${t?.name ?? `#${traderId}`}`)
                x9(`Assigned ${String(role)} → ${t?.name ?? `#${traderId}`}`, 1)
              }}
              getRiskProfile={getRiskProfile}
            />
          </section>

          <div className="flex items-center justify-end">
            {hasPendingChanges ? (
              <button
                onClick={() => requestAllocation({ mode: "ADVANCED_APPLY" })}
                disabled={!canApply}
                className={[
                  "px-4 py-2 border rounded-xl hover:bg-white/5 disabled:opacity-40 btn-neon",
                  "border-white/10",
                  fx === "APPLY" ? "burst-apply" : "",
                ].join(" ")}
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 28px ${theme.glow}` }}
              >
                Apply strategy
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* WALLET / SUPPORT aquí si los tienes */}
    </div>

    <AllocateCapitalModal
      open={allocOpen}
      maxUsd={availableUsd}
      onClose={() => {
        setAllocOpen(false)
        setAllocContext(null)
      }}
      onConfirm={confirmAllocation}
    />

    {diplomaOpen && diploma ? (
      <DiplomaModal
        theme={theme}
        data={diploma}
        onClose={() => setDiplomaOpen(false)}
        onStop={() => setDiplomaOpen(false)}
      />
    ) : null}

    {/* BOTTOM MENU (mobile) */}
{isMobile ? <MobileTabBar tab={tab} onTab={goTab} /> : null}


{/* ================= WALLET ================= */}
{tab === "wallet" ? (
  <section
    className="rounded-[28px] border border-white/10 bg-black/55 p-5 neon-card"
    style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 70px ${theme.glow}` }}
  >
    {/* HEADER */}
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[10px] tracking-widest text-white/45">WALLET</div>
        <div className="mt-1 text-[13px] text-white/90 font-semibold">Phantom-style dashboard</div>
        <div className="mt-1 text-[12px] text-white/55">
          Visual only (for now). Deposit works via Phantom panel.
        </div>
      </div>

      <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
        <div className="text-[10px] tracking-widest text-white/45">ACCOUNT</div>
        <div className="mt-1 text-[11px] text-white/90 font-semibold tabular-nums">
  {fmtUsd(realBalanceUsd)}
        </div>
      </div>
    </div>

    {/* ===== ROW: LEFT + RIGHT ===== */}
    <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* LEFT */}
      <div className="w-full lg:w-[420px] shrink-0">
        <div
          className="relative overflow-hidden rounded-[28px] p-6"
          onMouseEnter={() => setHoverCard(true)}
          onMouseLeave={() => setHoverCard(false)}
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05), 0 0 44px rgba(124,58,237,0.14), 0 0 52px rgba(34,197,94,0.10)",
            background:
              "radial-gradient(900px 420px at 18% 0%, rgba(34,197,94,0.16), transparent 55%), radial-gradient(760px 360px at 90% 18%, rgba(124,58,237,0.18), transparent 55%), rgba(0,0,0,0.46)",
          }}
        >
          {/* subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          {/* top glow line */}
          <div
            className="pointer-events-none absolute -top-10 left-0 right-0 h-24 opacity-80"
            style={{
              background:
                "radial-gradient(420px 90px at 25% 60%, rgba(34,197,94,0.28), transparent 60%), radial-gradient(420px 90px at 75% 60%, rgba(124,58,237,0.22), transparent 60%)",
            }}
          />

          {/* CARD HEADER */}
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300/85" />
                <div className="text-[10px] tracking-widest text-white/65">BULLIONS CARD WALLET</div>
                <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] tracking-widest text-white/70">
                  SOLANA
                </span>
              </div>

              <div className="mt-3 text-[30px] font-semibold tracking-tight text-white/95 tabular-nums">
                {fmtUsd(cardShownUsd, { decimals: 2 })}
              </div>

              <div className="mt-1 text-[12px] text-white/60">
                {hoverCard
                  ? "Right now: $0 — obtain your card to unlock deposits."
                  : "Demo balance (visual) — Phantom inspired"}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-[12px] font-semibold tracking-widest text-white/85">MASTERCARD</div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2">
                <div
                  className="h-4 w-6 rounded-md border border-white/10"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                  }}
                />
                <div className="text-[10px] tracking-widest text-white/55">NFC</div>
              </div>
            </div>
          </div>

          {/* NUMBER ROW */}
          <div className="relative mt-6 flex items-center justify-between gap-3">
            <div className="text-[12px] text-white/70 tracking-[0.22em] tabular-nums">•••• •••• •••• 4821</div>
            <div className="text-[12px] text-white/55">01/27</div>
          </div>

          {/* CTA overlay on hover */}
          {hoverCard ? (
            <div className="relative mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
              <div className="text-[10px] tracking-widest text-emerald-100/80">OBTAIN YOUR CARD</div>
              <div className="mt-1 text-[12px] text-white/90 font-semibold">
                Connect Phantom → deposit → unlock card balance
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[11px] tracking-widest text-white/85 transition hover:bg-white/5"
                >
                  GET CARD →
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[11px] tracking-widest text-white/70 transition hover:bg-white/5"
                >
                  LEARN
                </button>
              </div>
            </div>
          ) : null}

          {/* ACTIONS */}
          <div className="relative mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-left transition hover:bg-white/6"
              onClick={() => {
                const el = document.getElementById("wallet-deposit")
                el?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              <div className="text-[10px] tracking-widest text-white/45">RECEIVE</div>
              <div className="mt-1 text-[12px] font-semibold text-white/90">Deposit</div>
              <div className="mt-1 text-[10px] text-white/45">Phantom</div>
            </button>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-left transition hover:bg-white/6"
              onClick={() => {
                const el = document.getElementById("wallet-withdraw")
                el?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              <div className="text-[10px] tracking-widest text-white/45">SEND</div>
              <div className="mt-1 text-[12px] font-semibold text-white/90">Withdraw</div>
              <div className="mt-1 text-[10px] text-white/45">request</div>
            </button>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-left transition hover:bg-white/6"
            >
              <div className="text-[10px] tracking-widest text-white/45">CARD</div>
              <div className="mt-1 text-[12px] font-semibold text-white/90">Get card</div>
              <div className="mt-1 text-[10px] text-white/45">mint</div>
            </button>
          </div>

{/* ✅ TRANSACTIONS (FUNCIONAL) */}
<div className="relative mt-4 rounded-[22px] border border-white/10 bg-black/35 p-4">
  <div className="flex items-center justify-between">
    <div className="text-[10px] tracking-widest text-white/55">TRANSACTIONS</div>
    <div className="text-[10px] tracking-widest text-white/35">{walletTxsSorted.length}</div>
  </div>

  <div className="mt-3 space-y-2">
    {walletTxsSorted.slice(0, 6).map(tx => (
      <div key={tx.id} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center text-white/80">
                {tx.kind === "DEPOSIT" ? "↓" : "↑"}
              </div>

              <div className="min-w-0">
                <div className="text-[11px] text-white/85 font-semibold truncate">
                  {kindLabel(tx.kind)}
                </div>
                <div className="text-[10px] text-white/45 truncate">
                  {tx.note ?? tx.token}
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-white/35">
              {fmtShortTime(tx.ts)}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div
              className={[
                "inline-flex rounded-xl border px-2.5 py-1 text-[10px] tracking-widest",
                kindTone(tx.kind),
              ].join(" ")}
            >
              {tx.status ?? "CONFIRMED"}
            </div>

            <div className="mt-2 text-[12px] font-semibold text-white/90 tabular-nums">
              {tx.kind === "WITHDRAW" ? "-" : "+"}{fmtUsd(tx.amountUsd)}
            </div>
          </div>
        </div>
      </div>
    ))}

    {!walletTxsSorted.length ? (
      <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-[11px] text-white/55">
        No transactions yet.
      </div>
    ) : null}
  </div>
</div>

        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:flex-1 min-w-0 space-y-4">
        {/* DEPOSIT (real) */}
        <div id="wallet-deposit" className="rounded-[24px] border border-white/10 bg-black/45 p-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-white/55">DEPOSIT</div>
            <div className="text-[10px] tracking-widest text-white/35">Phantom</div>
          </div>

          <div className="mt-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                  <img src="/phantom.svg" alt="Phantom" className="h-4 w-4 object-contain opacity-95" draggable={false} />
                </div>
                <div className="text-[10px] tracking-widest text-white/60">PHANTOM DEPOSIT</div>
              </div>

              <div className="mt-3">
                <PhantomDeposit
                  network="mainnet-beta"
                  minUsd={depositMinUsd}
                  onBalanceCredit={(usdAmount) => {
                    const credit = Math.max(0, Number(usdAmount) || 0)
                    setWalletBalanceUsd(v => v + credit)
                    x9(`Deposit credited → +${fmtUsd(credit)}`, 1)

                    // ✅ tx funcional
                    pushWalletTx({
  kind: "DEPOSIT",
  amountUsd: credit,
  token: "SOL",
  status: "CONFIRMED",
  note: "Deposit credited · Phantom · Solana mainnet",
})

                  }}

                />
              </div>

              <div className="mt-2 text-[10px] text-white/40">
                Confirmed tx → credits internal balance.
              </div>
            </div>
          </div>
        </div>

        {/* WITHDRAW (visual, tx funcional PENDING) */}
        <div id="wallet-withdraw" className="rounded-[24px] border border-white/10 bg-black/45 p-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-white/55">WITHDRAW</div>
            <div className="text-[10px] tracking-widest text-white/35">Visual</div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                <span className="text-[12px] text-white/80">↑</span>
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-white/60">WITHDRAW REQUEST</div>
                <div className="text-[11px] text-white/45">Send USD credit to your wallet (soon)</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <div className="text-[10px] tracking-widest text-white/45">AMOUNT (USD)</div>
                <div className="mt-1 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white/70 tabular-nums">
                  $50.00
                </div>
              </div>

              <div className="col-span-5">
                <div className="text-[10px] tracking-widest text-white/45">STATUS</div>
                <div className="mt-1 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[11px] tracking-widest text-amber-100">
                  PENDING
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold tracking-widest text-white/70 hover:bg-white/10"
              onClick={() => {
                const amt = 50
                x9(`Withdraw requested → -${fmtUsd(amt)}`, 1)
                pushWalletTx({
                  kind: "WITHDRAW",
                  amountUsd: amt,
                  token: "USDC",
                  status: "PENDING",
                  note: "Withdraw request · Processing (visual)",
                })
              }}
            >
              REQUEST WITHDRAW →
            </button>

            <div className="mt-2 text-[10px] text-white/40">
              Visual only — withdrawals will be enabled later.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
) : null}


  </main>
)

/* ================= TOAST ================= */

function Toast({ toast }: { toast: { title: string; sub?: string } | null }) {
  if (!toast) return null
  return (
    <div className="fixed z-[95] left-1/2 top-4 -translate-x-1/2">
      <div className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
        <div className="text-[12px] font-semibold text-white/90">{toast.title}</div>
        {toast.sub ? <div className="text-[11px] text-white/55">{toast.sub}</div> : null}
      </div>
    </div>
  )
}


/* ================= UI BLOCKS ================= */

function LogoPlate({ tier, version }: { tier: Tier; version: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/45 p-4 neon-card">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
          <img src="/bullion-logo.svg" alt="Bullions" className="h-9 w-9 object-contain opacity-95" draggable={false} />
        </div>

        <div className="min-w-0">
          <div className="text-[10px] tracking-widest text-white/40">OPERATOR</div>
          <div className="mt-1 text-[13px] text-white/85 font-semibold leading-tight truncate">{String(tier)}</div>
          <div className="mt-0.5 text-[11px] text-white/45">{version}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniChip label="integrity" value="ok" />
        <MiniChip label="latency" value="optimized" />
        <MiniChip label="routing" value="armed" />
      </div>
    </div>
  )
}

function MiniChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
      <div className="text-[10px] tracking-widest text-white/35">{label}</div>
      <div className="mt-1 text-[11px] text-white/75 font-semibold truncate">{value}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
      <div className="text-[10px] tracking-widest text-white/35">{label}</div>
      <div className="mt-1 text-[13px] text-white/85 font-semibold">{value}</div>
    </div>
  )
}

/* ================= LAST EVENTS ================= */

function LastEventsCard({ items }: { items: StrategyEvent[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/45 p-4 neon-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">Last events</div>
          <div className="mt-1 text-[12px] text-white/60">Ops log (recent)</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/70">live</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map(e => (
            <div key={e.id} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-white/75">
              ▸ {e.label}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-[11px] text-white/50">
            No events yet — press a Top Strategy to start.
          </div>
        )}
      </div>
    </section>
  )
}

/* ================= SOCIAL PULSE ================= */

function SocialPulseCard({ theme }: { theme: { border: string; glow: string } }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SOCIAL_FEED.length), 2200)
    return () => clearInterval(t)
  }, [])

  const rotated = useMemo(() => {
    const a = SOCIAL_FEED.slice(idx)
    const b = SOCIAL_FEED.slice(0, idx)
    return [...a, ...b].slice(0, 4)
  }, [idx])

  return (
    <section
      className={`rounded-[28px] border ${theme.border} bg-black/55 p-4 neon-card`}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 55px ${theme.glow}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/55">LIVE SOCIAL PULSE</div>
          <div className="mt-1 text-[12px] text-white/70">Real-time activity across operators</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
          <div className="text-[10px] tracking-widest text-white/45">FEED</div>
          <div className="mt-1 text-[12px] text-white/80 font-semibold">LIVE</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rotated.map((it, i) => (
          <SocialRow key={`${it.user}-${i}`} item={it} />
        ))}
      </div>

      <div className="mt-3 text-[10px] text-white/35">Tip: social proof + ops vibe. No controls, solo confianza.</div>
    </section>
  )
}

function SocialRow({ item }: { item: (typeof SOCIAL_FEED)[number] }) {
  const badge =
    item.kind === "WITHDRAW"
      ? { text: "WITHDRAW", cls: "border-rose-300/25 bg-rose-300/10 text-rose-100" }
      : item.kind === "PAYOUT"
        ? { text: "PAYOUT", cls: "border-amber-300/25 bg-amber-300/10 text-amber-100" }
        : item.kind === "COPY"
          ? { text: "COPY", cls: "border-sky-300/25 bg-sky-300/10 text-sky-100" }
          : item.kind === "PROFIT"
            ? { text: "PROFIT", cls: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" }
            : { text: "ALERT", cls: "border-white/15 bg-white/5 text-white/70" }

  const initials = item.user.slice(0, 2).toUpperCase()
  const hue = (item.user.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 7) % 360
  const bg = `linear-gradient(180deg, hsla(${hue},70%,55%,0.35), hsla(${(hue + 40) % 360},70%,45%,0.20))`

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-12 w-12 rounded-2xl border border-white/10 flex items-center justify-center shrink-0"
            style={{ background: bg }}
          >
            <div className="text-[12px] font-semibold tracking-widest text-white/85">{initials}</div>
          </div>

          <div className="min-w-0">
            <div className="text-[13px] text-white/90 font-semibold truncate">
              <span className="text-white/70 font-medium">{item.user}</span>{" "}
              {item.kind === "WITHDRAW" || item.kind === "PAYOUT" || item.kind === "PROFIT"
                ? `${item.note} ${item.valueUsd != null ? fmtUsdInt(item.valueUsd) : ""}`.trim()
                : item.note}
            </div>
            <div className="mt-1 text-[12px] text-white/45">{fmtAgo(item.agoSec)}</div>
          </div>
        </div>

        <div className={`shrink-0 rounded-xl border px-3 py-1.5 ${badge.cls}`}>
          <div className="text-[10px] font-semibold tracking-widest">{badge.text}</div>
        </div>
      </div>
    </div>
  )
}

/* ================= DIPLOMA MODAL ================= */

function DiplomaModal({
  theme,
  data,
  onClose,
  onStop,
}: {
  theme: { text: string; border: string; line: string; glow: string }
  data: {
    presetId: "SAFE_COPY" | "BALANCED_COPY" | "AGGRO_COPY"
    endedBy: "AUTO" | "MANUAL"
    durationSec: number
    elapsedSec: number
    progressPct: number
    startBalance: number
    endBalance: number
    pnlDelta: number
    signature?: string
    background?: string
    issuedAt?: number
  }
  onClose: () => void
  onStop?: () => void
}) {
  const title =
    data.presetId === "SAFE_COPY"
      ? "SAFE COPY CERTIFICATE"
      : data.presetId === "BALANCED_COPY"
        ? "BALANCED RUN CERTIFICATE"
        : "AGGRO RUN CERTIFICATE"

  const statusLabel = data.endedBy === "AUTO" ? "WINDOW COMPLETE" : "STOPPED"
  const elapsed = fmtTime(data.elapsedSec)
  const dur = fmtTime(data.durationSec)

  const dateStr = new Date(data.issuedAt ?? Date.now()).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })

  const pnlGood = data.pnlDelta >= 0
  const sealText =
    data.presetId === "SAFE_COPY" ? "LOW RISK" : data.presetId === "BALANCED_COPY" ? "RECOMMENDED" : "HIGH VOL"

  const signatureShort = data.signature ? `${data.signature.slice(0, 6)}…${data.signature.slice(-6)}` : null
  const bg = data.background ?? "/diploma.png" // 👈 pon aquí tu imagen real si tienes otra
  const progress = Math.max(0, Math.min(100, Math.round(data.progressPct)))

  function downloadDiploma() {
    const a = document.createElement("a")
    a.href = bg
    a.download = `bullions-diploma-${String(data.presetId).toLowerCase()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function goCreateStrategy() {
    onClose()
    window.location.href = "/dashboard?advanced=1"
  }

return (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div
        className={`relative w-full max-w-[980px] overflow-hidden rounded-[24px] border ${theme.border}`}
        style={{
          boxShadow: `0 0 0 1px rgba(255,255,255,0.10), 0 0 90px ${theme.glow}`,
          maxHeight: "92vh",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "saturate(1.05) contrast(1.05)",
          }}
        />

        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 420px at 10% 0%, rgba(74,222,128,0.18), transparent 60%), radial-gradient(700px 360px at 85% 20%, rgba(168,85,247,0.16), transparent 55%)",
          }}
        />

        <div className="relative p-4 md:p-6 overflow-auto" style={{ maxHeight: "92vh" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 md:h-14 md:w-14 rounded-2xl border border-white/15 bg-black/35 flex items-center justify-center shrink-0"
                  style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 26px ${theme.glow}` }}
                >
                  <img
                    src="/bullion-logo.svg"
                    alt="Bullions"
                    className="h-9 w-9 md:h-10 md:w-10 object-contain opacity-95"
                    draggable={false}
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] tracking-[0.32em] text-white/60">BULLIONS · CERTIFICATE</div>
                  <div className="mt-1 text-[18px] md:text-[24px] font-semibold tracking-tight text-white/95 truncate">
                    {title}
                  </div>
                  <div className="mt-1 text-[12px] text-white/70">
                    Issued: <span className="text-white/90 font-semibold">{dateStr}</span> · Status:{" "}
                    <span className="text-white/90 font-semibold">{statusLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-[11px] tracking-widest text-white/75 hover:bg-white/5"
            >
              CLOSE ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="rounded-[22px] border border-white/12 bg-black/35 p-4 md:p-5">
                <div className="text-[12px] text-white/80 leading-relaxed">
                  This certifies that <span className="text-white font-semibold">YOU</span> executed a{" "}
                  <span className="text-white font-semibold">{String(data.presetId).replaceAll("_", " ")}</span> run
                  with window timing, role assignment, and drawdown monitoring.
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DiplomaStatPro label="WINDOW" value={`${elapsed} / ${dur}`} />
                  <DiplomaStatPro label="START" value={fmtUsd(data.startBalance)} />
                  <DiplomaStatPro label="END" value={fmtUsd(data.endBalance)} />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] tracking-[0.28em] text-white/55">PROGRESS</div>
                    <div className="text-[11px] text-white/75 font-semibold tabular-nums">{progress}%</div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/70"
                      style={{ width: `${progress}%`, boxShadow: `0 0 18px ${theme.glow}` }}
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-white/45">Next: build your own strategy with custom roles.</div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] tracking-[0.28em] text-white/55">PERFORMANCE</div>
                      <div className="mt-1 text-[13px] text-white/85">
                        PnL Delta:{" "}
                        <span className={`font-semibold ${pnlGood ? "text-emerald-200" : "text-rose-200"}`}>
                          {fmtUsd(data.pnlDelta)}
                        </span>
                      </div>
                      {signatureShort ? (
                        <div className="mt-1 text-[11px] text-white/55">
                          Proof: <span className="text-white/75 font-semibold">{signatureShort}</span>
                        </div>
                      ) : null}
                    </div>

                    <div
                      className="shrink-0 rounded-[18px] border border-white/15 bg-black/35 px-4 py-3"
                      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 40px ${theme.glow}` }}
                    >
                      <div className="text-[10px] tracking-[0.3em] text-white/60">SEAL</div>
                      <div className="mt-1 text-[12px] font-semibold text-white/90">{sealText}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <div className="text-[10px] tracking-[0.28em] text-white/55">OPERATOR SIGNATURE</div>
                    <div className="mt-1 text-[14px] text-white/90 font-semibold" style={{ letterSpacing: "0.08em" }}>
                      BULLIONS · ROUTING CORE
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadDiploma}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-[11px] tracking-widest text-white/90 hover:bg-white/15"
                      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 24px ${theme.glow}` }}
                    >
                      DOWNLOAD
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="rounded-2xl border border-white/15 bg-black/40 px-4 py-2 text-[11px] tracking-widest text-white/75 hover:bg-white/5"
                    >
                      PRINT
                    </button>

                    {onStop ? (
                      <button
                        onClick={onStop}
                        className="rounded-2xl border border-white/15 bg-black/40 px-4 py-2 text-[11px] tracking-widest text-white/75 hover:bg-white/5"
                      >
                        DONE
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 space-y-3">
              <div className="rounded-[22px] border border-white/12 bg-black/35 p-4">
                <div className="text-[10px] tracking-[0.28em] text-white/55">RUN SUMMARY</div>
                <div className="mt-3 space-y-2 text-[12px] text-white/75">
                  <RowK label="Preset" value={String(data.presetId).replaceAll("_", " ")} />
                  <RowK label="Ended by" value={data.endedBy} />
                  <RowK label="Window" value={`${dur}`} />
                  <RowK label="Elapsed" value={`${elapsed}`} />
                </div>
              </div>

              <div className="rounded-[22px] border border-white/12 bg-black/35 p-4">
                <div className="text-[10px] tracking-[0.28em] text-white/55">NEXT</div>

                <div className="mt-2 text-[12px] text-white/90 font-semibold">Create your own strategy</div>
                <div className="mt-2 text-[12px] text-white/65 leading-relaxed">
                  Pick traders, assign roles (ENTRY / RISK / EXIT), tune Plan B thresholds, and build your execution path.
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button
                    onClick={goCreateStrategy}
                    className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-[11px] tracking-widest text-white/85 hover:bg-white/15"
                    style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 24px ${theme.glow}` }}
                  >
                    CREATE MY STRATEGY
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-2 text-[11px] tracking-widest text-white/70 hover:bg-white/5"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>
    </div>
  )
}

function DiplomaStatPro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="text-[10px] tracking-[0.28em] text-white/55">{label}</div>
      <div className="mt-1 text-[13px] text-white/92 font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function RowK({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <div className="text-[10px] tracking-widest text-white/50">{label}</div>
      <div className="text-[12px] text-white/85 font-semibold">{value}</div>
    </div>
  )
}

function demoWithdraw() {
  // retiro visual, pero lo guardamos como "real event" dentro de tu app
  const amt = 50 // cámbialo o luego lo haces input

  setWalletTxs(prev => [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: "WITHDRAW",
      amountUsd: amt,
      token: "USDC",
      ts: Date.now(),
      status: "PENDING",
      note: "Withdraw request (visual)",
    },
    ...prev,
  ])

  x9(`Withdraw requested → -${fmtUsd(amt)}`, -1)
}


function AllocateCapitalModal({
  open,
  maxUsd,
  onClose,
  onConfirm,
}: {
  open: boolean
  maxUsd: number
  onClose: () => void
  onConfirm: (amount: number) => void
}) {
  const [raw, setRaw] = useState("")

  if (!open) return null

  const n = Number(raw)
  
  const MIN_DEPOSIT_USD = 50

const amount = Number.isFinite(n) ? Math.max(0, Math.min(maxUsd, n)) : 0
const belowMin = amount > 0 && amount < MIN_DEPOSIT_USD
const canConfirm = amount >= MIN_DEPOSIT_USD && amount <= maxUsd


  return (

    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full max-w-[520px] rounded-[22px] border border-white/10 bg-black/75 p-5 neon-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[14px] text-white/90 font-semibold">¿Cuánto de tu saldo quieres meter?</div>
            <div className="mt-1 text-[12px] text-white/60">
              Mínimo: <span className="text-white/85 font-semibold">$50.00</span> · Máximo disponible:{" "}
               <span className="text-white/85 font-semibold">{fmtUsd(maxUsd)}</span>
            </div>
          </div>

          <button
  disabled={!canConfirm}
  onClick={() => onConfirm(amount)}
  className="rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-4 py-2 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-300/20 disabled:opacity-40"
>
  Confirm
</button>

{belowMin ? (
  <div className="mt-2 text-[11px] text-rose-200/90">
    Minimum Deposit: $50.00
  </div>
) : null}

        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
          <div className="text-[10px] tracking-widest text-white/45">MONTO (USD)</div>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-[14px] text-white/90 outline-none focus:border-white/25"
            placeholder={`0 — ${fmtUsd(maxUsd)}`}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="decimal"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setRaw(String((maxUsd * 0.25).toFixed(2)))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 hover:bg-white/10"
            >
              25%
            </button>
            <button
              onClick={() => setRaw(String((maxUsd * 0.5).toFixed(2)))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 hover:bg-white/10"
            >
              50%
            </button>
            <button
              onClick={() => setRaw(String((maxUsd * 0.75).toFixed(2)))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 hover:bg-white/10"
            >
              75%
            </button>
            <button
              onClick={() => setRaw(String(maxUsd.toFixed(2)))}
              className="ml-auto rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-white/85 hover:bg-white/15"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[11px] text-white/70 hover:bg-white/5"
          >
            Cancelar
          </button>

          <button
            disabled={amount <= 0}
            onClick={() => onConfirm(amount)}
            className="rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-4 py-2 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-300/20 disabled:opacity-40"
          >
            Confirmar
          </button>
          
        </div>
      </div>
    </div>
  )
}
}