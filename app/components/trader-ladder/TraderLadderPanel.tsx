"use client"

import React, { useEffect, useMemo, useState } from "react"

type Props = {
  glow?: string
  feeUsd?: number
  onStart?: () => void
}

type LevelId = "L10" | "L25" | "L50" | "L100"

type Level = {
  id: LevelId
  title: string
  capital: number
  feeUsd: number
  profitTargetPct: number // 0.10 = 10%
  maxDdPct: number // 0.06 = 6%
  payoutSplitPct: number // 0.80 = 80%
  consistencyDays: number
  locked?: boolean
  note?: string
}

type LadderRunMock = {
  activeLevelId: LevelId
  status: "not_started" | "active" | "failed" | "passed"
  equity: number
  returnPct: number
  maxDdPct: number
  nextPayoutAtISO: string
  lastUpdateISO: string
}

function formatUsd(n: number, digits = 0) {
  return Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  })
}

function formatPct01(n: number, digits = 1) {
  return `${(Number(n || 0) * 100).toFixed(digits)}%`
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

/* ===================== MOCK DATA ===================== */

const LEVELS: Level[] = [
  {
    id: "L10",
    title: "Level 1",
    capital: 10_000,
    feeUsd: 150,
    profitTargetPct: 0.1,
    maxDdPct: 0.06,
    payoutSplitPct: 0.8,
    consistencyDays: 3,
    note: "Fast entry. Learn the discipline. Keep DD tight.",
  },
  {
    id: "L25",
    title: "Level 2",
    capital: 25_000,
    feeUsd: 0,
    profitTargetPct: 0.1,
    maxDdPct: 0.06,
    payoutSplitPct: 0.8,
    consistencyDays: 4,
    locked: true,
    note: "Unlock after Level 1 (consistency + rules).",
  },
  {
    id: "L50",
    title: "Level 3",
    capital: 50_000,
    feeUsd: 0,
    profitTargetPct: 0.1,
    maxDdPct: 0.06,
    payoutSplitPct: 0.85,
    consistencyDays: 5,
    locked: true,
    note: "Higher split. Same rules. More impact.",
  },
  {
    id: "L100",
    title: "Level 4",
    capital: 100_000,
    feeUsd: 0,
    profitTargetPct: 0.1,
    maxDdPct: 0.06,
    payoutSplitPct: 0.9,
    consistencyDays: 6,
    locked: true,
    note: "Top allocation tier. Strict execution required.",
  },
]

const RUN: LadderRunMock = {
  activeLevelId: "L10",
  status: "active",
  equity: 12_450,
  returnPct: 0.245,
  maxDdPct: 0.018,
  nextPayoutAtISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 13).toISOString(),
  lastUpdateISO: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
}

/* ===================== SMALL UI ===================== */

function Panel({
  glow,
  className,
  children,
}: {
  glow: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cx(
        "rounded-[28px] border border-white/10 bg-black/55",
        "backdrop-blur-xl",
        className
      )}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 70px ${glow}`,
      }}
    >
      {children}
    </div>
  )
}

function Chip({ children, tone = "soft" }: { children: React.ReactNode; tone?: "soft" | "strong" | "danger" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] tracking-widest",
        tone === "soft" && "border-white/10 bg-white/5 text-white/60",
        tone === "strong" && "border-white/15 bg-white/10 text-white/80",
        tone === "danger" && "border-red-500/25 bg-red-500/10 text-red-200/80"
      )}
    >
      {children}
    </span>
  )
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
      <div className="text-[10px] tracking-widest text-white/45">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-white/90 tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-white/40">{sub}</div> : null}
    </div>
  )
}

function ProgressBar({ value01 }: { value01: number }) {
  const v = clamp01(value01)
  return (
    <div className="h-2 w-full rounded-full bg-white/10">
      <div
        className="h-2 rounded-full bg-white/70"
        style={{ width: `${v * 100}%` }}
      />
    </div>
  )
}

function useCountdown(targetISO: string) {
  const targetMs = useMemo(() => {
    const ms = Date.parse(targetISO)
    return Number.isFinite(ms) ? ms : Date.now() + 1000 * 60 * 60 * 24 * 7
  }, [targetISO])

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = Math.max(0, targetMs - now)
  const totalSec = Math.floor(diff / 1000)

  const days = Math.floor(totalSec / 86400)
  const hrs = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60

  return { days, hrs, mins, secs, targetMs }
}

/* ===================== MINI CHART (SVG) ===================== */

function MiniEquitySpark({ glow }: { glow: string }) {
  const points = useMemo(() => {
    const base = 100
    const arr = [base]
    for (let i = 1; i < 42; i++) {
      const prev = arr[i - 1]
      const step = (Math.sin(i / 3) * 1.1 + Math.random() * 1.1 - 0.5) * 1.15
      arr.push(Math.max(92, Math.min(118, prev + step)))
    }
    return arr
  }, [])

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(1e-6, max - min)

  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 100
      const y = (1 - (v - min) / range) * 100
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  return (
    <div
      className="rounded-[24px] border border-white/10 bg-black/45 p-4"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 55px ${glow}` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-white/55">EQUITY SIGNAL</div>
        <div className="text-[10px] tracking-widest text-white/35">MODEL VIEW</div>
      </div>

      <div className="mt-3">
        <svg viewBox="0 0 100 100" className="w-full" style={{ height: 150 }}>
          <path d={d} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
          <path d={`${d} L 100 100 L 0 100 Z`} fill="rgba(255,255,255,0.05)" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.16)" strokeDasharray="3 3" />
          <line x1="0" y1="86" x2="100" y2="86" stroke="rgba(255,255,255,0.16)" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
        <span>Target zone</span>
        <span>Max DD buffer</span>
      </div>
    </div>
  )
}

/* ===================== MODAL ===================== */

function RulesModal({
  open,
  onClose,
  glow,
  level,
}: {
  open: boolean
  onClose: () => void
  glow: string
  level: Level | null
}) {
  if (!open) return null

  const title = level ? `${level.title} · ${formatUsd(level.capital)}` : "Rules"

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-[28px] border border-white/10 bg-black/85 p-5 md:p-6 backdrop-blur-xl"
        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 120px ${glow}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-widest text-white/45">RULESET</div>
            <div className="mt-1 text-[16px] md:text-[18px] font-semibold text-white/90">{title}</div>
            <div className="mt-1 text-[12px] text-white/55">
              Institutional rules. Simple. Enforced later by Risk Guard.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
            <div className="text-[10px] tracking-widest text-white/45">RISK</div>
            <div className="mt-2 text-[12px] text-white/65 leading-relaxed">
              • Trailing drawdown from equity peak <br />
              • Breach max DD → fail window <br />
              • Over-risking blocks payout (later)
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
            <div className="text-[10px] tracking-widest text-white/45">PAYOUT</div>
            <div className="mt-2 text-[12px] text-white/65 leading-relaxed">
              • 21D payout windows <br />
              • Must meet consistency days <br />
              • Split depends on level
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
            <div className="text-[10px] tracking-widest text-white/45">PROMOTION</div>
            <div className="mt-2 text-[12px] text-white/65 leading-relaxed">
              • Hit target return within rules <br />
              • Maintain discipline across days <br />
              • Unlock higher tiers sequentially
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
            <div className="text-[10px] tracking-widest text-white/45">COMPLIANCE</div>
            <div className="mt-2 text-[12px] text-white/65 leading-relaxed">
              • Trades logged to your profile <br />
              • Risk Guard watches violations <br />
              • Manual override = tighter limits
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== MAIN ===================== */

export default function TraderOfferPanel({
  glow = "rgba(0,255,160,0.18)",
  feeUsd = 150,
  onStart,
}: Props) {
  const [selectedId, setSelectedId] = useState<LevelId>(RUN.activeLevelId)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [rulesLevel, setRulesLevel] = useState<Level | null>(null)

  const levels = LEVELS
  const selected = levels.find((l) => l.id === selectedId) ?? levels[0]

  const cd = useCountdown(RUN.nextPayoutAtISO)

  const offerTop = useMemo(() => {
    const maxCap = Math.max(...levels.map((l) => l.capital))
    const bestSplit = Math.max(...levels.map((l) => l.payoutSplitPct))
    return { maxCap, bestSplit }
  }, [levels])

  const progressToTarget = useMemo(() => {
    return clamp01(RUN.returnPct / Math.max(1e-9, selected.profitTargetPct))
  }, [selected.profitTargetPct])

  const ddRemaining = useMemo(() => {
    const remain = Math.max(0, selected.maxDdPct - RUN.maxDdPct)
    return { remain, pct: clamp01(remain / Math.max(1e-9, selected.maxDdPct)) }
  }, [selected.maxDdPct])

  const statusChip = useMemo(() => {
    if (RUN.status === "active") return <Chip tone="strong">ACTIVE</Chip>
    if (RUN.status === "failed") return <Chip tone="danger">FAILED</Chip>
    if (RUN.status === "passed") return <Chip tone="strong">PASSED</Chip>
    return <Chip>READY</Chip>
  }, [])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* HERO */}
      <Panel glow={glow} className="p-5 md:p-6 overflow-hidden relative">
        {/* subtle top wash to match your bunker glow */}
        <div
          className="pointer-events-none absolute -top-24 left-0 right-0 h-64 opacity-40"
          style={{
            background: `radial-gradient(60% 60% at 50% 0%, ${glow} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
        <div className="relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[10px] tracking-widest text-white/45">TRADER ACCESS</div>
                <span className="text-white/20">•</span>
                <div className="text-[10px] tracking-widest text-white/45">INTELLION</div>
                <span className="text-white/20">•</span>
                {statusChip}
              </div>

              <div className="mt-2 text-[22px] md:text-[26px] font-semibold text-white/90 leading-tight">
                Instant Funding
                <span className="text-white/35"> · </span>
                <span className="text-white/90">{formatUsd(feeUsd)}</span>
                <span className="text-white/35"> access</span>
              </div>

              <div className="mt-2 text-[12px] text-white/55 max-w-2xl leading-relaxed">
                Institutional rules. Clean execution. 21-day payout windows.
                <span className="text-white/35"> Signal &gt; hype.</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:flex md:flex-wrap">
                <Metric label="CAPITAL" value={`up to ${formatUsd(offerTop.maxCap)}`} sub="allocation ceiling" />
                <Metric label="PAYOUT SPLIT" value={`up to ${(offerTop.bestSplit * 100).toFixed(0)}%`} sub="best tier terms" />
                <Metric
                  label="NEXT PAYOUT"
                  value={`${cd.days}d ${pad2(cd.hrs)}:${pad2(cd.mins)}:${pad2(cd.secs)}`}
                  sub="21D window"
                />
                <Metric label="EQUITY" value={formatUsd(RUN.equity)} sub={`last update ${new Date(RUN.lastUpdateISO).toLocaleTimeString()}`} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => (onStart ? onStart() : alert("Start (visual)"))}
                  className={cx(
                    "rounded-2xl px-4 py-3 text-[11px] tracking-widest font-semibold",
                    "border border-white/15 bg-white/10 text-white/90 hover:bg-white/15"
                  )}
                >
                  START TRADING
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRulesLevel(selected)
                    setRulesOpen(true)
                  }}
                  className={cx(
                    "rounded-2xl px-4 py-3 text-[11px] tracking-widest",
                    "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                  )}
                >
                  VIEW RULES
                </button>

                <div className="ml-0 md:ml-2 flex items-center gap-2 text-[11px] text-white/45">
                  <span className="rounded-full h-2 w-2 bg-emerald-300/70" />
                  bunker mode ready
                </div>
              </div>
            </div>

            {/* Right mini stack */}
            <div className="w-full md:w-[420px] space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] tracking-widest text-white/55">SELECTED</div>
                  <div className="text-[10px] tracking-widest text-white/35">{selected.id}</div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-white/90 truncate">
                      {selected.title} · {formatUsd(selected.capital)}
                    </div>
                    <div className="mt-1 text-[12px] text-white/55">
                      Target <span className="text-white/80">{formatPct01(selected.profitTargetPct)}</span> · Max DD{" "}
                      <span className="text-white/80">{formatPct01(selected.maxDdPct)}</span> · Split{" "}
                      <span className="text-white/80">{(selected.payoutSplitPct * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {selected.locked ? <Chip>LOCKED</Chip> : selected.id === RUN.activeLevelId ? <Chip tone="strong">CURRENT</Chip> : <Chip>AVAILABLE</Chip>}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] tracking-widest text-white/40">
                    <span>PROMOTION</span>
                    <span>{(progressToTarget * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value01={progressToTarget} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] tracking-widest text-white/40">
                    <span>RISK BUFFER</span>
                    <span>{formatPct01(ddRemaining.remain)}</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value01={ddRemaining.pct} />
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-white/40">
                  {selected.note ?? "Stay within rules."}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] tracking-widest text-white/55">CONSISTENCY</div>
                  <div className="text-[10px] tracking-widest text-white/35">{selected.consistencyDays}D MIN</div>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                    const on = i % 2 === 0
                    return (
                      <div
                        key={i}
                        className={cx(
                          "h-9 rounded-2xl border flex items-center justify-center text-[12px]",
                          on ? "border-white/20 bg-white/10 text-white/85" : "border-white/10 bg-black/30 text-white/40"
                        )}
                        title="Visual only"
                      >
                        {d}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 text-[11px] text-white/45">
                  Maintain activity across the window to qualify (mock).
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Levels */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-widest text-white/55">LEVELS</div>
              <div className="text-[10px] tracking-widest text-white/35">SEQUENTIAL UNLOCK</div>
            </div>
            <div className="mt-2 text-[12px] text-white/55">
              Pick a tier. Higher capital unlocks after discipline + rules.
            </div>
          </div>

          {levels.map((lvl) => {
            const selectedThis = lvl.id === selectedId
            const locked = !!lvl.locked
            const active = lvl.id === RUN.activeLevelId

            return (
              <div
                key={lvl.id}
                className={cx(
                  "rounded-[28px] border bg-black/55 p-5",
                  selectedThis ? "border-white/25" : "border-white/10"
                )}
                style={{
                  boxShadow: selectedThis
                    ? `0 0 0 1px rgba(255,255,255,0.10), 0 0 90px ${glow}`
                    : `0 0 0 1px rgba(255,255,255,0.05), 0 0 55px ${glow}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] tracking-widest text-white/45">INSTANT FUNDING</div>
                      {active ? <Chip tone="strong">ACTIVE</Chip> : null}
                      {locked ? <Chip>LOCKED</Chip> : null}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="text-[16px] font-semibold text-white/90 truncate">
                        {lvl.title} · {formatUsd(lvl.capital)}
                      </div>
                      {!locked && selectedThis ? <Chip tone="strong">SELECTED</Chip> : null}
                    </div>

                    <div className="mt-2 text-[12px] text-white/55 leading-relaxed">
                      Target <span className="text-white/80">{formatPct01(lvl.profitTargetPct)}</span> · Max DD{" "}
                      <span className="text-white/80">{formatPct01(lvl.maxDdPct)}</span> · Payout{" "}
                      <span className="text-white/80">{(lvl.payoutSplitPct * 100).toFixed(0)}%</span> · Consistency{" "}
                      <span className="text-white/80">{lvl.consistencyDays}d</span>
                    </div>

                    {lvl.note ? <div className="mt-2 text-[11px] text-white/45">{lvl.note}</div> : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setSelectedId(lvl.id)}
                      className={cx(
                        "rounded-2xl px-4 py-2 text-xs font-semibold transition border",
                        locked
                          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
                          : selectedThis
                          ? "border-white/25 bg-white/10 text-white/90 hover:bg-white/15"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      )}
                    >
                      {locked ? "Locked" : selectedThis ? "Selected" : "Select"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRulesLevel(lvl)
                        setRulesOpen(true)
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] tracking-widest text-white/70 hover:bg-white/10"
                    >
                      Rules
                    </button>
                  </div>
                </div>

                {/* small bottom strip */}
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                    <div className="text-[10px] tracking-widest text-white/40">FEE</div>
                    <div className="mt-1 text-[12px] font-semibold text-white/85">
                      {lvl.feeUsd > 0 ? formatUsd(lvl.feeUsd) : "Unlocked"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                    <div className="text-[10px] tracking-widest text-white/40">SPLIT</div>
                    <div className="mt-1 text-[12px] font-semibold text-white/85">
                      {(lvl.payoutSplitPct * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                    <div className="text-[10px] tracking-widest text-white/40">TARGET</div>
                    <div className="mt-1 text-[12px] font-semibold text-white/85">
                      {formatPct01(lvl.profitTargetPct)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                    <div className="text-[10px] tracking-widest text-white/40">MAX DD</div>
                    <div className="mt-1 text-[12px] font-semibold text-white/85">
                      {formatPct01(lvl.maxDdPct)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-4">
          <MiniEquitySpark glow={glow} />

          <div
            className="rounded-[24px] border border-white/10 bg-black/45 p-4"
            style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 55px ${glow}` }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-widest text-white/55">NEXT PAYOUT</div>
              <div className="text-[10px] tracking-widest text-white/35">21D WINDOW</div>
            </div>

            <div className="mt-3 text-[22px] font-semibold text-white/90 tabular-nums">
              {cd.days}d {pad2(cd.hrs)}:{pad2(cd.mins)}:{pad2(cd.secs)}
            </div>

            <div className="mt-2 text-[11px] text-white/45">
              Target: <span className="text-white/65">{new Date(cd.targetMs).toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => (onStart ? onStart() : alert("Start (visual)"))}
              className="mt-4 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[11px] tracking-widest text-white/90 hover:bg-white/15"
            >
              START WINDOW
            </button>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-widest text-white/55">LEADERBOARD</div>
              <div className="text-[10px] tracking-widest text-white/35">LIVE</div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 text-white/55">
                  <tr>
                    <th className="px-3 py-2 font-medium">Trader</th>
                    <th className="px-3 py-2 font-medium">PnL</th>
                    <th className="px-3 py-2 font-medium">DD</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "orion_ops", pnl: 1240, dd: 2.1 },
                    { name: "atlas_vortex", pnl: 980, dd: 1.6 },
                    { name: "hydra_vector", pnl: 610, dd: 1.9 },
                    { name: "vega_runner", pnl: 420, dd: 2.7 },
                  ].map((r) => (
                    <tr key={r.name} className="border-t border-white/10 text-white/75">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{formatUsd(r.pnl)}</td>
                      <td className="px-3 py-2">{r.dd.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-[11px] text-white/45">
              Clean feed. Institutional ranking view (mock).
            </div>
          </div>
        </div>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} glow={glow} level={rulesLevel} />
    </div>
  )
}