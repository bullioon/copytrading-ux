"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import AICoreFlow from "@/app/components/AICoreFlow"
import SocialLivePanel from "@/app/components/SocialLivePanel"

type Profile = "BULLION" | "HELLION" | "TORION"

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
    pill?: { label: string; icon: string; tone: "red" | "purple" }
    perf?: { value: string }
  }
> = {
  BULLION: {
    title: "BULLION",
    badge: "FREE ENTRY",
    priceLabel: "FREE ACCESS · $50 min deposit",
    sub: "Fast start · 2-trader routing · strict guardrails",
    bullets: [
      "Free entry to Strategy Lab",
      "2-trader copy routing (starter capacity)",
      "Guardrails on by default (risk constraints)",
      "Live activity feed inside dashboard",
      "Cost/Benefit sweet spot: $300+ recommended",
    ],
    border: "border-emerald-400/50",
    text: "text-emerald-300",
    accentGlow: "rgba(34,197,94,0.20)",
    isFree: true,
    cta: "START FREE",
    perf: { value: "up to 3x" },
  },

  HELLION: {
    title: "HELLION",
    badge: "MT5 POWER",
    priceLabel: "PRO · connect MT5 accounts",
    sub: "MT5 multi-account scaling · 3–5 traders · volatility posture",
    bullets: [
      "Connect MetaTrader 5 (multiple accounts)",
      "Route execution across your accounts to maximize capacity",
      "3–5 trader orchestration",
      "Spread / latency filters",
      "Volatility execution posture",
    ],
    border: "border-red-400/45",
    text: "text-red-300",
    accentGlow: "rgba(239,68,68,0.18)",
    isFree: false,
    cta: "PAY & UNLOCK",
    pill: { label: "CONNECT MT5", icon: "/mt5.png", tone: "red" },
    perf: { value: "up to 10x" },
  },

  TORION: {
    title: "TORION",
    badge: "FUNDED CAPITAL",
    priceLabel: "INSTITUTIONAL · funded routing",
    sub: "Quality-first execution · lower personal risk · higher consistency",
    bullets: [
      "Access real funded capital through connected accounts",
      "Up to $400K routing capacity per user (e.g., 2×200K)",
      "Funded-account eligibility & risk checks",
      "Quality posture: fewer trades, better selection",
      "More consistent profit profile through sizing rules",
    ],
    border: "border-purple-400/45",
    text: "text-purple-300",
    accentGlow: "rgba(168,85,247,0.20)",
    isFree: false,
    cta: "PAY & UNLOCK",
    pill: { label: "FTMO FUNDED", icon: "/ftm.jpg", tone: "purple" },
    perf: { value: "up to 5x" },
  },
}

function Tip({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="relative inline-flex items-center gap-2">
      <span className="min-w-0">{label}</span>
      <span className="group relative inline-flex items-center justify-center h-4 w-4 rounded-full border border-white/15 text-[9px] text-white/70">
        i
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-black/90 p-3 text-[10px] leading-relaxed text-white/70 opacity-0 group-hover:opacity-100 transition">
          {tip}
        </span>
      </span>
    </span>
  )
}

function Pill({
  label,
  icon,
  tone,
}: {
  label: string
  icon: string
  tone: "red" | "purple"
}) {
  const toneClass =
    tone === "red"
      ? "border-red-300/20 bg-red-400/[0.10] text-red-100"
      : "border-purple-300/20 bg-purple-500/[0.12] text-purple-100"

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-widest ${toneClass}`}>
      <img src={icon} alt={label} className="h-4 w-4 object-contain opacity-90" draggable={false} />
      {label}
    </span>
  )
}

function TierMark({ tier, active }: { tier: Profile; active?: boolean }) {
  const cfg = PROFILES[tier]
  const dot =
    tier === "BULLION"
      ? "bg-emerald-400"
      : tier === "HELLION"
      ? "bg-red-400"
      : "bg-purple-400"

  return (
    <div
      className={[
        "relative h-10 w-10 rounded-2xl border bg-black/55 overflow-hidden shrink-0",
        active ? cfg.border : "border-white/10",
      ].join(" ")}
      style={{
        boxShadow: active
          ? `0 0 0 1px rgba(255,255,255,0.06), 0 0 70px ${cfg.accentGlow}`
          : "0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-white/10" />
      <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/10" />
      <div className="absolute left-2 bottom-2 h-2 w-2 rounded-full bg-white/10" />
      <div className="absolute right-2 bottom-2 h-2 w-2 rounded-full bg-white/10" />

      {active ? (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 opacity-50" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 neutron-orbit-a">
            <div className="h-1.5 w-1.5 rounded-full bg-white/35" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 neutron-orbit-b">
            <div className="h-1 w-1 rounded-full bg-white/25" />
          </div>
        </div>
      ) : null}

      <div
        className={[
          "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
          dot,
          active ? "nucleus-jitter" : "",
        ].join(" ")}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent" />
    </div>
  )
}

function PhantomWalletMock({ tier, usd = 336.42 }: { tier: Profile; usd?: number }) {
  const cfg = PROFILES[tier]
  const accent =
    tier === "BULLION"
      ? { dot: "bg-emerald-400", ring: "border-emerald-300/25", chip: "bg-emerald-300/[0.08]" }
      : tier === "HELLION"
      ? { dot: "bg-red-400", ring: "border-red-300/25", chip: "bg-red-400/[0.08]" }
      : { dot: "bg-purple-400", ring: "border-purple-300/25", chip: "bg-purple-500/[0.10]" }

  const address = "7xK2…Qp9a"
  const usdc = usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className="rounded-[28px] border border-white/10 bg-black/55 overflow-hidden"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 28px 120px rgba(0,0,0,0.55)` }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={["h-9 w-9 rounded-2xl border bg-black/60 flex items-center justify-center", accent.ring].join(" ")}>
              <span className={["h-2.5 w-2.5 rounded-full", accent.dot].join(" ")} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] tracking-widest text-white/80 font-semibold">WALLET</div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/70">
                {address}
                <span className="h-1 w-1 rounded-full bg-white/20" />
                SOLANA
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] tracking-widest text-white/45">TOTAL BALANCE</div>
            <div className="mt-1 text-[22px] font-semibold text-white">${usdc}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="rounded-2xl border border-white/10 bg-black/55 px-3 py-3 text-[10px] tracking-widest text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition">
            Receive
          </button>
          <button className="rounded-2xl border border-white/10 bg-black/55 px-3 py-3 text-[10px] tracking-widest text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition">
            Send
          </button>
          <button className={["rounded-2xl border px-3 py-3 text-[10px] tracking-widest text-white/90 hover:border-white/30 transition", accent.ring, accent.chip].join(" ")}>
            Swap
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.26em] text-white/45">ASSETS</div>
          <div className={["inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-widest", cfg.border, "bg-black/55"].join(" ")}>
            <span className={["h-2 w-2 rounded-full", accent.dot].join(" ")} />
            {tier}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <AssetRow name="USD Coin" symbol="USDC" sub="Solana" amount={`$${usdc}`} highlight tier={tier} />
          <AssetRow name="Solana" symbol="SOL" sub="Network fees" amount="$12.84" tier={tier} />
          <AssetRow name="Intellion Credits" symbol="ION" sub="Platform" amount="$0.00" tier={tier} muted />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="text-[10px] tracking-widest text-white/50">CARD</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[12px] tracking-widest text-white/80">Bullion Mastercard</div>
            <div className="text-[10px] tracking-widest text-white/55">•••• 6X69</div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-white/45">Available to spend</div>
            <div className="text-[12px] font-semibold text-white">${usdc}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssetRow({
  name,
  symbol,
  sub,
  amount,
  muted,
  highlight,
  tier,
}: {
  name: string
  symbol: string
  sub: string
  amount: string
  muted?: boolean
  highlight?: boolean
  tier: Profile
}) {
  const dot =
    tier === "BULLION" ? "bg-emerald-400" : tier === "HELLION" ? "bg-red-400" : "bg-purple-400"

  return (
    <div
      className={[
        "rounded-2xl border bg-black/55 px-4 py-3 flex items-center justify-between gap-3",
        muted ? "opacity-55" : "",
        highlight ? "border-white/15" : "border-white/10",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-10 w-10 rounded-2xl border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden">
          <div className={["h-2.5 w-2.5 rounded-full", dot].join(" ")} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] tracking-widest text-white/85 truncate">
            {name} <span className="text-white/45">· {symbol}</span>
          </div>
          <div className="mt-1 text-[10px] tracking-widest text-white/50">{sub}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[12px] font-semibold text-white">{amount}</div>
        <div className="mt-1 text-[10px] tracking-widest text-white/45">{highlight ? "Primary" : "Asset"}</div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()

  // ✅ SINGLE SOURCE OF TRUTH
  const [selected, setSelected] = useState<Profile>("BULLION")
  const active = PROFILES[selected]

  const headerGlow = useMemo(() => {
    return `radial-gradient(1200px 360px at 12% 0%, rgba(0,255,160,0.08), ${active.accentGlow}, rgba(0,0,0,0.88))`
  }, [active.accentGlow])

  const goTier = (t: Profile) => {
    if (t === "BULLION") {
      router.push(`/login?tier=BULLION`)
      return
    }
    router.push(`/pay?tier=${encodeURIComponent(t)}`)
  }

  const goDepositCrypto = () => {
    router.push(`/login?next=${encodeURIComponent("/wallet")}`)
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* BUNKER BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(1200px 620px at 50% 0%, rgba(0,255,160,0.08), rgba(0,0,0,0.92)),
              radial-gradient(900px 560px at 50% 38%, rgba(168,85,247,0.07), rgba(0,0,0,0.96)),
              radial-gradient(650px 460px at 50% 58%, rgba(255,255,255,0.03), rgba(0,0,0,0.985)),
              #000
            `,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      {/* HEADER */}
      <header
        className="fixed top-0 inset-x-0 z-30 h-14 px-4 md:px-6 flex items-center justify-between backdrop-blur border-b border-white/10"
        style={{ background: headerGlow }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <TierMark tier={selected} active />
          <div className="min-w-0">
            <div className="tracking-[0.18em] text-[11px] font-semibold text-white/85 truncate">STRATEGY LAB</div>
            <div className="text-[10px] tracking-widest text-white/50 truncate">
              ACTIVE TIER · <span className={`${active.text} font-semibold`}>{selected}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] tracking-widest text-white/80">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2 align-middle" />
            SOLANA
          </div>
          <div className="hidden md:flex rounded-full border border-white/12 bg-black/40 px-3 py-1 text-[10px] tracking-widest text-white/65">
            bunker <span className="ml-2 text-white/90 font-semibold">ON</span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="relative z-10 pt-20 md:pt-24 px-4 md:px-6 pb-20">
        <div className="mx-auto w-full max-w-6xl">
          {/* HERO */}
          <div className="text-center">
            <div
              className="mx-auto w-[min(980px,96vw)] rounded-[30px] border border-white/10 bg-black/55 px-6 py-6 md:px-8 md:py-7"
              style={{
                boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 120px ${active.accentGlow}`,
                background: `radial-gradient(1100px 320px at 50% 0%, ${active.accentGlow}, rgba(0,0,0,0.74))`,
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-3">
                    <TierMark tier={selected} active />
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.26em] text-white/50">AI ROUTING · FILTERS · EXECUTION PATHS</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`text-[12px] tracking-widest font-semibold ${active.text}`}>{active.title}</span>
                        <span className="text-white/35">·</span>
                        <span className="text-[11px] tracking-widest text-white/75">{active.priceLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] tracking-widest text-white/60">{active.sub}</div>
                </div>

                <div className="flex items-center justify-start md:justify-end gap-2 flex-wrap">
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-[10px] tracking-widest",
                      active.isFree
                        ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                        : "border-white/15 bg-white/5 text-white/80",
                    ].join(" ")}
                  >
                    {active.badge}
                  </span>
                  {active.pill ? <Pill {...active.pill} /> : null}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center relative">
              <div
                className="pointer-events-none absolute -top-10 h-40 w-40 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(34,197,94,0.20), rgba(0,0,0,0) 60%)" }}
              />
              <div
                className="relative rounded-[30px] border border-emerald-300/20 bg-black/55 px-6 py-5"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 0 160px rgba(34,197,94,0.20)" }}
              >
                <img src="/bullionl.svg" alt="Bullions" className="h-12 md:h-14 w-auto object-contain opacity-95" draggable={false} />
              </div>
            </div>

            <h1 className="mt-8 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
              Access Real Capital.
              <span className={`block mt-3 ${active.text}`}>Powered by AI.</span>
            </h1>

            <p className="mt-6 text-[15px] md:text-[17px] text-white/80 max-w-3xl mx-auto leading-relaxed">
              Choose a tier. The engine locks an execution path: starter routing, MT5 scaling, or funded capital routing.
              Clean, simple, institutional.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => goTier("BULLION")}
                className={[
                  "w-full sm:w-auto rounded-2xl border px-7 py-4 text-sm font-semibold tracking-widest transition-all",
                  PROFILES.BULLION.border,
                  "bg-black/65 hover:bg-white/[0.06] hover:border-white/30",
                ].join(" ")}
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 90px ${PROFILES.BULLION.accentGlow}` }}
              >
                START FREE ▸
                <div className="mt-1 text-[10px] tracking-widest text-white/60 font-normal">$50 min · $300 sweet spot</div>
              </button>

              <button
                onClick={() => setSelected("TORION")}
                className="w-full sm:w-auto rounded-2xl border border-white/10 bg-black/50 px-7 py-4 text-sm font-semibold tracking-widest text-white/90 hover:bg-white/[0.06] hover:border-white/25 transition"
              >
                VIEW FUNDED ▸
                <div className="mt-1 text-[10px] tracking-widest text-white/60 font-normal">up to $400K routing</div>
              </button>
            </div>

            <div className="mt-5 text-[10px] tracking-widest text-white/45">Execution environment only · Not financial advice · Trading involves risk</div>
          </div>

          {/* REACTOR + FLOW + WALLET */}
          <div className="mt-16 relative">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 560,
                height: 560,
                background: `radial-gradient(circle at 50% 50%, ${active.accentGlow}, rgba(0,0,0,0) 60%)`,
                opacity: 0.95,
              }}
            />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ width: 520, height: 520 }} />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" style={{ width: 610, height: 610 }} />

            <div className="relative flex flex-col items-center">
              <div className="text-[10px] tracking-[0.26em] text-white/45 mb-4">ROUTING FLOW · TIER LOCK</div>

              <div className="w-[min(980px,96vw)] rounded-[32px] border border-white/10 bg-black/60 p-6 md:p-8" style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 120px ${active.accentGlow}` }}>
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                  <div className="flex-1 w-full">
                    {/* ✅ IMPORTANT: No onTierChange => no resetting to Bullion */}
                    <AICoreFlow />
                  </div>

                  <div className="w-full lg:w-[380px]">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] tracking-widest text-white/85 font-semibold">Phantom-style wallet</div>
                      <div className="flex items-center gap-2">
                        <TierMark tier={selected} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <PhantomWalletMock tier={selected} usd={selected === "BULLION" ? 336.42 : selected === "HELLION" ? 1240.0 : 5980.5} />
                    </div>

                    <button
                      onClick={goDepositCrypto}
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-black/45 px-5 py-4 text-[12px] font-semibold tracking-widest text-white/90 hover:bg-white/[0.06] hover:border-white/25 transition"
                    >
                      OPEN WALLET ▸
                      <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">login → wallet</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WALLET + CARD SECTION */}
          <div className="mt-16 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-white/10 bg-black/60 p-7 md:p-8" style={{ boxShadow: "0 0 120px rgba(0,255,160,0.06)" }}>
                <div className="text-[10px] tracking-[0.26em] text-white/45">WALLET + CARD</div>
                <div className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-white/90">Deposit crypto. Spend like a card.</div>
                <p className="mt-4 text-[14px] md:text-[15px] text-white/75 leading-relaxed">
                  Deposit USDC to your wallet. Same balance is used for routing and card spending:
                  <span className="text-white/90 font-semibold"> deposit → route → spend</span>.
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-[10px] tracking-widest text-white/65">
                  {["USDC on Solana", "instant settlement", "card spending", "self-custody wallet"].map((c) => (
                    <span key={c} className="rounded-full border border-white/10 bg-black/50 px-3 py-1">
                      {c}
                    </span>
                  ))}
                </div>

                <button
                  onClick={goDepositCrypto}
                  className="mt-7 w-full sm:w-auto rounded-2xl border border-white/12 bg-white/5 px-6 py-4 text-sm font-semibold tracking-widest text-white/90 hover:bg-white/10 hover:border-white/25 transition"
                  style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 0 60px rgba(0,255,160,0.08)" }}
                >
                  OPEN WALLET ▸
                  <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">login → wallet</div>
                </button>
              </div>

              {/* ✅ Card Preview (purple→blue gradient border) */}
              <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(168,85,247,0.55),rgba(59,130,246,0.45),rgba(34,197,94,0.18))]">
                <div className="rounded-3xl border border-white/10 bg-black/70 p-7 md:p-8 relative overflow-hidden" style={{ boxShadow: "0 0 160px rgba(255,255,255,0.06)" }}>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
                  <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-purple-400/[0.06] blur-3xl" />

                  <div className="relative">
                    <div className="text-[10px] tracking-[0.26em] text-white/45">CARD PREVIEW</div>

                    <div className="mt-5 rounded-[26px] border border-white/12 bg-black/80 p-6" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 80px rgba(0,0,0,0.55)" }}>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] tracking-widest text-white/60">BULLION MASTERCARD</div>
                        <div className="text-[10px] tracking-widest text-white/45">USDC</div>
                      </div>

                      <div className="mt-6">
                        <div className="text-[10px] tracking-widest text-white/45">AVAILABLE TO SPEND</div>
                        <div className="mt-1 text-4xl font-semibold text-white">1,240</div>
                      </div>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[10px] tracking-widest text-white/80">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        TAP TO PAY ENABLED
                      </div>

                      <div className="mt-6 flex items-center justify-between text-[10px] tracking-widest text-white/45">
                        <span>•••• 6X69</span>
                        <span className="flex items-center gap-2">
                          <span className="relative inline-flex h-4 w-9 items-center">
                            <span className="absolute left-0 h-4 w-4 rounded-full bg-white/25" />
                            <span className="absolute left-2 h-4 w-4 rounded-full bg-white/15" />
                          </span>
                          mastercard
                        </span>
                      </div>
                    </div>

                    <p className="mt-6 text-white/70 text-[13px] leading-relaxed">
                      Same balance. Two uses: <span className="text-white/85 font-semibold">routing</span> +{" "}
                      <span className="text-white/85 font-semibold">spending</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TIERS */}
          <div className="mt-16">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.26em] text-white/45">CHOOSE YOUR TIER</div>
              <div className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-white/90">Enter the Lab.</div>
              <p className="mt-4 text-[14px] text-white/75 max-w-3xl mx-auto leading-relaxed">
                Bullion is the fast start. Hellion scales through MT5. Torion routes funded capital with quality-first execution.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              {(Object.keys(PROFILES) as Profile[]).map((p) => {
                const cfg = PROFILES[p]
                const isActive = selected === p

                return (
                  <div
                    key={p}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(p)
                    }}
                    className={[
                      "relative text-left rounded-3xl border transition-all overflow-hidden cursor-pointer select-none",
                      "bg-black/60 hover:bg-white/[0.04]",
                      isActive ? `${cfg.border}` : "border-white/10",
                    ].join(" ")}
                    style={{
                      boxShadow: isActive
                        ? `0 0 0 1px rgba(255,255,255,0.06), 0 0 140px ${cfg.accentGlow}`
                        : "0 0 0 1px rgba(255,255,255,0.03)",
                      transform: isActive ? "scale(1.01)" : "scale(1.0)",
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <TierMark tier={p} active={isActive} />
                          <div className={`text-[16px] font-semibold tracking-widest ${cfg.text}`}>{cfg.title}</div>
                        </div>

                        <div
                          className={[
                            "rounded-full border px-3 py-1 text-[9px] tracking-widest",
                            cfg.isFree
                              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                              : "border-white/15 bg-white/5 text-white/80",
                          ].join(" ")}
                        >
                          {cfg.badge}
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] tracking-widest text-white/80">{cfg.priceLabel}</div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <div className="text-[12px] tracking-widest text-white/65">{cfg.sub}</div>
                        {cfg.pill ? <Pill {...cfg.pill} /> : null}
                      </div>

                      {/* PERFORMANCE PER $ + TABULADOR */}
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                          <div className="text-[9px] tracking-[0.26em] text-white/45">PERFORMANCE / $</div>
                          <div className={`mt-1 text-[14px] font-semibold ${cfg.text}`}>{cfg.perf?.value ?? "—"}</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                          <div className="text-[9px] tracking-[0.26em] text-white/45">CAPACITY</div>
                          <div className="mt-1 text-[12px] font-semibold text-white/80">
                            {p === "BULLION" ? "Starter" : p === "HELLION" ? "MT5 Scaling" : "Funded Routing"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                          <div className="text-[9px] tracking-[0.26em] text-white/45">POSTURE</div>
                          <div className="mt-1 text-[12px] font-semibold text-white/80">
                            {p === "BULLION" ? "Guardrails" : p === "HELLION" ? "Volatility" : "Quality-first"}
                          </div>
                        </div>
                      </div>

                      {p === "TORION" && (
                        <div className="mt-5">
                          <div className="text-4xl font-semibold text-purple-300">$400K</div>
                          <div className="text-[10px] tracking-[0.26em] text-white/45">ROUTING CAPACITY</div>
                        </div>
                      )}

                      {p === "BULLION" && (
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
                            <div className="text-[10px] tracking-widest text-white/45">MIN DEPOSIT</div>
                            <div className="mt-1 text-2xl font-semibold text-emerald-200">$50</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
                            <div className="text-[10px] tracking-widest text-white/45">SWEET SPOT</div>
                            <div className="mt-1 text-2xl font-semibold text-emerald-200">$300+</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 grid gap-2">
                        {cfg.bullets.map((b) => {
                          const isSweet = b.startsWith("Cost/Benefit sweet spot:")
                          return (
                            <div key={b} className="flex items-start gap-2 text-[12px] tracking-widest text-white/70">
                              <span className="mt-[7px] h-2 w-2 rounded-full bg-white/15 shrink-0" />
                              <span className="min-w-0">
                                {isSweet ? (
                                  <Tip
                                    label={b}
                                    tip="Bullion starts at $50. We recommend $300+ as the cost/benefit sweet spot for routing capacity, execution variance, and time-to-results."
                                  />
                                ) : (
                                  b
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            goTier(p)
                          }}
                          className={[
                            "w-full rounded-2xl border px-5 py-4 text-[12px] font-semibold tracking-widest transition-all",
                            cfg.isFree
                              ? `${cfg.border} bg-black/70 hover:bg-white/[0.06] hover:border-white/30`
                              : "border-white/10 bg-black/55 hover:bg-white/[0.06] hover:border-white/25",
                          ].join(" ")}
                        >
                          {cfg.isFree ? "START FREE ▸" : "PAY & UNLOCK ▸"}
                          <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">
                            {cfg.isFree ? "login → enter" : "checkout → unlock"}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SOCIAL LIVE */}
          <div className="mt-10">
            <SocialLivePanel />
          </div>

          {/* FOOTER */}
          <footer className="mt-12 mb-6">
            <div className="rounded-2xl border border-white/10 bg-black/50 px-5 py-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-[11px] tracking-widest text-white/70">
                  Powered by <span className="text-white/90 font-semibold">INTELLION</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] tracking-widest">
                  <a href="/terms" className="text-white/55 hover:text-white/85 underline underline-offset-4">TERMS</a>
                  <a href="/privacy" className="text-white/55 hover:text-white/85 underline underline-offset-4">PRIVACY</a>
                  <a href="/legal" className="text-white/55 hover:text-white/85 underline underline-offset-4">LEGAL</a>
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

      {/* NEUTRON ANIMATION KEYFRAMES */}
      <style jsx global>{`
        @keyframes neutronOrbitA {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(12px); opacity: 0.25; }
          50% { opacity: 0.5; }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(12px); opacity: 0.25; }
        }
        @keyframes neutronOrbitB {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(9px); opacity: 0.18; }
          50% { opacity: 0.38; }
          100% { transform: translate(-50%, -50%) rotate(-360deg) translateX(9px); opacity: 0.18; }
        }
        @keyframes nucleusJitter {
          0% { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); opacity: 0.98; }
          18% { transform: translate(-50%, -50%) translate(0.3px, -0.2px) scale(1.01); }
          36% { transform: translate(-50%, -50%) translate(-0.25px, 0.15px) scale(0.995); opacity: 0.95; }
          54% { transform: translate(-50%, -50%) translate(0.2px, 0.25px) scale(1.008); }
          72% { transform: translate(-50%, -50%) translate(-0.15px, -0.25px) scale(1); opacity: 0.98; }
          100% { transform: translate(-50%, -50%) translate(0px, 0px) scale(1); opacity: 0.98; }
        }
        .neutron-orbit-a { animation: neutronOrbitA 2.9s linear infinite; will-change: transform, opacity; }
        .neutron-orbit-b { animation: neutronOrbitB 3.7s linear infinite; will-change: transform, opacity; }
        .nucleus-jitter { animation: nucleusJitter 1.35s ease-in-out infinite; will-change: transform, opacity; }
      `}</style>
    </main>
  )
}