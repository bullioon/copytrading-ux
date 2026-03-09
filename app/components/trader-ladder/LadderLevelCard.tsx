"use client"

import { useMemo } from "react"
import type { LadderLevel, LadderRunMock } from "./types"

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function formatUsd(n: number) {
  return Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

function formatPct(n: number) {
  return `${(Number(n || 0) * 100).toFixed(1)}%`
}

export default function LadderLevelCard({
  level,
  run,
  glow = "rgba(0,255,160,0.18)",
  onRules,
  onPrimary,
}: {
  level: LadderLevel
  run: LadderRunMock
  glow?: string
  onRules: () => void
  onPrimary: () => void
}) {
  const isActive = run.activeLevelId === level.id && run.status !== "not_started"
  const isCurrent = run.activeLevelId === level.id
  const locked = !!level.locked

  const ddRemaining = useMemo(() => {
    const used = run.maxDdPct
    const remain = Math.max(0, level.maxDrawdownPct - used)
    return { used, remain, pct: clamp01(remain / Math.max(1e-9, level.maxDrawdownPct)) }
  }, [run.maxDdPct, level.maxDrawdownPct])

  const progressToTarget = useMemo(() => {
    return clamp01(run.returnPct / Math.max(1e-9, level.targetReturnPct))
  }, [run.returnPct, level.targetReturnPct])

  return (
    <div
      className="rounded-[28px] border border-white/10 bg-black/55 p-5"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 70px ${glow}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">TRADER LADDER</div>

          <div className="mt-1 flex items-center gap-2">
            <div className="text-[14px] font-semibold text-white/90">
              {level.title} · {formatUsd(level.capital)}
            </div>

            {locked ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                LOCKED
              </span>
            ) : isCurrent && run.status === "not_started" ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                READY
              </span>
            ) : null}

            {isActive ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
                ACTIVE
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-[12px] text-white/55">
            Max DD: <span className="text-white/75">{formatPct(level.maxDrawdownPct)}</span> · Target:{" "}
            <span className="text-white/75">{formatPct(level.targetReturnPct)}</span>
          </div>
        </div>

        <button
          onClick={onRules}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
        >
          Rules
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[10px] tracking-widest text-white/45">RISK BUFFER</div>
          <div className="mt-1 text-sm font-semibold text-white/90 tabular-nums">
            {formatPct(ddRemaining.remain)} remaining
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-white/70" style={{ width: `${ddRemaining.pct * 100}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-white/45">Visual (mock).</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[10px] tracking-widest text-white/45">PROMOTION</div>
          <div className="mt-1 text-sm font-semibold text-white/90 tabular-nums">
            {(progressToTarget * 100).toFixed(1)}% to target
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-white/70" style={{ width: `${progressToTarget * 100}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-white/45">Target: {formatPct(level.targetReturnPct)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="text-xs text-white/60">
          Fee: <span className="text-white/85 font-semibold">{level.feeUsd > 0 ? formatUsd(level.feeUsd) : "Unlocked"}</span>
        </div>

        <button
          disabled={locked}
          onClick={onPrimary}
          className={[
            "rounded-2xl px-4 py-2 text-xs font-semibold transition",
            locked
              ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/35"
              : "border border-white/10 bg-white/10 text-white/85 hover:bg-white/15",
          ].join(" ")}
        >
          {locked ? "Locked" : level.feeUsd > 0 ? `Pay ${formatUsd(level.feeUsd)} (visual)` : "Enter Level (visual)"}
        </button>
      </div>
    </div>
  )
}