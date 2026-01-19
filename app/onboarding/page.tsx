"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardDial } from "@/app/components/OnboardDial"

/* ================= TYPES ================= */

type Profile = "BULLION" | "HELLION" | "TORION"

/* ================= SOCIAL PROOF (PER TIER) ================= */

const SOCIAL_EVENTS_BY_TIER: Record<Profile, string[]> = {
  BULLION: [
    "BULLION STRATEGY DEPLOYED USING 2 TRADERS",
    "RISK LIMITS LOCKED — SAFE EXECUTION PATH",
    "ENTRY LAYER READY — WAITING FOR ASSIGNMENT",
    "$300 DEPOSIT VERIFIED — LAB ACCESS GRANTED",
    "LATENCY ROUTING READY — LOW SLIPPAGE PATH",
  ],
  HELLION: [
    "HELLION DECK UPDATED — VOLATILITY MODE ACTIVE",
    "MULTI-TRADER ROUTING ENABLED (3–5)",
    "SPREAD FILTER ARMED — FAST EXECUTION",
    "$1,500 ROUTED THROUGH MULTI-TRADER EXECUTION",
    "RISK PROFILE RECALCULATED AFTER TRADER SWAP",
  ],
  TORION: [
    "TORION ACCOUNT ENTERED FUNDED EXECUTION PHASE",
    "INSTITUTIONAL ORCHESTRATION LAYER READY",
    "ROUTE DIVERSIFICATION COMPLETE — LOW SLIPPAGE",
    "$50,000 FUNDED PATH — ELIGIBILITY CHECK READY",
    "EXECUTION LATENCY OPTIMIZED ACROSS ROUTES",
  ],
}

/* ================= CONFIG ================= */

const PROFILES: Record<
  Profile,
  {
    title: string
    priceUSD: number
    short: string
    description: string
    glow: string
    border: string
    text: string
    color: string
    grid: string
    logo: string
    accentGlow: string // rgba string for shadows
  }
> = {
  BULLION: {
    title: "BULLION",
    priceUSD: 300,
    short: "2 traders · strict risk",
    description: `BULLION — ENTRY STRATEGY LAYER
Minimum deposit: $300

• Access to basic strategy construction
• Select up to 2 live traders
• Controlled execution with strict risk limits`,
    glow: "drop-shadow-[0_0_24px_rgba(34,197,94,0.65)]",
    border: "border-green-400/60",
    text: "text-green-300",
    color: "#22c55e",
    grid: "bg-green-400/25",
    logo: "/bullion-logo.svg",
    accentGlow: "rgba(34,197,94,0.18)",
  },

  HELLION: {
    title: "HELLION",
    priceUSD: 1500,
    short: "3–5 traders · volatility",
    description: `HELLION — DYNAMIC STRATEGY ENGINE
Minimum deposit: $1,500

• Multi-trader strategies (3–5)
• Aggressive execution during volatility`,
    glow: "drop-shadow-[0_0_24px_rgba(239,68,68,0.65)]",
    border: "border-red-400/60",
    text: "text-red-300",
    color: "#ef4444",
    grid: "bg-red-400/25",
    logo: "/hellion.svg",
    accentGlow: "rgba(239,68,68,0.16)",
  },

  TORION: {
    title: "TORION",
    priceUSD: 3000,
    short: "funded path · orchestration",
    description: `TORION — INSTITUTIONAL STRATEGY ORCHESTRATION
Minimum deposit: $3,000
Unlocks $50,000 funded account

• Advanced multi-trader orchestration
• Institutional execution layer`,
    glow: "drop-shadow-[0_0_24px_rgba(168,85,247,0.65)]",
    border: "border-purple-400/60",
    text: "text-purple-300",
    color: "#a855f7",
    grid: "bg-purple-400/25",
    logo: "/torion.svg",
    accentGlow: "rgba(168,85,247,0.18)",
  },
}

/* ================= HELPERS ================= */

function getUTCTimestamp() {
  const d = new Date()
  return `[${d.toISOString().substring(11, 19)} UTC]`
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

/* ================= COMPONENT ================= */

export default function OnboardingPage() {
  const router = useRouter()

  const [selected, setSelected] = useState<Profile>("BULLION")
  const active = PROFILES[selected]

  // Stepper (simple)
  const [step, setStep] = useState<1 | 2>(1)

  // Background grid
  const [grid, setGrid] = useState<number[]>([])
  const [glowIndex, setGlowIndex] = useState<number | null>(null)

  // Social feed
  const [socialIndex, setSocialIndex] = useState(0)
  const [timestamp, setTimestamp] = useState("")

  // Tier change anim
  const [tierAnim, setTierAnim] = useState(false)

  // “Ops vibe” metrics
  const [uptimeSec, setUptimeSec] = useState(0)
  const [integrity, setIntegrity] = useState(88)
  const [stability, setStability] = useState(83)

  // Micro status like dash
  const [status, setStatus] = useState<"idle" | "arming" | "live">("idle")

  /* ===== GRID BACKGROUND ===== */
  useEffect(() => {
    const cols = 12
    const rows = 10
    const size = cols * rows
    setGrid(Array.from({ length: size }, () => Math.floor(Math.random() * 3)))

    const i = setInterval(() => {
      const idx = Math.floor(Math.random() * size)
      setGlowIndex(idx)
      setTimeout(() => setGlowIndex(null), 1150)
    }, 1800)

    return () => clearInterval(i)
  }, [])

  /* ===== SOCIAL FEED (PER TIER) ===== */
  useEffect(() => {
    setTimestamp(getUTCTimestamp())
    setSocialIndex(0)

    const i = setInterval(() => {
      setSocialIndex(s => (s + 1) % SOCIAL_EVENTS_BY_TIER[selected].length)
      setTimestamp(getUTCTimestamp())
    }, 3000)

    return () => clearInterval(i)
  }, [selected])

  /* ===== TIER SWITCH ANIM ===== */
  useEffect(() => {
    setTierAnim(true)
    const t = setTimeout(() => setTierAnim(false), 520)
    return () => clearTimeout(t)
  }, [selected])

  /* ===== STATUS CYCLE ===== */
  useEffect(() => {
    const t = setInterval(() => {
      setStatus(s => (s === "idle" ? "arming" : s === "arming" ? "live" : "arming"))
    }, 2600)
    return () => clearInterval(t)
  }, [])

  /* ===== OPS METRICS TICK (tu snippet) ===== */
  useEffect(() => {
    const t = setInterval(() => {
      setUptimeSec(s => s + 1)
      setIntegrity(v => clamp(v + 0.02, 70, 99))
      setStability(v => clamp(v + (status === "live" ? 0.06 : 0.02), 60, 98))
    }, 1000)
    return () => clearInterval(t)
  }, [status])

  const statusChip = useMemo(() => {
    const cls =
      status === "live"
        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
        : status === "arming"
          ? "border-sky-300/25 bg-sky-300/10 text-sky-100"
          : "border-white/15 bg-white/5 text-white/70"
    return { label: status.toUpperCase(), cls }
  }, [status])

  const headerGlow = useMemo(() => {
    return `radial-gradient(1100px 320px at 12% 0%, rgba(34,211,238,0.14), ${active.accentGlow}, rgba(0,0,0,0.55))`
  }, [active.accentGlow])

  const goDashboard = () => router.push(`/dashboard?mode=${selected.toLowerCase()}`)

  return (
    <main
      className="relative min-h-screen bg-black text-white overflow-hidden"
      style={{
        background:
          "radial-gradient(900px 380px at 12% 0%, rgba(34,211,238,0.10), rgba(168,85,247,0.10), rgba(0,0,0,0.82)), #000",
      }}
    >
      {/* GRID */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 grid grid-cols-12 gap-px opacity-35">
          {grid.map((c, i) => (
            <div
              key={i}
              className={[
                "w-full aspect-square transition-all duration-[1200ms]",
                c === 0 && PROFILES.BULLION.grid,
                c === 1 && PROFILES.HELLION.grid,
                c === 2 && PROFILES.TORION.grid,
                glowIndex === i ? "bg-white shadow-[0_0_26px_rgba(255,255,255,0.65)]" : "",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* GLOBAL VIGNETTE */}
      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/55 via-black/25 to-black/80" />

      {/* HEADER */}
      <header
        className="fixed top-0 inset-x-0 z-30 h-14 px-6 flex items-center justify-between backdrop-blur border-b border-white/10"
        style={{ background: headerGlow }}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.svg" alt="Centorion logo" className="h-7 w-auto object-contain" />
          <div className="min-w-0">
            <div className={`tracking-[0.18em] text-xs font-semibold ${active.text} truncate`}>PROJECT</div>
            <div className="text-[10px] tracking-widest text-white/45 truncate">
              STRATEGY LAB ACCESS · {selected}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <div className={`rounded-full border px-3 py-1 text-[10px] tracking-widest ${statusChip.cls}`}>
            {statusChip.label}
          </div>

          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded-md border border-white/15
                       text-xs tracking-widest text-white/80
                       hover:border-white/30 hover:text-white/90
                       transition-all bg-black/35"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SOLANA
          </button>
        </div>
      </header>

      {/* CONTENT (pb-28 para que el footer fixed no tape) */}
      <section className="relative z-20 pt-28 px-6 flex justify-center pb-[220px] md:pb-[280px]">
        <div className="w-full max-w-4xl">
          {/* TIER LOGO PLATE */}
          <div className="flex justify-center mb-8">
            <div
              className="rounded-3xl border border-white/10 bg-black/45 px-6 py-5"
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 60px ${active.accentGlow}` }}
            >
              <div className="flex items-center gap-5">
                <img
                  src={active.logo}
                  alt={`${selected} logo`}
                  className={[
                    "w-20 h-20 object-contain transition-all duration-500",
                    active.glow,
                    tierAnim ? "scale-110 opacity-100" : "scale-100 opacity-95",
                  ].join(" ")}
                />

                <div className="min-w-0">
                  <div className="text-[10px] tracking-widest text-white/45">OPERATOR DECK</div>
                  <div className={`mt-1 text-[16px] font-semibold tracking-widest ${active.text}`}>{active.title}</div>
                  <div className="mt-1 text-[11px] text-white/55">Minimum deposit · ${active.priceUSD}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-white/55">
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                      uptime <span className="text-white/85 font-semibold">{fmtTime(uptimeSec)}</span>
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                      integrity <span className="text-white/85 font-semibold">{fmtPct(integrity)}</span>
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                      stability <span className="text-white/85 font-semibold">{fmtPct(stability)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">STRATEGY DECK</h1>
            <p className="mt-3 text-sm tracking-widest uppercase text-white/50">Live execution environment</p>
          </div>

          {/* SOCIAL */}
          <div
            className="mb-8 border border-white/10 rounded-2xl px-4 py-3 bg-black/55"
            style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 34px ${active.accentGlow}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest text-white/35 mb-1">LIVE SYSTEM ACTIVITY</div>
                <div className="font-mono text-sm text-emerald-300">
                  {timestamp} ▸ {SOCIAL_EVENTS_BY_TIER[selected][socialIndex]}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/45 px-3 py-2">
                <div className="text-[10px] tracking-widest text-white/45">MODE</div>
                <div className="mt-1 text-[11px] text-white/80 font-semibold">ONBOARD</div>
              </div>
            </div>
          </div>

          {/* MAIN PANEL */}
          <div
            className="border border-white/10 rounded-[22px] p-6 md:p-8 bg-black/60 backdrop-blur-sm"
            style={{
              boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 70px ${active.accentGlow}`,
              background:
                "radial-gradient(900px 280px at 14% 0%, rgba(34,211,238,0.10), rgba(168,85,247,0.10), rgba(0,0,0,0.55))",
            }}
          >
            {/* Stepper */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="text-[10px] tracking-widest text-white/45">ONBOARDING · STEP {step}/2</div>

              <div className="flex items-center gap-2 text-[10px] text-white/45">
                <span className={step >= 1 ? "text-white/85" : ""}>TIER</span>
                <span className="text-white/25">—</span>
                <span className={step >= 2 ? "text-white/85" : ""}>CONFIRM</span>
              </div>
            </div>

            <div className="text-[11px] tracking-widest text-white/45 mb-4">STRATEGY ACCESS LEVELS</div>

            {/* TIER CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(PROFILES) as Profile[]).map(p => {
                const cfg = PROFILES[p]
                const activeTier = selected === p

                return (
                  <button
                    key={p}
                    onClick={() => {
                      setSelected(p)
                      setStep(2)
                    }}
                    className={[
                      "relative p-5 text-left border rounded-2xl transition-all",
                      "bg-black/35 hover:bg-white/[0.04]",
                      "hover:border-white/25",
                      activeTier ? `${cfg.border} ${cfg.glow} scale-[1.02]` : "border-white/10 opacity-85",
                    ].join(" ")}
                    style={{
                      boxShadow: activeTier
                        ? `0 0 0 1px rgba(255,255,255,0.06), 0 0 42px ${cfg.accentGlow}`
                        : "0 0 0 1px rgba(255,255,255,0.03)",
                    }}
                  >
                    {activeTier && (
                      <div className="absolute top-3 right-3 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[9px] tracking-widest text-white/80">
                        SELECTED
                      </div>
                    )}

                    <div className={`text-lg font-semibold tracking-widest ${cfg.text}`}>{cfg.title}</div>
                    <div className="mt-1 text-[11px] text-white/45">${cfg.priceUSD} access</div>

                    <div className="mt-3 text-[10px] text-white/55 tracking-widest">{cfg.short}</div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-[10px] text-white/40">tap to load</div>
                      <div className="text-[10px] text-white/60">SELECT ▸</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* DESCRIPTION */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] tracking-widest text-white/45">DECK SUMMARY</div>
                <div className={`rounded-full border px-3 py-1 text-[10px] tracking-widest ${statusChip.cls}`}>
                  {statusChip.label}
                </div>
              </div>

              <pre className="mt-3 font-mono text-[13px] text-white/75 whitespace-pre-wrap">{active.description}</pre>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-white/55">
                <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1">auto-routing ready</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1">risk guard enabled</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1">you can change tier later</span>
              </div>
            </div>

            {/* PRIMARY BUTTON (panel) */}
            <button
              onClick={() => {
                if (step === 1) setStep(2)
                else goDashboard()
              }}
              className={[
                "mt-6 w-full rounded-2xl border px-4 py-3 text-sm font-semibold tracking-widest transition-all",
                active.border,
                "relative overflow-hidden bg-black/35 text-white",
                "hover:border-white/30 hover:bg-white/[0.06]",
              ].join(" ")}
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 60px ${active.accentGlow}` }}
            >
              <span
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(34,211,238,0.10), rgba(168,85,247,0.12), rgba(34,197,94,0.10))",
                }}
              />
              <span className="relative z-10">{step === 1 ? "CONTINUE ▸" : "ENTER STRATEGY LAB"}</span>

              <div className="relative z-10 mt-1 text-[10px] tracking-widest text-white/55 font-normal">
                {step === 1 ? "Pick a tier to continue" : "Fast start available inside dashboard"}
              </div>
            </button>

            {/* MICRO FOOT NOTE */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelected("BULLION")
                  setStep(2)
                }}
                className="text-[10px] tracking-widest text-white/45 hover:text-white/70 transition"
              >
                RESET ▸ DEFAULT
              </button>

              <div className="text-[10px] tracking-widest text-white/35">
                Tip: in dashboard you’ll see <span className="text-white/70">TOP STRATEGIES WORKING</span> for 2-second start.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIXED FOOTER (dash-style) */}
      <OnboardingFooter
        tier={{ title: active.title, border: active.border, text: active.text, accentGlow: active.accentGlow }}
        status={status}
        integrity={integrity}
        stability={stability}
        uptimeSec={uptimeSec}
        step={step}
        onPrimary={() => {
          if (step === 1) setStep(2)
          else goDashboard()
        }}
        onSecondary={
          step === 2
            ? () => {
                setStep(1)
              }
            : undefined
        }
      />
    </main>
  )
}

/* ================= FOOTER (NEW) ================= */

function OnboardingFooter({
  tier,
  status,
  integrity,
  stability,
  uptimeSec,
  step,
  onPrimary,
  onSecondary,
}: {
  tier: {
    title: string
    border: string
    text: string
    accentGlow: string
  }
  status: "idle" | "arming" | "live"
  integrity: number
  stability: number
  uptimeSec: number
  step: 1 | 2
  onPrimary: () => void
  onSecondary?: () => void
}) {
  const chip =
    status === "live"
      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
      : status === "arming"
        ? "border-sky-300/25 bg-sky-300/10 text-sky-100"
        : "border-white/15 bg-white/5 text-white/70"

  // Mobile: colapsado por default (desktop: abierto)
  const [legalOpen, setLegalOpen] = useState(false)

  return (
    <footer className="fixed z-[90] bottom-4 left-1/2 -translate-x-1/2 w-[min(980px,92vw)]">
      <div
        className={`rounded-3xl border ${tier.border} bg-black/75 backdrop-blur-[2px]`}
        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 70px ${tier.accentGlow}` }}
      >
        {/* ===== TOP BAR (siempre visible) ===== */}
        <div className="p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            {/* LEFT */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1">
                Tier: <span className={`font-semibold ${tier.text}`}>{tier.title}</span>
              </span>

              <span className={`rounded-full border px-3 py-1 text-[10px] tracking-widest ${chip}`}>
                {status.toUpperCase()}
              </span>

              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1">
                step: <span className="text-white/90 font-semibold">{step}/2</span>
              </span>

              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1">
                uptime: <span className="text-white/90 font-semibold">{fmtTime(uptimeSec)}</span>
              </span>
              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1">
                integrity: <span className="text-white/90 font-semibold">{fmtPct(integrity)}</span>
              </span>
              <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1">
                stability: <span className="text-white/90 font-semibold">{fmtPct(stability)}</span>
              </span>

              {/* Toggle legal (solo mobile) */}
              <button
                type="button"
                onClick={() => setLegalOpen(v => !v)}
                className="md:hidden rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/65 hover:bg-white/5"
              >
                LEGAL {legalOpen ? "▴" : "▾"}
              </button>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              {onSecondary ? (
                <button
                  type="button"
                  onClick={onSecondary}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] tracking-widest text-white/70 hover:bg-white/5"
                >
                  ◂ BACK
                </button>
              ) : null}

              <button
                type="button"
                onClick={onPrimary}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold tracking-widest text-white/90 hover:bg-white/10"
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 40px ${tier.accentGlow}` }}
              >
                {step === 1 ? "CONTINUE ▸" : "ENTER ▸"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== LEGAL DRAWER (colapsable en mobile, siempre visible en md+) ===== */}
        <div className={["border-t border-white/10", "md:block", legalOpen ? "block" : "hidden"].join(" ")}>
          <div className="p-3">
            <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                {/* BRAND */}
                <div className="flex items-start gap-3">
                  <img
                    src="/bullion-logo.svg"
                    alt="Brand logo"
                    className="h-7 w-7 rounded-lg border border-white/10 bg-black/40 p-1"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] tracking-widest text-white/80 font-semibold">BULLION LABS</div>
                    <div className="text-[10px] tracking-widest text-white/45">
                      Strategy access · <span className={`${tier.text} font-semibold`}>{tier.title}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tracking-widest">
                      <a href="/terms" className="text-white/55 hover:text-white/80 underline underline-offset-4">
                        TERMS
                      </a>
                      <a href="/privacy" className="text-white/55 hover:text-white/80 underline underline-offset-4">
                        PRIVACY
                      </a>
                      <a href="/legal" className="text-white/55 hover:text-white/80 underline underline-offset-4">
                        LEGAL
                      </a>
                      <span className="text-white/30">·</span>
                      <span className="text-white/45">Execution environment only</span>
                    </div>
                  </div>
                </div>

                {/* RISK WARNING */}
                <div className="md:max-w-[430px]">
                  <div className="text-[10px] tracking-widest text-white/45">RISK WARNING</div>
                  <p className="mt-1 text-[10px] leading-4 text-white/55">
                    Trading and digital assets involve substantial risk and may result in the loss of your entire
                    deposit. Past performance is not indicative of future results. This interface provides execution
                    tooling and does not constitute investment advice.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-[10px] text-white/40">
                  © {new Date().getFullYear()} BULLION LABS. All rights reserved.
                </div>
                <div className="text-[10px] text-white/35">
                  By continuing you agree to Terms & acknowledge risk disclosure.
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-white/40">
              Tip: Inside dashboard use <span className="text-white/70 font-semibold">TOP STRATEGIES WORKING</span> to
              start in 2s.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
