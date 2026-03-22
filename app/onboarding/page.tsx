"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import AICoreFlow from "@/app/components/AICoreFlow"
import SocialLivePanel from "@/app/components/SocialLivePanel"

type Profile = "BULLION" | "HELLION" | "TORION"

type ProfileConfig = {
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

const CAPITAL_POOL = 3903097

const PROFILES: Record<Profile, ProfileConfig> = {
  BULLION: {
    title: "BULLION",
    badge: "FREE ENTRY",
    priceLabel: "FREE ACCESS · $50 min deposit",
    sub: "Start fast with AI routing and built-in guardrails",
    bullets: [
      "Free entry to Strategy Lab",
      "2-trader starter routing",
      "Guardrails on by default",
      "Live dashboard activity",
      "Best value starts around $300+",
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
    sub: "Scale execution across multiple MT5 accounts",
    bullets: [
      "Connect MetaTrader 5 accounts",
      "Route across multiple accounts",
      "3–5 trader orchestration",
      "Spread and latency filters",
      "Built for higher execution power",
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
    sub: "Access larger routed capital with quality-first execution",
    bullets: [
      "Access funded capital structure",
      "Up to $400K routing capacity",
      "Eligibility and risk checks",
      "Fewer trades, better selection",
      "More consistent quality profile",
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

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ")
}

function Tip({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="relative inline-flex items-center gap-2">
      <span className="min-w-0">{label}</span>
      <span className="group relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[9px] text-white/70">
        i
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-black/90 p-3 text-[10px] leading-relaxed text-white/70 opacity-0 transition group-hover:opacity-100">
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
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-widest",
        toneClass
      )}
    >
      <img
        src={icon}
        alt={label}
        className="h-4 w-4 object-contain opacity-90"
        draggable={false}
      />
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
      className={cn(
        "relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border bg-black/55",
        active ? cfg.border : "border-white/10"
      )}
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
          <div className="neutron-orbit-a absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/35" />
          </div>
          <div className="neutron-orbit-b absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-1 w-1 rounded-full bg-white/25" />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
          dot,
          active && "nucleus-jitter"
        )}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent" />
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
    tier === "BULLION"
      ? "bg-emerald-400"
      : tier === "HELLION"
      ? "bg-red-400"
      : "bg-purple-400"

  return (
    <div
      className={cn(
        "rounded-2xl border bg-black/55 px-4 py-3 flex items-center justify-between gap-3",
        muted && "opacity-55",
        highlight ? "border-white/15" : "border-white/10"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-10 w-10 rounded-2xl border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden">
          <div className={cn("h-2.5 w-2.5 rounded-full", dot)} />
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
        <div className="mt-1 text-[10px] tracking-widest text-white/45">
          {highlight ? "Primary" : "Asset"}
        </div>
      </div>
    </div>
  )
}

function PhantomWalletMock({
  tier,
  usd = 336.42,
}: {
  tier: Profile
  usd?: number
}) {
  const cfg = PROFILES[tier]

  const accent =
    tier === "BULLION"
      ? {
          dot: "bg-emerald-400",
          ring: "border-emerald-300/25",
          chip: "bg-emerald-300/[0.08]",
        }
      : tier === "HELLION"
      ? {
          dot: "bg-red-400",
          ring: "border-red-300/25",
          chip: "bg-red-400/[0.08]",
        }
      : {
          dot: "bg-purple-400",
          ring: "border-purple-300/25",
          chip: "bg-purple-500/[0.10]",
        }

  const address = "7xK2…Qp9a"
  const usdc = usd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div
      className="rounded-[28px] border border-white/10 bg-black/55 overflow-hidden"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.05), 0 28px 120px rgba(0,0,0,0.55)",
      }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-9 w-9 rounded-2xl border bg-black/60 flex items-center justify-center",
                accent.ring
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", accent.dot)} />
            </div>

            <div className="min-w-0">
              <div className="text-[11px] tracking-widest text-white/80 font-semibold">
                WALLET
              </div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/70">
                {address}
                <span className="h-1 w-1 rounded-full bg-white/20" />
                SOLANA
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] tracking-widest text-white/45">
              TOTAL BALANCE
            </div>
            <div className="mt-1 text-[22px] font-semibold text-white">
              ${usdc}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="rounded-2xl border border-white/10 bg-black/55 px-3 py-3 text-[10px] tracking-widest text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition">
            Receive
          </button>
          <button className="rounded-2xl border border-white/10 bg-black/55 px-3 py-3 text-[10px] tracking-widest text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition">
            Send
          </button>
          <button
            className={cn(
              "rounded-2xl border px-3 py-3 text-[10px] tracking-widest text-white/90 hover:border-white/30 transition",
              accent.ring,
              accent.chip
            )}
          >
            Swap
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.26em] text-white/45">
            ASSETS
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-widest bg-black/55",
              cfg.border
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", accent.dot)} />
            {tier}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <AssetRow
            name="USD Coin"
            symbol="USDC"
            sub="Solana"
            amount={`$${usdc}`}
            highlight
            tier={tier}
          />
          <AssetRow
            name="Solana"
            symbol="SOL"
            sub="Network fees"
            amount="$12.84"
            tier={tier}
          />
          <AssetRow
            name="Intellion Credits"
            symbol="ION"
            sub="Platform"
            amount="$0.00"
            tier={tier}
            muted
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="text-[10px] tracking-widest text-white/50">CARD</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[12px] tracking-widest text-white/80">
              Bullion Mastercard
            </div>
            <div className="text-[10px] tracking-widest text-white/55">
              •••• 6X69
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-white/45">
              Available to spend
            </div>
            <div className="text-[12px] font-semibold text-white">${usdc}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepCard({
  n,
  title,
  text,
}: {
  n: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/55 p-5 md:p-6">
      <div className="text-[10px] tracking-[0.26em] text-white/45">STEP {n}</div>
      <div className="mt-3 text-lg font-semibold text-white/90">{title}</div>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">{text}</p>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Profile>("BULLION")
  const active = PROFILES[selected]

  const headerGlow = useMemo(() => {
    return `radial-gradient(1200px 360px at 12% 0%, rgba(0,255,160,0.08), ${active.accentGlow}, rgba(0,0,0,0.88))`
  }, [active.accentGlow])

  const walletUsd =
    selected === "BULLION" ? 336.42 : selected === "HELLION" ? 1240.0 : 5980.5

  const goTier = (tier: Profile) => {
    if (tier === "BULLION") {
      router.push(`/login?tier=BULLION`)
      return
    }
    router.push(`/pay?tier=${encodeURIComponent(tier)}`)
  }

  const goTraderDirect = () => {
    router.push("/trader-funding")
  }

  const goDepositCrypto = () => {
    router.push(`/login?next=${encodeURIComponent("/wallet")}`)
  }

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* BACKGROUND */}
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
        className="fixed top-0 inset-x-0 z-30 h-16 md:h-14 px-4 md:px-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-black/40 supports-[backdrop-filter]:bg-black/30"
        style={{ background: headerGlow }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(900px 280px at 20% 0%, ${active.accentGlow}, rgba(0,0,0,0) 62%)`,
          }}
        />

        <div className="relative flex items-center gap-3 min-w-0">
          <TierMark tier={selected} active />
          <div className="min-w-0">
            <div className="tracking-[0.18em] text-[11px] font-semibold text-white/85 truncate">
              STRATEGY LAB
            </div>
            <div className="text-[10px] tracking-[0.18em] md:tracking-widest text-white/50 truncate">
              ACTIVE TIER ·{" "}
              <span className={cn(active.text, "font-semibold")}>{selected}</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
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
      <section className="relative z-10 pt-24 md:pt-28 px-4 md:px-6 pb-20">
        <div className="mx-auto w-full max-w-6xl">
          {/* HERO */}
          <div className="text-center">

            <div className="mt-8 flex items-center justify-center relative">
              <div
                className="pointer-events-none absolute -top-10 h-40 w-40 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(34,197,94,0.20), rgba(0,0,0,0) 60%)",
                }}
              />
              <div
                className="relative rounded-[30px] border border-emerald-300/20 bg-black/55 px-6 py-5"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.05), 0 0 160px rgba(34,197,94,0.20)",
                }}
              >
                <img
                  src="/oglog.png"
                  alt="Bullions"
                  className="h-12 md:h-14 w-auto object-contain opacity-95"
                  draggable={false}
                />
              </div>
            </div>

            <h1 className="mt-8 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
              Grow your capital
              <span className={cn("block mt-3", active.text)}>
                Non a fully human system              </span>
            </h1>

            <p className="mt-6 text-[16px] text-white/75 max-w-2xl mx-auto leading-relaxed">
              Designed for controlled execution environments.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => goTier(selected)}
                className={cn(
                  "w-full sm:w-auto rounded-2xl border px-8 py-5 text-sm font-semibold tracking-widest transition-all",
                  active.border,
                  "bg-black/70 hover:bg-white/[0.06] hover:border-white/30"
                )}
                style={{
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 140px ${active.accentGlow}`,
                }}
              >
                ENTER WITH {selected} ▸

                <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">
                  {selected === "BULLION"
                    ? "$100 minimum · $300 recommended"
                    : selected === "HELLION"
                    ? "connect MT5 accounts"
                    : "funded routing access"}
                </div>
              </button>

              <button
                onClick={goTraderDirect}
                className="w-full sm:w-auto rounded-2xl border border-violet-400/30 bg-violet-500/10 px-7 py-5 text-sm font-semibold tracking-widest text-violet-100 hover:bg-violet-500/18 hover:border-violet-300/45 transition-all duration-300"
                style={{
                  boxShadow: "0 0 60px rgba(168,85,247,0.16)",
                }}
              >
                I'M A TRADER ▸

                <div className="mt-1 text-[10px] tracking-widest text-violet-100/70 font-normal">
                  skip onboarding
                </div>
              </button>
            </div>

            <div className="mt-6 text-[10px] tracking-widest text-white/40">

            </div>
          </div>

          {/* ENTRY STEPS */}
<div className="mx-auto mb-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
  {[
    { label: "CONNECT", icon: "◉" },
    { label: "SELECT", icon: "◆" },
    { label: "FUND", icon: "▲" },
    { label: "LAUNCH", icon: "✦" },
  ].map((item, i) => (
    <div
      key={item.label}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 px-4 py-4 text-center"
      style={{
        boxShadow:
          i === 0
            ? "0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(34,197,94,0.14)"
            : "0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />
      <div
        className={[
          "mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border text-base",
          i === 0
            ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
            : "border-white/10 bg-black/60 text-white/75",
        ].join(" ")}
      >
        {item.icon}
      </div>

      <div className="mt-3 text-[10px] tracking-[0.22em] text-white/55">
        STEP {i + 1}
      </div>
      <div className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-white/90">
        {item.label}
      </div>
    </div>
  ))}
</div>


          {/* HOW IT WORKS */}
          <div className="mt-16">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.26em] text-white/45">
                HOW IT WORKS
              </div>
              <div className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-white/90">
                Three simple steps.
              </div>
              <p className="mt-4 text-[14px] text-white/75 max-w-3xl mx-auto leading-relaxed">
                Start simple. Fund your wallet. Enter the lab.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <StepCard
                n="01"
                title="Choose your tier"
                text="Pick the path that matches your goals: starter routing, MT5 scaling, or funded capital."
              />
              <StepCard
                n="02"
                title="Fund your wallet"
                text="Deposit crypto to your balance. The same balance powers routing and card spending."
              />
              <StepCard
                n="03"
                title="Enter the lab"
                text="Activate your path, monitor activity, and manage everything from your dashboard."
              />
            </div>
          </div>



{/* TIERS */}
<div className="mt-16">
  <div className="text-center">
    <div className="text-[10px] tracking-[0.26em] text-white/45">
      CHOOSE YOUR TIER
    </div>

    <div className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-white/90">
      Pick the setup that fits you.
    </div>

    <p className="mt-4 text-[14px] text-white/75 max-w-3xl mx-auto leading-relaxed">
      Start simple with Bullion, scale through MT5 with Hellion, or use Torion
      to prepare for funded-account style challenges.
    </p>
  </div>

  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
    {(Object.keys(PROFILES) as Profile[]).map((p) => {
      const cfg = PROFILES[p]
      const isActive = selected === p

      const eyebrow =
        p === "BULLION"
          ? "BEST FOR STARTING FAST"
          : p === "HELLION"
          ? "BEST FOR MT5 SCALING"
          : "BEST FOR FUNDED CHALLENGES"

      const summary =
        p === "BULLION"
          ? "Fastest way to enter Strategy Lab with low capital and built-in guardrails."
          : p === "HELLION"
          ? "Connect MT5 accounts and scale execution power across multiple accounts."
          : "Built for traders preparing for funded-account style challenges similar to FTMO."

      const stat1Label = "ENTRY"
      const stat1Value =
        p === "BULLION" ? "Easy" : p === "HELLION" ? "MT5" : "Challenge"

      const stat2Label = "CAPITAL"
      const stat2Value =
        p === "BULLION" ? "Low" : p === "HELLION" ? "Medium" : "Qualified"

      const stat3Label =
        p === "BULLION" ? "SPEED" : p === "HELLION" ? "POWER" : "STYLE"

      const stat3Value =
        p === "BULLION"
          ? "Fast"
          : p === "HELLION"
          ? "High"
          : "Selective"

      const featureTitle =
        p === "BULLION"
          ? "RECOMMENDED START"
          : p === "HELLION"
          ? "SCALING MODE"
          : "CHALLENGE MODE"

      const featureValue =
        p === "BULLION"
          ? "$300+"
          : p === "HELLION"
          ? "MT5"
          : "FTMO-LIKE"

      const featureBadge =
        p === "BULLION"
          ? "MOST POPULAR"
          : p === "HELLION"
          ? "POWER"
          : "FUNDED PATH"

      const featureText =
        p === "BULLION"
          ? "Best balance between entry cost, routing efficiency, and execution consistency."
          : p === "HELLION"
          ? "Designed for traders who want more execution power through connected MT5 accounts."
          : "Built for traders targeting funded-account style evaluations and challenge-based scaling."

      const secondaryTitle =
        p === "BULLION"
          ? "MINIMUM ENTRY"
          : p === "HELLION"
          ? "ACCOUNT FLOW"
          : "TARGET USE"

      const secondaryValue =
        p === "BULLION"
          ? "$100"
          : p === "HELLION"
          ? "3–5"
          : "$400K"

      const secondaryText =
        p === "BULLION"
          ? "Quick access to Strategy Lab starter routing."
          : p === "HELLION"
          ? "Multi-account routing designed for active MT5 traders."
          : "Up to $400K routing capacity structure for funded-account style progression."

      return (
        <div
          key={p}
          role="button"
          tabIndex={0}
          onClick={() => setSelected(p)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSelected(p)
          }}
          className={cn(
            "group relative overflow-hidden rounded-[30px] border bg-black/60 text-left cursor-pointer select-none transition-all duration-300 hover:bg-white/[0.04]",
            isActive ? cfg.border : "border-white/10"
          )}
          style={{
            boxShadow: isActive
              ? `0 0 0 1px rgba(255,255,255,0.06), 0 0 140px ${cfg.accentGlow}`
              : "0 0 0 1px rgba(255,255,255,0.03)",
            transform: isActive ? "translateY(-2px)" : "translateY(0px)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
            style={{
              background: `radial-gradient(500px 120px at 50% 0%, ${cfg.accentGlow}, rgba(0,0,0,0))`,
            }}
          />

          <div className="relative flex h-full flex-col p-6">
            {/* top */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] tracking-[0.26em] text-white/40">
                    {eyebrow}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <TierMark tier={p} active={isActive} />

                    <div className="min-w-0">
                      <div
                        className={cn(
                          "text-[18px] font-semibold tracking-[0.20em]",
                          cfg.text
                        )}
                      >
                        {cfg.title}
                      </div>

                      <div className="mt-1 text-[11px] tracking-widest text-white/70">
                        {cfg.priceLabel}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-[9px] tracking-[0.20em]",
                    p === "BULLION"
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                      : p === "HELLION"
                      ? "border-red-300/20 bg-red-400/[0.10] text-red-100"
                      : "border-purple-300/20 bg-purple-500/[0.12] text-purple-100"
                  )}
                >
                  {p === "BULLION"
                    ? "FAST ENTRY"
                    : p === "HELLION"
                    ? "MT5 POWER"
                    : "FUNDED PATH"}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <div className="text-[14px] leading-relaxed text-white/84 max-w-[34ch]">
                  {summary}
                </div>
                {cfg.pill ? <Pill {...cfg.pill} /> : null}
              </div>

              {/* stats */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/55 p-3">
                  <div className="text-[9px] tracking-[0.24em] text-white/40">
                    {stat1Label}
                  </div>
                  <div className={cn("mt-1 text-[14px] font-semibold", cfg.text)}>
                    {stat1Value}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/55 p-3">
                  <div className="text-[9px] tracking-[0.24em] text-white/40">
                    {stat2Label}
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-white/85">
                    {stat2Value}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/55 p-3">
                  <div className="text-[9px] tracking-[0.24em] text-white/40">
                    {stat3Label}
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-white/85">
                    {stat3Value}
                  </div>
                </div>
              </div>

              {/* primary feature card */}
              <div
                className={cn(
                  "mt-6 relative overflow-hidden rounded-[26px] border px-5 py-5",
                  p === "BULLION"
                    ? "border-emerald-300/30 bg-emerald-400/[0.08]"
                    : p === "HELLION"
                    ? "border-red-300/20 bg-red-400/[0.08]"
                    : "border-purple-300/20 bg-purple-500/[0.08]"
                )}
                style={{
                  boxShadow:
                    p === "BULLION"
                      ? "0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(34,197,94,0.18)"
                      : p === "HELLION"
                      ? "0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(239,68,68,0.14)"
                      : "0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(168,85,247,0.14)",
                }}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent",
                    p === "BULLION"
                      ? "from-emerald-300/[0.12]"
                      : p === "HELLION"
                      ? "from-red-300/[0.10]"
                      : "from-purple-300/[0.10]"
                  )}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[10px] tracking-[0.28em]",
                        p === "BULLION"
                          ? "text-emerald-200/80"
                          : p === "HELLION"
                          ? "text-red-100/80"
                          : "text-purple-100/80"
                      )}
                    >
                      {featureTitle}
                    </div>

                    <div className={cn("mt-2 text-4xl font-semibold leading-none", cfg.text)}>
                      {featureValue}
                    </div>

                    <div className="mt-3 text-[12px] leading-relaxed text-white/72 max-w-[24ch]">
                      {featureText}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[9px] font-semibold tracking-[0.22em]",
                      p === "BULLION"
                        ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                        : p === "HELLION"
                        ? "border-red-300/20 bg-red-400/[0.12] text-red-100"
                        : "border-purple-300/20 bg-purple-500/[0.14] text-purple-100"
                    )}
                  >
                    {featureBadge}
                  </div>
                </div>
              </div>

              {/* secondary feature card */}
              <div
                className="mt-3 relative overflow-hidden rounded-[22px] border border-white/10 bg-black/60 px-5 py-5"
                style={{
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                <div className="text-[10px] tracking-[0.26em] text-white/45">
                  {secondaryTitle}
                </div>

                <div className="mt-2 text-2xl font-semibold text-white/85">
                  {secondaryValue}
                </div>

                <div className="mt-1 text-[12px] leading-relaxed text-white/55">
                  {secondaryText}
                </div>
              </div>

              {/* bullets */}
              <div className="mt-6 grid gap-2.5">
                {cfg.bullets.slice(0, 4).map((b) => (
                  <div
                    key={b}
                    className="flex items-start gap-3 text-[12px] text-white/72"
                  >
                    <span
                      className={cn(
                        "mt-[7px] h-2 w-2 shrink-0 rounded-full",
                        p === "BULLION"
                          ? "bg-emerald-300/70"
                          : p === "HELLION"
                          ? "bg-red-300/70"
                          : "bg-purple-300/70"
                      )}
                    />
                    <span className="leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA bottom aligned */}
            <div className="mt-7">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goTier(p)
                }}
                className={cn(
                  "w-full rounded-[22px] border px-5 py-4 text-[12px] font-semibold tracking-[0.18em] transition-all duration-300",
                  p === "BULLION"
                    ? "border-emerald-300/30 bg-emerald-400/[0.08] text-emerald-50 hover:bg-emerald-400/[0.14] hover:border-emerald-300/45"
                    : p === "HELLION"
                    ? "border-red-300/20 bg-red-400/[0.08] text-red-50 hover:bg-red-400/[0.14] hover:border-red-300/35"
                    : "border-purple-300/20 bg-purple-500/[0.08] text-purple-50 hover:bg-purple-500/[0.14] hover:border-purple-300/35"
                )}
                style={{
                  boxShadow:
                    p === "BULLION"
                      ? "0 0 60px rgba(34,197,94,0.14)"
                      : p === "HELLION"
                      ? "0 0 60px rgba(239,68,68,0.12)"
                      : "0 0 60px rgba(168,85,247,0.12)",
                }}
              >
                {p === "BULLION"
                  ? "ENTER BULLION ▸"
                  : p === "HELLION"
                  ? "UNLOCK HELLION ▸"
                  : "UNLOCK TORION ▸"}
                <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">
                  {p === "BULLION" ? "login → enter" : "checkout → unlock"}
                </div>
              </button>

              {p === "BULLION" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push("/enterlab/email")
                  }}
                  className="mt-3 w-full rounded-[22px] border border-red-400/35 bg-red-500/10 px-5 py-4 text-[12px] font-semibold tracking-[0.18em] text-red-100 hover:bg-red-500/20 hover:border-red-400/60 transition-all duration-300"
                  style={{
                    boxShadow: "0 0 60px rgba(239,68,68,0.15)",
                  }}
                >
                  EMAIL REGISTER BONUS▸
                  <div className="mt-1 text-[10px] tracking-widest text-red-100/70 font-normal">
                    deposit → unlock bonus routing credit
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )
    })}
  </div>
</div>



{/* FLOW + WALLET */}
<div className="mt-16 relative">
  {/* background glow rings */}
  <div
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
    style={{
      width: 560,
      height: 560,
      background: `radial-gradient(circle at 50% 50%, ${active.accentGlow}, rgba(0,0,0,0) 60%)`,
      opacity: 0.95,
    }}
  />

  <div
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
    style={{ width: 520, height: 520 }}
  />

  <div
    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
    style={{ width: 610, height: 610 }}
  />

  {/* GRID */}
  <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">

    {/* LEFT PANEL */}
    <div
      className="rounded-[32px] border border-white/10 bg-black/60 p-6 md:p-8"
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 120px ${active.accentGlow}`,
      }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.26em] text-white/45">
            EXECUTION MODE
          </div>

          <div className="mt-3 text-2xl font-semibold tracking-tight text-white/90">
            Select how the engine executes for you.
          </div>

          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/68">
            Choose one mode. The system adapts routing, scaling behavior and execution profile automatically.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] tracking-[0.22em] text-white/75">
          INTELLION CORE
        </div>
      </div>

      {/* MODE SELECTOR */}
      <div className="mt-8 grid gap-4">

        {/* BULLION */}
        <button
          type="button"
          onClick={() => setSelected("BULLION")}
          className={cn(
            "group w-full rounded-[24px] border px-5 py-5 text-left transition-all",
            selected === "BULLION"
              ? "border-emerald-300/30 bg-emerald-400/[0.08]"
              : "border-white/10 bg-black/45 hover:bg-white/[0.04] hover:border-white/20"
          )}
        >
          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-3">
                <TierMark tier="BULLION" active={selected === "BULLION"} />

                <div>
                  <div className="text-[11px] tracking-[0.24em] text-emerald-200/75">
                    STARTER MODE
                  </div>

                  <div className="text-[18px] font-semibold tracking-[0.18em] text-emerald-100">
                    BULLION
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[14px] text-white/78 max-w-[42ch]">
                Fastest entry into Strategy Lab. Guardrails enabled. Optimized execution begins from $300+ allocation.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] tracking-widest">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                  $100 minimum
                </span>

                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                  $300+ optimized
                </span>

                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/65">
                  beginner friendly
                </span>
              </div>
            </div>

            <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[9px] tracking-[0.22em] text-emerald-100">
              RECOMMENDED
            </div>

          </div>
        </button>


        {/* HELLION */}
        <button
          type="button"
          onClick={() => setSelected("HELLION")}
          className={cn(
            "group w-full rounded-[24px] border px-5 py-5 text-left transition-all",
            selected === "HELLION"
              ? "border-red-300/25 bg-red-400/[0.08]"
              : "border-white/10 bg-black/45 hover:bg-white/[0.04]"
          )}
        >
          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-3">
                <TierMark tier="HELLION" active={selected === "HELLION"} />

                <div>
                  <div className="text-[11px] tracking-[0.24em] text-red-100/75">
                    MT5 MODE
                  </div>

                  <div className="text-[18px] font-semibold tracking-[0.18em] text-red-100">
                    HELLION
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[14px] text-white/78 max-w-[42ch]">
                Connect MetaTrader accounts and scale execution across multiple environments simultaneously.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] tracking-widest">
                <span className="rounded-full border border-red-300/20 bg-red-400/[0.10] px-3 py-1 text-red-100">
                  multi-account
                </span>

                <span className="rounded-full border border-red-300/20 bg-red-400/[0.10] px-3 py-1 text-red-100">
                  MT5 connected
                </span>

                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/65">
                  scaling mode
                </span>
              </div>
            </div>

            <div className="rounded-full border border-red-300/20 bg-red-400/[0.10] px-3 py-1 text-[9px] tracking-[0.22em] text-red-100">
              SCALING
            </div>

          </div>
        </button>


        {/* TORION */}
        <button
          type="button"
          onClick={() => setSelected("TORION")}
          className={cn(
            "group w-full rounded-[24px] border px-5 py-5 text-left transition-all",
            selected === "TORION"
              ? "border-purple-300/20 bg-purple-500/[0.08]"
              : "border-white/10 bg-black/45 hover:bg-white/[0.04]"
          )}
        >
          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-3">
                <TierMark tier="TORION" active={selected === "TORION"} />

                <div>
                  <div className="text-[11px] tracking-[0.24em] text-purple-100/75">
                    FUNDED MODE
                  </div>

                  <div className="text-[18px] font-semibold tracking-[0.18em] text-purple-100">
                    TORION
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[14px] text-white/78 max-w-[42ch]">
                Designed for traders preparing funded-account challenges similar to FTMO. Selective execution profile.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] tracking-widest">
                <span className="rounded-full border border-purple-300/20 bg-purple-500/[0.12] px-3 py-1 text-purple-100">
                  FTMO-style path
                </span>

                <span className="rounded-full border border-purple-300/20 bg-purple-500/[0.12] px-3 py-1 text-purple-100">
                  quality-first execution
                </span>

                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/65">
                  funded progression
                </span>
              </div>
            </div>

            <div className="rounded-full border border-purple-300/20 bg-purple-500/[0.14] px-3 py-1 text-[9px] tracking-[0.22em] text-purple-100">
              CHALLENGE
            </div>

          </div>
        </button>

      </div>
    </div>


    {/* RIGHT PANEL WALLET */}
    <div className="w-full">

      <div className="flex items-center justify-between">
        <div className="text-[12px] tracking-widest text-white/85 font-semibold">
          Execution wallet
        </div>

        <TierMark tier={selected} />
      </div>

      <div className="mt-4">
        <PhantomWalletMock tier={selected} usd={walletUsd} />
      </div>

      <button
        onClick={goDepositCrypto}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-black/45 px-5 py-4 text-[12px] font-semibold tracking-widest text-white/90 hover:bg-white/[0.06] hover:border-white/25 transition"
      >
        OPEN WALLET ▸

        <div className="mt-1 text-[10px] tracking-widest text-white/55 font-normal">
          login → wallet
        </div>
      </button>

    </div>


              <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(168,85,247,0.55),rgba(59,130,246,0.45),rgba(34,197,94,0.18))]">
                <div
                  className="rounded-3xl border border-white/10 bg-black/70 p-7 md:p-8 relative overflow-hidden"
                  style={{ boxShadow: "0 0 160px rgba(255,255,255,0.06)" }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
                  <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-purple-400/[0.06] blur-3xl" />

                  <div className="relative">
                    <div className="text-[10px] tracking-[0.26em] text-white/45">
                      CARD PREVIEW
                    </div>

                    <div
                      className="mt-5 rounded-[26px] border border-white/12 bg-black/80 p-6"
                      style={{
                        boxShadow:
                          "0 0 0 1px rgba(255,255,255,0.04), 0 20px 80px rgba(0,0,0,0.55)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] tracking-widest text-white/60">
                          BULLION MASTERCARD
                        </div>
                        <div className="text-[10px] tracking-widest text-white/45">
                          USDC
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="text-[10px] tracking-widest text-white/45">
                          AVAILABLE TO SPEND
                        </div>
                        <div className="mt-1 text-4xl font-semibold text-white">
                          1,240
                        </div>
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
                      Same balance. Two uses:{" "}
                      <span className="text-white/85 font-semibold">routing</span> +{" "}
                      <span className="text-white/85 font-semibold">spending</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOCIAL */}
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
                  <a
                    href="/terms"
                    className="text-white/55 hover:text-white/85 underline underline-offset-4"
                  >
                    TERMS
                  </a>
                  <a
                    href="/privacy"
                    className="text-white/55 hover:text-white/85 underline underline-offset-4"
                  >
                    PRIVACY
                  </a>
                  <a
                    href="/legal"
                    className="text-white/55 hover:text-white/85 underline underline-offset-4"
                  >
                    LEGAL
                  </a>
                  <span className="text-white/25">·</span>
                  <span className="text-white/45">Execution environment only</span>
                  <span className="text-white/25">·</span>
                  <span className="text-white/45">Risk disclosure applies</span>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-white/40">
                © {new Date().getFullYear()} Bullion Labs. Trading and digital assets involve
                risk and may result in total loss.
              </div>
            </div>
          </footer>
        </div>
      </section>

      {/* ANIMATIONS */}
      <style jsx global>{`
        @keyframes neutronOrbitA {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(12px);
            opacity: 0.25;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(12px);
            opacity: 0.25;
          }
        }

        @keyframes neutronOrbitB {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(9px);
            opacity: 0.18;
          }
          50% {
            opacity: 0.38;
          }
          100% {
            transform: translate(-50%, -50%) rotate(-360deg) translateX(9px);
            opacity: 0.18;
          }
        }

        @keyframes nucleusJitter {
          0% {
            transform: translate(-50%, -50%) translate(0px, 0px) scale(1);
            opacity: 0.98;
          }
          18% {
            transform: translate(-50%, -50%) translate(0.3px, -0.2px) scale(1.01);
          }
          36% {
            transform: translate(-50%, -50%) translate(-0.25px, 0.15px) scale(0.995);
            opacity: 0.95;
          }
          54% {
            transform: translate(-50%, -50%) translate(0.2px, 0.25px) scale(1.008);
          }
          72% {
            transform: translate(-50%, -50%) translate(-0.15px, -0.25px) scale(1);
            opacity: 0.98;
          }
          100% {
            transform: translate(-50%, -50%) translate(0px, 0px) scale(1);
            opacity: 0.98;
          }
        }

        .neutron-orbit-a {
          animation: neutronOrbitA 2.9s linear infinite;
          will-change: transform, opacity;
        }

        .neutron-orbit-b {
          animation: neutronOrbitB 3.7s linear infinite;
          will-change: transform, opacity;
        }

        .nucleus-jitter {
          animation: nucleusJitter 1.35s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </main>
  )
}