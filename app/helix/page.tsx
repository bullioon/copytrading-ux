import Link from "next/link"

const painPoints = [
  "Good entries still fail when drawdown hits too hard before rotation.",
  "Most traders close too early because equity pressure becomes psychologically unmanageable.",
  "Volatile markets punish exposure long before the original thesis has time to play out.",
]

const mechanism = [
  {
    step: "01",
    title: "Primary trade opens",
    desc: "You execute your main position as usual. HELIX tracks the exposure from the first second.",
  },
  {
    step: "02",
    title: "Mirror layer deploys",
    desc: "If price pushes against the trade, HELIX activates a synchronized counter-position to reduce pressure.",
  },
  {
    step: "03",
    title: "Floating loss gets buffered",
    desc: "Instead of absorbing the full hit instantly, the protection layer helps offset part of the drawdown.",
  },
  {
    step: "04",
    title: "Original opportunity stays alive",
    desc: "If price rotates back, the mirror layer can exit while the main trade keeps its directional objective.",
  },
]

const bullets = [
  "Mirror-position deployment",
  "Adaptive drawdown buffering",
  "Reduced equity shock",
  "Automated protection logic",
  "Built for high-volatility environments",
  "Fast QR activation inside Bullions",
]

const objections = [
  {
    q: "Is this a signal service?",
    a: "No. HELIX is not a signal provider. It is a protection layer designed to improve exposure handling after a trade is already open.",
  },
  {
    q: "Does this eliminate losses?",
    a: "No. HELIX is not positioned as a guarantee. It is designed to reduce pressure, stabilize exposure and improve trade survivability.",
  },
  {
    q: "Who is this for?",
    a: "Traders operating in fast environments like gold, indices, crypto and funded-account conditions where drawdown management matters.",
  },
]

export default function HelixPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.12),transparent_20%),linear-gradient(to_bottom,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[120px]" />

        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <span className="text-emerald-300">◈</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                  Bullions Protection Module
                </div>
                <div className="text-sm font-semibold tracking-[0.18em]">
                  HELIX MIRROR ENGINE™
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href="#how-it-works"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                How it works
              </a>
              <a
                href="#comparison"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Comparison
              </a>
              <a
                href="#faq"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                FAQ
              </a>
              <Link
                href="/helix/pay"
                className="rounded-full border border-emerald-400/20 bg-emerald-400/15 px-5 py-2 text-sm font-medium text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.12)] transition hover:bg-emerald-400/20"
              >
                Activate for $140
              </Link>
            </div>
          </div>
        </header>

        <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 md:pb-24 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-emerald-200/90">
                <span>●</span>
                AI-Assisted Drawdown Control
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] md:text-7xl">
                Most trades don’t fail
                <br />
                <span className="text-white/65">because the idea was wrong.</span>
              </h1>

              <h2 className="mt-4 max-w-4xl text-3xl font-semibold leading-[1] tracking-[-0.04em] text-emerald-300 md:text-5xl">
                They fail because the account takes the hit first.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/66 md:text-lg">
                HELIX Mirror Engine is a premium execution protection layer designed to help absorb
                part of adverse movement, stabilize equity pressure and keep the original opportunity
                alive longer inside volatile market conditions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/helix/pay"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-6 py-4 text-sm font-semibold tracking-[0.08em] text-emerald-100 shadow-[0_0_60px_rgba(16,185,129,0.16)] transition hover:bg-emerald-400/20"
                >
                  ACTIVATE HELIX NOW
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </Link>

                <a
                  href="#comparison"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  See comparison
                </a>
              </div>

              <div className="mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Category", "Protection Layer"],
                  ["Activation", "Instant"],
                  ["Checkout", "QR Payment"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</div>
                    <div className="mt-2 text-lg font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-[40px] bg-emerald-400/10 blur-3xl" />
              <div className="relative rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_90px_rgba(16,185,129,0.08)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                      Execution Preview
                    </div>
                    <div className="mt-1 text-lg font-medium">HELIX Mirror Sequence</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                    Live Logic
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Primary Position</div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-xl font-semibold">SELL 1.00 LOT</div>
                        <div className="mt-1 text-sm text-white/55">XAUUSD · Original directional trade</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">Floating PnL</div>
                        <div className="mt-1 text-lg font-medium text-red-300">- $186.40</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/45">
                      HELIX protection deployed
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Mirror Layer</div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-xl font-semibold text-emerald-200">BUY 1.00 LOT</div>
                        <div className="mt-1 text-sm text-white/55">Counter-position recovery logic</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">Compensation</div>
                        <div className="mt-1 text-lg font-medium text-emerald-300">+ $124.10</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Equity Shock</div>
                      <div className="mt-2 text-2xl font-semibold">Reduced</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Trade State</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-300">Alive</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Protection Efficiency</span>
                      <span className="font-semibold">66.5%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full bg-emerald-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-8">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
              The core problem
            </div>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              The market often returns.
              <br />
              <span className="text-white/60">The account just doesn’t survive long enough.</span>
            </h3>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {painPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/68"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="comparison" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mb-10">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
              Before vs after
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] md:text-5xl">
              Same market.
              <br />
              <span className="text-white/60">Different equity behavior.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
              HELIX changes the way pressure is absorbed. That changes decision quality, trade
              survivability and the chance of staying in the move long enough.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-red-400/15 bg-red-500/[0.03] p-6">
              <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-red-200">
                Without HELIX
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Primary Trade</span>
                  <span className="font-semibold text-red-300">SELL 1.00 LOT</span>
                </div>
                <div className="mt-4 h-40 rounded-2xl border border-white/10 bg-gradient-to-b from-transparent to-red-500/10 p-4">
                  <div className="flex h-full items-end gap-2">
                    {[18, 26, 38, 52, 68, 82, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-xl bg-red-400/60"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Drawdown Pressure</div>
                    <div className="mt-2 text-2xl font-semibold text-red-300">High</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Trader Reaction</div>
                    <div className="mt-2 text-2xl font-semibold text-white">Panic Exit</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-emerald-400/15 bg-emerald-500/[0.03] p-6">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                With HELIX
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Primary + Mirror Layer</span>
                  <span className="font-semibold text-emerald-300">Protected Execution</span>
                </div>
                <div className="mt-4 h-40 rounded-2xl border border-white/10 bg-gradient-to-b from-transparent to-emerald-500/10 p-4">
                  <div className="flex h-full items-end gap-2">
                    {[18, 22, 28, 34, 41, 48, 56].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-xl bg-emerald-300/70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Drawdown Pressure</div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-300">Buffered</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Trader Reaction</div>
                    <div className="mt-2 text-2xl font-semibold text-white">Controlled</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/64">
            The point is not fantasy. The point is this: when the account absorbs price movement more
            intelligently, the trader behaves more intelligently too. That alone changes outcomes.
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mb-10">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
              Unique mechanism
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] md:text-5xl">
              HELIX doesn’t sell hope.
              <br />
              <span className="text-white/60">It sells controlled exposure.</span>
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
              This is not random hedging and not fantasy branding. HELIX is positioned as a premium
              execution architecture for traders who understand that surviving volatility is part of the edge.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {mechanism.map((item) => (
              <div
                key={item.step}
                className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300/80">
                  {item.step}
                </div>
                <div className="mt-3 text-xl font-medium">{item.title}</div>
                <p className="mt-3 text-sm leading-7 text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
                Why it converts
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                This solves an emotional pain
                <br />
                <span className="text-white/60">and a technical pain at the same time.</span>
              </h3>

              <div className="mt-6 space-y-3">
                {bullets.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <span className="mt-0.5 text-emerald-300">✔</span>
                    <span className="text-sm text-white/78">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
                Market fit
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Built for traders exposed to violent movement
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {["Gold", "Indices", "Crypto", "Funded Accounts"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="text-base font-medium">{item}</div>
                    <div className="mt-2 text-sm leading-6 text-white/55">
                      HELIX becomes more valuable when spread, volatility and emotional pressure increase.
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
                  Positioning
                </div>
                <div className="mt-2 text-lg font-medium">
                  Not a signal service. Not a promise. A premium protection module.
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  The product is framed as infrastructure, not hype. That makes it feel more valuable,
                  more serious and easier to trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-[34px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(255,255,255,0.03))] p-8 shadow-[0_0_120px_rgba(16,185,129,0.08)] md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_25%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                  Early access pricing
                </div>

                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
                  Upgrade your execution.
                  <br />
                  Upgrade your survival rate.
                </h3>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
                  HELIX Mirror Engine is available as a one-time module activation. Payment is handled
                  through Bullions QR checkout and access is delivered automatically after confirmation.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Module", "HELIX Mirror Engine™"],
                    ["Activation", "One-time unlock"],
                    ["Delivery", "Instant after confirmation"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4"
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</div>
                      <div className="mt-1 text-lg font-medium">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-w-[320px] rounded-[30px] border border-white/12 bg-black/35 p-6 backdrop-blur-xl">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Premium Module
                </div>

                <div className="mt-3 flex items-end gap-3">
                  <div className="text-sm text-white/30 line-through">$300</div>
                  <div className="text-6xl font-semibold tracking-[-0.06em]">$140</div>
                  <div className="pb-2 text-sm text-white/45">USD</div>
                </div>

                <div className="mt-2 text-sm text-emerald-200/80">
                  Introductory activation price
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    "Mirror position logic",
                    "Drawdown pressure buffering",
                    "Institutional-style execution framing",
                    "Fast QR payment activation",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white/78">
                      <span className="text-emerald-300">✔</span>
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  href="/helix/pay"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-5 py-4 text-sm font-semibold tracking-[0.08em] text-emerald-100 transition hover:bg-emerald-400/20"
                >
                  ACTIVATE HELIX FOR $140
                  <span>→</span>
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-white/42">
                  Access is delivered automatically after payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-6 pb-24">
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">FAQ</div>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Objections handled properly.
            </h3>
          </div>

          <div className="grid gap-4">
            {objections.map((item) => (
              <div
                key={item.q}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="text-lg font-medium">{item.q}</div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[30px] border border-emerald-400/20 bg-emerald-400/8 p-8 text-center">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
              Final CTA
            </div>
            <h4 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              If you already understand the problem,
              <br />
              you already understand the value.
            </h4>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/68">
              HELIX is for traders who know that protecting exposure is just as important as finding the entry.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/helix/pay"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/15 px-8 py-4 text-sm font-semibold tracking-[0.08em] text-emerald-100 transition hover:bg-emerald-400/20"
              >
                PAY WITH QR NOW
                <span>→</span>
              </Link>

              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                See pricing again
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}