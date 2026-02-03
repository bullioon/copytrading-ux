"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

/* ================= TYPES ================= */

type Profile = "BULLION" | "HELLION" | "TORION"

/* ================= LOGOS ================= */

// ✅ usa los SVG ya coloreados (evita hue-rotate que te rompe tonos)
const TIER_LOGO_L: Record<Profile, string> = {
  BULLION: "/bullionl.svg",
  HELLION: "/hellionl.svg",
  TORION: "/torionl.svg",
}

/* ================= CONFIG ================= */

const PROFILES: Record<
  Profile,
  {
    title: string
    badge: string
    priceLabel: string
    sub: string
    bullets: string[]
    border: string
    text: string
    accentGlow: string
    isFree: boolean
    cta: string
  }
> = {
  BULLION: {
    title: "BULLION",
    badge: "FREE",
    priceLabel: "FREE ACCESS",
    sub: "Start free · 2-trader routing · strict guardrails",
    bullets: [
      "Free entry to Strategy Lab",
      "Copy routing with 2 traders",
      "Risk guardrails enabled by default",
      "Live activity feed inside dashboard",
    ],
    border: "border-emerald-400/50",
    text: "text-emerald-300",
    accentGlow: "rgba(34,197,94,0.18)",
    isFree: true,
    cta: "START FREE",
  },
  HELLION: {
    title: "HELLION",
    badge: "PRO",
    priceLabel: "$1,500 minimum deposit",
    sub: "Paywall · 3–5 traders · volatility mode",
    bullets: ["3–5 trader orchestration", "Volatility execution posture", "Spread/latency filters", "Tier switching supported"],
    border: "border-red-400/45",
    text: "text-red-300",
    accentGlow: "rgba(239,68,68,0.16)",
    isFree: false,
    cta: "PAY & UNLOCK",
  },
  TORION: {
    title: "TORION",
    badge: "INSTITUTIONAL",
    priceLabel: "$3,000 minimum deposit",
    sub: "Paywall · orchestration · funded path",
    bullets: ["Institutional routing layer", "Route diversification logic", "Advanced multi-trader control", "Funded path eligibility checks"],
    border: "border-purple-400/45",
    text: "text-purple-300",
    accentGlow: "rgba(168,85,247,0.18)",
    isFree: false,
    cta: "PAY & UNLOCK",
  },
}

/* ================= HELPERS ================= */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
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
  const activeLogo = TIER_LOGO_L[selected]

  // UI motion (subtle)
  const [uptime, setUptime] = useState(0)
  const [pressure, setPressure] = useState(42)

  // background grid (avoid hydration mismatch by creating AFTER mount)
  const [mounted, setMounted] = useState(false)
  const [grid, setGrid] = useState<number[]>([])
  const [glowIndex, setGlowIndex] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const t = setInterval(() => {
      setUptime((s) => s + 1)
      setPressure((p) => clamp(p + 0.25, 15, 95))
    }, 1000)
    return () => clearInterval(t)
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const cols = 12
    const rows = 10
    const size = cols * rows
    setGrid(Array.from({ length: size }, () => Math.floor(Math.random() * 3)))

    const i = setInterval(() => {
      const idx = Math.floor(Math.random() * size)
      setGlowIndex(idx)
      setTimeout(() => setGlowIndex(null), 900)
    }, 1600)

    return () => clearInterval(i)
  }, [mounted])

  const headerGlow = useMemo(() => {
    return `radial-gradient(1200px 360px at 12% 0%, rgba(34,211,238,0.10), ${active.accentGlow}, rgba(0,0,0,0.70))`
  }, [active.accentGlow])

  // ✅ “slots” vibe (visual only)
  const slotsLeft = useMemo(() => {
    const base = selected === "BULLION" ? 28 : selected === "HELLION" ? 12 : 6
    const drop = Math.floor((pressure - 42) / 10)
    return Math.max(1, base - drop)
  }, [pressure, selected])

  // ✅ NAV FIX: Bullion -> login. Hellion/Torion -> pay.
  const goTier = (t: Profile) => {
    setSelected(t)

    if (t === "BULLION") {
      router.push(`/login?tier=BULLION`)
      return
    }

    // ✅ DIRECT TO PAY
    router.push(`/pay?tier=${encodeURIComponent(t)}`)
  }

  // ✅ Deposit crypto -> login -> /wallet (future)
  const goDepositCrypto = () => {
    router.push(`/login?next=${encodeURIComponent("/wallet")}`)
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* GRID BG */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 grid grid-cols-12 gap-px opacity-20 md:opacity-25">
          {mounted
            ? grid.map((c, i) => (
                <div
                  key={i}
                  className={[
                    "w-full aspect-square transition-all duration-[900ms]",
                    c === 0 && "bg-emerald-400/14",
                    c === 1 && "bg-red-400/10",
                    c === 2 && "bg-purple-400/12",
                    glowIndex === i ? "bg-white/65 shadow-[0_0_22px_rgba(255,255,255,0.35)]" : "",
                  ].join(" ")}
                />
              ))
            : null}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/90" />
      </div>

      {/* HEADER */}
      <header
        className="fixed top-0 inset-x-0 z-30 h-14 px-4 md:px-6 flex items-center justify-between backdrop-blur border-b border-white/10"
        style={{ background: headerGlow }}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <img src="/lgv.svg" alt="Bullions" className="h-7 w-auto object-contain" />
          <div className="hidden sm:block min-w-0">
            <div className="tracking-[0.18em] text-[11px] font-semibold text-white/80 truncate">PROJECT</div>
            <div className="text-[10px] tracking-widest text-white/45 truncate">
              STRATEGY LAB ACCESS · <span className={`${active.text} font-semibold`}>{selected}</span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest text-white/70">
            <span className="rounded-full border border-white/12 bg-black/35 px-3 py-1">
              slots <span className="text-white/90 font-semibold">{slotsLeft}</span>
            </span>
            <span className="rounded-full border border-white/12 bg-black/35 px-3 py-1">
              access window <span className="text-white/90 font-semibold">{fmtTime(90 - (uptime % 90))}</span>
            </span>
          </div>

          <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] tracking-widest text-white/80">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2 align-middle" />
            SOLANA
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="relative z-10 pt-20 md:pt-24 px-4 md:px-6 pb-16">
        <div className="mx-auto w-full max-w-5xl">
          {/* HERO (premium bar + tier logo inside the panel) */}
          <div className="text-center">
            <div
              className="mx-auto w-[min(860px,96vw)] rounded-3xl border border-white/10 bg-black/45 px-5 py-5"
              style={{
                boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 70px ${active.accentGlow}`,
                background: `radial-gradient(900px 240px at 50% 0%, ${active.accentGlow}, rgba(0,0,0,0.62))`,
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-3">
                    {/* ✅ tier logo that changes correctly */}
                    <img
                      src={activeLogo}
                      alt={`${selected} logo`}
                      className="h-9 w-auto object-contain"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.22em] text-white/45">COPY ROUTING · GUARDRAILS · LIVE LAB</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`text-[12px] tracking-widest font-semibold ${active.text}`}>{active.title}</span>
                        <span className="text-white/35">·</span>
                        <span className="text-[11px] tracking-widest text-white/70">{active.priceLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] tracking-widest text-white/55">{active.sub}</div>
                </div>

                <div className="flex items-center justify-start md:justify-end gap-2">
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-[10px] tracking-widest",
                      active.isFree
                        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                        : "border-white/15 bg-white/5 text-white/75",
                    ].join(" ")}
                  >
                    {active.isFree ? "START FREE" : "PAYWALL"}
                  </span>

                  <span className="rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] tracking-widest text-white/70">
                    wave <span className="text-white/90 font-semibold">{pressure.toFixed(0)}%</span>
                  </span>
                </div>
              </div>
            </div>

            <h1 className="mt-8 text-4xl md:text-6xl font-semibold tracking-tight">
              Copy proven strategies.
              <span className={`block mt-2 ${active.text}`}>Start in minutes.</span>
            </h1>

            <p className="mt-4 text-[13px] md:text-[14px] text-white/60 max-w-2xl mx-auto leading-relaxed">
              Choose your access tier. <span className="text-white/85 font-semibold">BULLION is free</span>.
              Pro tiers unlock higher routing capacity and go straight to checkout.
            </p>

            {/* CTA row */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => goTier("BULLION")}
                className={[
                  "w-full sm:w-auto rounded-2xl border px-6 py-4 text-sm font-semibold tracking-widest transition-all",
                  PROFILES.BULLION.border,
                  "bg-black/55 hover:bg-white/[0.06] hover:border-white/30",
                ].join(" ")}
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 70px ${PROFILES.BULLION.accentGlow}` }}
              >
                START FREE ▸
                <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">BULLION · goes to login</div>
              </button>

              <button
                onClick={() => router.push(`/pay?tier=HELLION`)}
                className="w-full sm:w-auto rounded-2xl border border-white/10 bg-black/35 px-6 py-4 text-sm font-semibold tracking-widest text-white/85 hover:bg-white/[0.06] hover:border-white/25 transition"
              >
                UNLOCK PRO ▸
                <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">direct to payment</div>
              </button>
            </div>

            {/* socials row */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
              <a
                href="https://instagram.com/YOUR_INSTAGRAM"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-[11px] tracking-widest text-white/75 hover:bg-white/[0.06] hover:border-white/20 transition"
              >
                Instagram ↗
              </a>

              <a
                href="https://discord.gg/YOUR_DISCORD"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto rounded-xl border border-purple-300/25 bg-purple-500/15 px-4 py-3 text-[11px] tracking-widest text-purple-100 hover:bg-purple-500/20 hover:border-purple-200/35 transition"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 0 34px rgba(168,85,247,0.22)" }}
              >
                Discord ↗
              </a>

              <a
                href="https://x.com/YOUR_X"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-[11px] tracking-widest text-white/75 hover:bg-white/[0.06] hover:border-white/20 transition"
              >
                X ↗
              </a>
            </div>

            <div className="mt-4 text-[10px] tracking-widest text-white/45">
              Execution environment only · Not financial advice · Trading involves risk
            </div>
          </div>

          {/* Deposit crypto section */}
          <div
            className="mt-10 rounded-[26px] border border-white/10 bg-black/50 px-6 py-6 md:px-8 md:py-8"
            style={{
              boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 70px rgba(34,211,238,0.08)`,
              background: "radial-gradient(900px 320px at 20% 0%, rgba(34,211,238,0.10), rgba(0,0,0,0.65))",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.22em] text-white/45">NEXT MODULE</div>
                <div className="mt-2 text-[18px] md:text-[22px] font-semibold tracking-tight text-white/90">
                  Deposit crypto. Spend like a card.
                </div>
                <p className="mt-2 text-[12px] md:text-[13px] text-white/60 leading-relaxed max-w-2xl">
                  Deposit USDC to your Bullion wallet, route execution in the lab, and later use a digital card to pay anywhere.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[10px] tracking-widest text-white/60">
                  {["self-custody flow", "low fees", "instant settlement", "future: digital card"].map((c) => (
                    <span key={c} className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={goDepositCrypto}
                  className="w-full md:w-auto rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold tracking-widest text-white/90 hover:bg-white/10 transition"
                  style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 0 42px rgba(34,211,238,0.10)" }}
                >
                  DEPOSIT CRYPTO ▸
                  <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">login → open your wallet</div>
                </button>

                <div className="text-[10px] tracking-widest text-white/45">(Wallet page comes next.)</div>
              </div>
            </div>
          </div>

          {/* TIERS */}
          <div className="mt-10">
            <div className="text-[10px] tracking-widest text-white/45">CHOOSE YOUR ACCESS TIER</div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(PROFILES) as Profile[]).map((p) => {
                const cfg = PROFILES[p]
                const isActive = selected === p

                return (
                  <button
                    key={p}
                    onClick={() => goTier(p)} // ✅ click card goes to login/pay correctly
                    className={[
                      "relative text-left rounded-2xl border transition-all overflow-hidden",
                      "bg-black/45 hover:bg-white/[0.04]",
                      isActive ? `${cfg.border}` : "border-white/10",
                    ].join(" ")}
                    style={{
                      boxShadow: isActive
                        ? `0 0 0 1px rgba(255,255,255,0.06), 0 0 70px ${cfg.accentGlow}`
                        : "0 0 0 1px rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {/* ✅ small logo per tier */}
                          <div className={`text-[14px] font-semibold tracking-widest ${cfg.text}`}>{cfg.title}</div>
                        </div>

                        <div
                          className={[
                            "rounded-full border px-3 py-1 text-[9px] tracking-widest",
                            cfg.isFree
                              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                              : "border-white/15 bg-white/5 text-white/75",
                          ].join(" ")}
                        >
                          {cfg.badge}
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] tracking-widest text-white/70">{cfg.priceLabel}</div>
                      <div className="mt-3 text-[11px] tracking-widest text-white/55">{cfg.sub}</div>

                      <div className="mt-4 grid gap-2">
                        {cfg.bullets.map((b) => (
                          <div key={b} className="flex items-center gap-2 text-[11px] tracking-widest text-white/60">
                            <span className="h-2 w-2 rounded-full bg-white/15" />
                            <span className="min-w-0">{b}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5">
                        <div
                          className={[
                            "w-full rounded-xl border px-4 py-3 text-[11px] font-semibold tracking-widest transition-all",
                            cfg.isFree
                              ? `${cfg.border} bg-black/55 hover:bg-white/[0.06] hover:border-white/30`
                              : "border-white/10 bg-black/35 hover:bg-white/[0.06] hover:border-white/25",
                          ].join(" ")}
                        >
                          {cfg.isFree ? "START FREE ▸" : "PAY & UNLOCK ▸"}
                        </div>
                        <div className="mt-2 text-[10px] tracking-widest text-white/45">
                          {cfg.isFree ? "goes to login" : "goes to checkout"}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* FOOTER */}
          <footer className="mt-10 mb-6">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-[11px] tracking-widest text-white/70">
                  Powered by <span className="text-white/90 font-semibold">INTELLION</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] tracking-widest">
                  <a href="/terms" className="text-white/55 hover:text-white/85 underline underline-offset-4">
                    TERMS
                  </a>
                  <a href="/privacy" className="text-white/55 hover:text-white/85 underline underline-offset-4">
                    PRIVACY
                  </a>
                  <a href="/legal" className="text-white/55 hover:text-white/85 underline underline-offset-4">
                    LEGAL
                  </a>
                  <span className="text-white/25">·</span>
                  <span className="text-white/45">Execution environment only</span>
                  <span className="text-white/25">·</span>
                  <span className="text-white/45">Risk disclosure applies</span>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-white/40">
                © {new Date().getFullYear()} Bullion Labs. Trading and digital assets involve risk and may result in total loss.
              </div>
            </div>
          </footer>
        </div>
      </section>
    </main>
  )
}
