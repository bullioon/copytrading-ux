import Link from "next/link";

const FEATURES = [
  "Automatic mirror-position deployment",
  "Drawdown buffering during adverse moves",
  "Synchronized exit logic",
  "Equity stabilization layer",
  "Built for gold, indices, crypto and funded environments",
  "No manual hedge management required",
];

const STEPS = [
  {
    step: "01",
    title: "You place the main trade",
    desc: "Example: SELL 1.00 lot. HELIX monitors the position immediately after execution.",
  },
  {
    step: "02",
    title: "HELIX deploys mirror protection",
    desc: "A synchronized counter-position is opened to reduce drawdown pressure if price moves against the original trade.",
  },
  {
    step: "03",
    title: "The engine manages both sides",
    desc: "If price returns to your direction, the mirror closes. If volatility expands, the mirror offsets part of floating loss.",
  },
  {
    step: "04",
    title: "Your equity stays more controlled",
    desc: "Instead of taking full impact instantly, exposure becomes more stable and survivable.",
  },
];

const USE_CASES = [
  "XAUUSD / Gold scalping",
  "NASDAQ / US30 volatility sessions",
  "BTC trend swings",
  "Funded account preservation",
];

export default function HelixPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.08),transparent_22%),linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:34px_34px]" />

        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/65 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
                <span className="text-sm text-emerald-300">◈</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                  Execution Protection Module
                </div>
                <div className="text-sm font-semibold tracking-[0.14em]">
                  HELIX MIRROR ENGINE™
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Back
              </Link>
              <Link
                href="/pay?tier=HELLION"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-5 py-2 text-sm font-medium text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.12)] transition hover:bg-emerald-400/20"
              >
                Activate Now
              </Link>
            </div>
          </div>
        </header>

        <section className="relative mx-auto max-w-7xl px-6 pb-18 pt-14 md:pb-24 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-emerald-200/90">
                <span>●</span>
                AI-Assisted Trade Protection
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.04em] text-white md:text-6xl">
                Protect the trade <br className="hidden md:block" />
                <span className="text-emerald-300">
                  without killing the opportunity.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                HELIX Mirror Engine automatically deploys a synchronized mirror
                position when your trade moves against you, helping buffer
                drawdown, stabilize equity and preserve trade survival time
                inside volatile conditions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/pay?product=helix"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-6 py-4 text-sm font-medium text-emerald-100 shadow-[0_0_50px_rgba(16,185,129,0.14)] transition hover:bg-emerald-400/20"
                >
                  BUY HELIX NOW
                  <span>→</span>
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Mirror Protection", "Automated"],
                  ["Execution Layer", "Institutional"],
                  ["Setup", "Instant"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {label}
                    </div>
                    <div className="mt-2 text-lg font-medium text-white">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[32px] bg-emerald-400/10 blur-3xl" />
              <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_80px_rgba(16,185,129,0.08)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                      Live Protection Simulation
                    </div>
                    <div className="mt-1 text-lg font-medium">
                      HELIX Mirror Logic
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                    Active
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Primary Trade
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-xl font-semibold">
                          SELL 1.00 LOT
                        </div>
                        <div className="mt-1 text-sm text-white/55">
                          XAUUSD · Main directional exposure
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">
                          Floating PnL
                        </div>
                        <div className="mt-1 text-lg font-medium text-red-300">
                          - $186.40
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/45">
                      HELIX deploys mirror
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Mirror Position
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-xl font-semibold text-emerald-200">
                          BUY 1.00 LOT
                        </div>
                        <div className="mt-1 text-sm text-white/55">
                          Counter-position protection layer
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">
                          Compensation
                        </div>
                        <div className="mt-1 text-lg font-medium text-emerald-300">
                          + $124.10
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Equity Pressure
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        Reduced
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Engine State
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-300">
                        Stabilizing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6">
          <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-3 md:p-5">
            {[
              {
                title: "Mirror-position protection",
                desc: "Deploys a synchronized counter-trade to reduce drawdown intensity.",
              },
              {
                title: "Synchronized exit logic",
                desc: "Protection closes automatically based on original trade behavior.",
              },
              {
                title: "Built for volatile environments",
                desc: "Designed for fast-moving assets where equity survival matters.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/8 bg-black/30 p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  ◈
                </div>
                <div className="text-lg font-medium">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mb-10">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
              Process
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              How HELIX works
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
              This is not random hedging. This is a structured protection layer
              designed to stabilize exposure while preserving the original profit
              opportunity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300/80">
                  {item.step}
                </div>
                <div className="mt-3 text-xl font-medium">{item.title}</div>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 md:pb-28">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
                Why traders buy it
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Most trades do not fail because of direction.
              </h3>
              <p className="mt-3 text-base leading-7 text-white/62">
                They fail because equity gets hit too hard before the move has
                time to recover. HELIX helps absorb part of that pressure.
              </p>

              <div className="mt-6 space-y-3">
                {FEATURES.map((item) => (
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

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/80">
                Best environments
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                Built for violent price conditions
              </h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {USE_CASES.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-black/20 p-5"
                  >
                    <div className="text-base font-medium text-white">{item}</div>
                    <div className="mt-2 text-sm leading-6 text-white/55">
                      Protection logic becomes especially valuable when
                      volatility expands quickly.
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/80">
                  Positioning
                </div>
                <div className="mt-2 text-lg font-medium text-white">
                  Not a signal service. Not a promise. A protection layer.
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  HELIX is sold as execution infrastructure designed to improve
                  exposure control during adverse price movement.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-[32px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(255,255,255,0.03))] p-8 shadow-[0_0_100px_rgba(16,185,129,0.08)] md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_25%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-100/80">
                  Activation
                </div>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                  Upgrade to protected execution
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
                  Instant activation. Payment handled through your existing QR
                  checkout flow. Once unlocked, the engine can be attached to
                  supported execution environments.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Product
                    </div>
                    <div className="mt-1 text-lg font-medium">
                      HELIX Mirror Engine™
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Access
                    </div>
                    <div className="mt-1 text-lg font-medium">
                      Instant unlock
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Checkout
                    </div>
                    <div className="mt-1 text-lg font-medium">QR payment</div>
                  </div>
                </div>
              </div>

              <div className="relative min-w-[300px] rounded-[28px] border border-white/12 bg-black/35 p-6 backdrop-blur-xl">
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Premium Module
                </div>
                <div className="mt-3 text-5xl font-semibold tracking-[-0.05em]">
                  $149
                </div>
                <div className="mt-2 text-sm text-white/55">
                  One-time activation
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    "Mirror-protection logic",
                    "Automatic synchronized exits",
                    "Drawdown buffering layer",
                    "Institutional-style execution module",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white/78">
                      <span className="text-emerald-300">✔</span>
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  href="/pay?product=helix"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-5 py-4 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20"
                >
                  PAY WITH QR NOW
                  <span>→</span>
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-white/42">
                  Payment opens your existing QR checkout flow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}