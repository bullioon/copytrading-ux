"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardDial } from "@/app/components/OnboardDial"

/* ================= TYPES ================= */

type Profile = "BULLION" | "HELLION" | "TORION"
  // ✅ Access Window (FOMO)
type AccessPhase = "OPEN" | "CLOSING" | "CLOSED"


/* ================= SOCIAL PROOF (PER TIER) ================= */

const COMMUNITY_FEED: Record<Profile, { handle: string; msg: string; vibe?: string }[]> = {
  BULLION: [
    { handle: "operator_013", msg: "First deck feels clean. Guardrails actually help.", vibe: "👍" },
    { handle: "routewatch", msg: "Watched the ops feed 2 mins then entered. Smooth.", vibe: "⚡" },
    { handle: "minted.b", msg: "BULLION is the best ‘learn without bleeding’ tier.", vibe: "🛡️" },
  ],
  HELLION: [
    { handle: "vol_surgeon", msg: "HELLION during spikes is disgusting (good).", vibe: "🔥" },
    { handle: "latency_ghost", msg: "Multi-trader routing feels fast af.", vibe: "⚡" },
    { handle: "spreadcheck", msg: "If you hesitate you chase. Enter and watch it work.", vibe: "👁️" },
  ],
  TORION: [
    { handle: "inst_exec", msg: "TORION posture feels enterprise-grade.", vibe: "🏛️" },
    { handle: "fundedpath", msg: "Only tier that feels scale-ready.", vibe: "🧠" },
    { handle: "risk_ops", msg: "Audit trail vibe. You can actually read the system.", vibe: "📡" },
  ],
}

const SIXS_NARRATION: Record<Profile, string[]> = {
  BULLION: [
    "6XS: Guardrails engaged. Low exposure posture locked.",
    "6XS: Routing prepared for 2-trader execution.",
    "6XS: Watching for clean entry layers.",
  ],
  HELLION: [
    "6XS: Volatility posture active. Spread filters armed.",
    "6XS: Multi-trader routing online. Expect fast transitions.",
    "6XS: If you wait, you chase. Choose and enter.",
  ],
  TORION: [
    "6XS: Institutional posture loaded. Route diversification online.",
    "6XS: Execution integrity prioritized. Audit trail enabled.",
    "6XS: Funded path checks will appear inside the lab.",
  ],
}
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

// ✅ ADDED: “What you get” (sin tocar tu layout; solo se imprime debajo del summary)
const WHAT_YOU_GET: Record<Profile, string[]> = {
  BULLION: ["2-trader copy routing", "Strict risk guardrails", "Live activity feed", "Fast-start templates inside"],
  HELLION: ["3–5 trader orchestration", "Volatility execution mode", "Spread & latency filters", "Tier switching supported"],
  TORION: ["Funded path eligibility", "Institutional routing layer", "Route diversification logic", "Advanced multi-trader control"],
}

// ✅ ADDED: mini tags para que el social feed se sienta “ops” (sin cambiar tus strings)
function inferTag(s: string): string {
  const t = s.toUpperCase()
  if (t.includes("RISK")) return "RISK"
  if (t.includes("LATENCY") || t.includes("SLIPPAGE")) return "LAT"
  if (t.includes("ROUTE") || t.includes("ROUTING")) return "ROUTE"
  if (t.includes("VOLATILITY") || t.includes("SPREAD")) return "VOL"
  if (t.includes("FUNDED") || t.includes("INSTITUTIONAL")) return "INST"
  if (t.includes("DEPLOYED") || t.includes("ENTRY") || t.includes("EXECUTION")) return "EXEC"
  if (t.includes("DEPOSIT") || t.includes("GRANTED") || t.includes("ACCESS")) return "OPS"
  return "SYS"
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


// ✅ ADDED
function fmtSec(sec: number) {
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

const [accessPhase, setAccessPhase] = useState<AccessPhase>("OPEN")
const [accessCountdown, setAccessCountdown] = useState(90) // seconds
const [pressure, setPressure] = useState(42)

  // ✅ ADDED: expand “more info” sin modal (no mueve tu vibe)
  const [moreOpen, setMoreOpen] = useState(false)

    // ✅ COMMUNITY + 6XS (states)
  const [chatIndex, setChatIndex] = useState(0)

  const [sixsOn, setSixsOn] = useState(true)
  const [sixsLine, setSixsLine] = useState(0)
  const [sixsLog, setSixsLog] = useState<string[]>([])

  /* ================= EFFECTS ================= */

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

/* ===== COMMUNITY TICK (PER TIER) ===== */
useEffect(() => {
  setChatIndex(0)

  const t = setInterval(() => {
    setChatIndex(i => (i + 1) % COMMUNITY_FEED[selected].length)
  }, 4200)

  return () => clearInterval(t)
}, [selected])

/* ===== 6XS RESET ON TIER CHANGE ===== */
useEffect(() => {
  setSixsLine(0)
  setSixsLog([])
}, [selected])

/* ===== 6XS NARRATION TICK ===== */
useEffect(() => {
  if (!sixsOn) return

  const t = setInterval(() => {
    setSixsLine(prev => {
      const line =
        SIXS_NARRATION[selected][prev % SIXS_NARRATION[selected].length]

      setSixsLog(log => [line, ...log].slice(0, 5))
      return prev + 1
    })
  }, 3200)

  return () => clearInterval(t)
}, [sixsOn, selected])

/* ===== TIER SWITCH ANIMATION ===== */
useEffect(() => {
  setTierAnim(true)
  const t = setTimeout(() => setTierAnim(false), 520)
  return () => clearTimeout(t)
}, [selected])

/* ===== STATUS CYCLE ===== */
useEffect(() => {
  const t = setInterval(() => {
    setStatus(s =>
      s === "idle" ? "arming" : s === "arming" ? "live" : "arming"
    )
  }, 2600)

  return () => clearInterval(t)
}, [])

/* ===== OPS METRICS TICK ===== */
useEffect(() => {
  const t = setInterval(() => {
    setUptimeSec(s => s + 1)
    setIntegrity(v => clamp(v + 0.02, 70, 99))
    setStability(v =>
      clamp(v + (status === "live" ? 0.06 : 0.02), 60, 98)
    )
  }, 1000)

  return () => clearInterval(t)
}, [status])

/* ===== ACCESS WINDOW (FOMO) ===== */
useEffect(() => {
  const t = setInterval(() => {
    setAccessCountdown(s => {
      const next = s - 1
      return next <= 0 ? 90 : next
    })

    setPressure(p => clamp(p + 0.4, 15, 95))

    setAccessPhase(() => {
      if (accessCountdown <= 20) return "CLOSING"
      return "OPEN"
    })
  }, 1000)

  return () => clearInterval(t)
}, [accessCountdown])

/* ✅ COMMUNITY tick (PER TIER) */
useEffect(() => {
  setChatIndex(0)
  const t = setInterval(() => {
    setChatIndex(i => (i + 1) % COMMUNITY_FEED[selected].length)
  }, 4200)

  return () => clearInterval(t)
}, [selected])

/* ✅ 6XS reset on tier change */
useEffect(() => {
  setSixsLine(0)
  setSixsLog([])
}, [selected])

/* ✅ 6XS narration tick */
useEffect(() => {
  if (!sixsOn) return

  const t = setInterval(() => {
    // usamos el updater para no depender de sixsLine en deps
    setSixsLine(prev => {
      const line = SIXS_NARRATION[selected][prev % SIXS_NARRATION[selected].length]
      setSixsLog(log => [line, ...log].slice(0, 5))
      return prev + 1
    })
  }, 3200)

  return () => clearInterval(t)
}, [sixsOn, selected])

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

/* ===== OPS METRICS TICK ===== */
useEffect(() => {
  const t = setInterval(() => {
    setUptimeSec(s => s + 1)
    setIntegrity(v => clamp(v + 0.02, 70, 99))
    setStability(v => clamp(v + (status === "live" ? 0.06 : 0.02), 60, 98))
  }, 1000)

  return () => clearInterval(t)
}, [status])

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

  /* ✅ COMMUNITY tick */
  useEffect(() => {
    setChatIndex(0)

    const t = setInterval(() => {
      setChatIndex(i => (i + 1) % COMMUNITY_FEED[selected].length)
    }, 4200)

    return () => clearInterval(t)
  }, [selected])

  /* ✅ 6XS reset on tier change */
  useEffect(() => {
    setSixsLine(0)
    setSixsLog([])
  }, [selected])

  /* ✅ 6XS narration tick */
  useEffect(() => {
    if (!sixsOn) return

    const t = setInterval(() => {
      const line = SIXS_NARRATION[selected][sixsLine % SIXS_NARRATION[selected].length]
      setSixsLog(prev => [line, ...prev].slice(0, 5))
      setSixsLine(n => n + 1)
    }, 3200)

    return () => clearInterval(t)
  }, [sixsOn, selected, sixsLine])

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

const goDashboard = async () => {
  // 1) guarda tier (active:false) en Firestore via API
  await fetch("/api/access/set-tier", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier: selected }),
  }).catch(() => {})

  // 2) entra al router inteligente
  router.push("/enter")
}

  // ✅ ADDED: variables para social tag sin tocar tu feed
  const liveLine = SOCIAL_EVENTS_BY_TIER[selected][socialIndex]
  const liveTag = inferTag(liveLine)

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

{/* ✅ ADDED: Access Window chip (desktop) */}
<div className="hidden md:inline-flex rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] tracking-widest text-white/80">
ACCESS <span className="ml-2 text-white/90 font-semibold">{accessPhase}</span>
<span className="ml-2 text-white/50">·</span>
<span className="ml-2 text-white/85">{fmtSec(accessCountdown)}</span>
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

                  

                  {/* ✅ ADDED: chips de valor (no mueven nada, se ven “perro”) */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-white/55">
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">execution tooling</span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">guardrails on</span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">tier switch supported</span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">start in 2s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">STRATEGY DECK</h1>
            <p className="mt-3 text-sm tracking-widest uppercase text-white/50">Live execution environment</p>

            {/* ✅ ADDED: clarity + FOMO limpio (sin inventar números) */}
            <p className="mt-4 text-[12px] md:text-[13px] tracking-widest text-white/60">
              Pick a tier → load the deck → enter the lab. Access opens in waves. If the lab is live, move now.
            </p>
          </div>

<div className="mt-6 rounded-2xl border border-white/10 bg-black/45 px-5 py-4">
  <div className="text-[10px] tracking-widest text-white/45">WHAT YOU&apos;RE ENTERING</div>
  <div className="mt-2 text-[12px] tracking-widest text-white/70 leading-relaxed">
    This is a live execution lab. You load a strategy deck, choose a tier, and the system routes copy execution with
    built-in risk guardrails and an activity feed so you can see what&apos;s happening.
  </div>

  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/55">
    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">not financial advice</span>
    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">execution tooling</span>
    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">copy routing</span>
    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">guardrails on</span>
  </div>
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
                  {timestamp} ▸ {liveLine}
                </div>

                {/* ✅ ADDED: micro “why it matters” 1 liner (no mueve el bloque) */}
                <div className="mt-1 text-[10px] tracking-widest text-white/40">
                  status feed reflects routing + risk locks while you select a tier
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/45 px-3 py-2">
                <div className="text-[10px] tracking-widest text-white/45">MODE</div>
                <div className="mt-1 text-[11px] text-white/80 font-semibold">ONBOARD</div>

                {/* ✅ ADDED: tag chip (ops vibe) */}
                <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] tracking-widest text-white/70">
                  {liveTag}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ ADDED: HOW IT WORKS (debajo del social, sin mover tu main panel) */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { k: "01", t: "Pick tier", d: "Access level + routing posture." },
              { k: "02", t: "Load deck", d: "System arms filters & guardrails." },
              { k: "03", t: "Enter lab", d: "Dashboard preloaded, start in 2s." },
            ].map(x => (
              <div key={x.k} className="rounded-2xl border border-white/10 bg-black/45 px-4 py-4">
                <div className="text-[10px] tracking-widest text-white/45">{x.k}</div>
                <div className="mt-1 text-[12px] tracking-widest text-white/80 font-semibold">{x.t}</div>
                <div className="mt-1 text-[11px] tracking-widest text-white/55">{x.d}</div>
              </div>
            ))}
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

            {/* TIER DIFFERENCE */}
<div className="mt-5 rounded-2xl border border-white/10 bg-black/45 px-5 py-4">
  <div className="text-[10px] tracking-widest text-white/45">HOW TO CHOOSE</div>

  <div className="mt-3 grid gap-2 md:grid-cols-3">
    <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <div className="text-[11px] tracking-widest text-white/80 font-semibold">BULLION</div>
      <div className="mt-1 text-[10px] tracking-widest text-white/55">
        First deck. Learn the flow. Strict guardrails.
      </div>
    </div>

    <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <div className="text-[11px] tracking-widest text-white/80 font-semibold">HELLION</div>
      <div className="mt-1 text-[10px] tracking-widest text-white/55">
        Faster routing. More traders. Volatility-focused.
      </div>
    </div>

    <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <div className="text-[11px] tracking-widest text-white/80 font-semibold">TORION</div>
      <div className="mt-1 text-[10px] tracking-widest text-white/55">
        Institutional layer + funded path eligibility.
      </div>
    </div>
  </div>
</div>


<div className="mt-5 rounded-2xl border border-white/10 bg-black/45 px-5 py-4">
  <div className="text-[10px] tracking-widest text-white/45">HOW TO CHOOSE (LIVE)</div>

  <div className={`mt-2 text-[12px] tracking-widest font-semibold ${active.text}`}>
    {selected} — {active.short}
  </div>

  <div className="mt-2 text-[10px] tracking-widest text-white/55">
    Minimum deposit: ${active.priceUSD} · You can switch tier later.
  </div>

  <div className="mt-3 text-[10px] tracking-widest text-white/40">
    Pick fast. The lab starts moving as soon as you enter.
  </div>
</div>


            {/* DESCRIPTION */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] tracking-widest text-white/45">DECK SUMMARY</div>
                <div className={`rounded-full border px-3 py-1 text-[10px] tracking-widest ${statusChip.cls}`}>
                  {statusChip.label}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/45 px-5 py-4">
  <div className="text-[10px] tracking-widest text-white/45">WHY THIS WINS</div>
  <div className="mt-2 grid gap-2">
    {[
      "You don’t start from zero: decks are pre-wired with routing + risk posture.",
      "You can observe before you scale: the feed shows what the system is doing.",
      "You can switch tiers later: same flow, different execution capacity.",
    ].map(s => (
      <div key={s} className="text-[11px] tracking-widest text-white/60">▸ {s}</div>
    ))}
  </div>
</div>

              <pre className="mt-3 font-mono text-[13px] text-white/75 whitespace-pre-wrap">{active.description}</pre>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-white/55">
                <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1">auto-routing ready</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1">risk guard enabled</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1">you can change tier later</span>
              </div>

              {/* ✅ ADDED: WHAT YOU GET (per tier) debajo del summary; no cambia tu layout */}
              <div className="mt-5 grid gap-2">
                {WHAT_YOU_GET[selected].map(b => (
                  <div key={b} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                    <span className={`h-2 w-2 rounded-full ${active.grid}`} />
                    <span className="text-[11px] tracking-widest text-white/70">{b}</span>
                  </div>
                ))}
              </div>

              {/* ✅ ADDED: botón expand “MORE DETAILS” inline (cero overlays) */}
              <button
                type="button"
                onClick={() => setMoreOpen(v => !v)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[10px] tracking-widest text-white/70 hover:bg-white/5"
              >
                {moreOpen ? "HIDE DETAILS ▴" : "MORE DETAILS ▾"}
              </button>

              {moreOpen ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-4 py-3">
                  <div className="text-[10px] tracking-widest text-white/45">INSIDE THE LAB</div>
                  <div className="mt-2 grid gap-1">
                    {[
                      "Top Strategies Working — start in 2 seconds",
                      "Live activity feed — routing events in real time",
                      "Guardrails — default protections enabled",
                      "Tier switch — keep flow, change profile later",
                    ].map(x => (
                      <div key={x} className="text-[11px] tracking-widest text-white/60">
                        ▸ {x}
                      </div>
                    ))}
                  </div>

                  {/* FOMO clean */}
                  <div className="mt-3 text-[10px] tracking-widest text-white/40">
                    When the system is live, the first move is usually missed by people still “thinking”.
                  </div>
                </div>
              ) : null}
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

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">

  {[

    { t: "Top Strategies Working", d: "Start copying in ~2 seconds." },
    { t: "Live Ops Feed", d: "See routing, risk locks, and execution events." },
    { t: "Guardrails", d: "Default risk protections active while you learn." },
  ].map(x => (
    <div key={x.t} className="rounded-2xl border border-white/10 bg-black/45 px-4 py-4">
      <div className="text-[12px] tracking-widest text-white/80 font-semibold">{x.t}</div>
      <div className="mt-1 text-[11px] tracking-widest text-white/55">{x.d}</div>
    </div>
  ))}
</div>
              <div className="relative z-10 mt-1 text-[10px] tracking-widest text-white/55 font-normal">
                {step === 1 ? "Pick a tier to continue" : "Fast start available inside dashboard"}
              </div>
            </button>

            {/* ✅ ADDED: FOMO note bajo el CTA (aditivo, no cambia nada) */}
            <div className="mt-3 text-center text-[10px] tracking-widest text-white/45">
              Access opens in waves · If the lab is live, the best entries happen before you “feel ready”.
            </div>

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
