"use client"

import React, { useMemo } from "react"

export type StartupPresetId = "SAFE_COPY" | "BALANCED_COPY" | "AGGRO_COPY"

function fmtDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

export default function QuickCopyTopStrategies({
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
  const timeLeft = useMemo(() => fmtDuration(runRemainingSec), [runRemainingSec])

  // Duración “bonita” por preset para barra
  const totalSec = useMemo(() => {
    if (!runPresetId) return 0
    if (runPresetId === "SAFE_COPY") return 24 * 60 * 60
    if (runPresetId === "BALANCED_COPY") return 3 * 24 * 60 * 60
    return 7 * 24 * 60 * 60
  }, [runPresetId])

  const progressPct = useMemo(() => {
    if (!runActive || !totalSec) return 0
    const elapsed = Math.max(0, totalSec - Math.max(0, runRemainingSec))
    return Math.max(0, Math.min(100, (elapsed / totalSec) * 100))
  }, [runActive, totalSec, runRemainingSec])

  const progressLabel = useMemo(() => {
    if (!runActive || !totalSec) return ""
    return `${Math.round(progressPct)}%`
  }, [runActive, totalSec, progressPct])

  const disabledAll = !enabled || runActive || starting

  const renderPreset = (id: StartupPresetId, title: string, sub: string) => (
    <button
      type="button"
      disabled={disabledAll}
      onClick={() => {
        if (disabledAll) return
        onPick(id)
      }}
      className={[
        "w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left transition",
        disabledAll ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10",
        id === "BALANCED_COPY" && specialHot ? "ring-1 ring-rose-300/30 animate-pulse" : "",
      ].join(" ")}
    >
      <div className="text-[12px] font-semibold tracking-widest text-white/95">{title}</div>
      <div className="mt-1 text-[11px] text-white/70">{sub}</div>
    </button>
  )

  return (
    <section
      className={["rounded-3xl border p-4", borderClass].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 46px ${glow}`,
        background:
          "radial-gradient(900px 260px at 10% 0%, rgba(34,211,238,0.16), rgba(168,85,247,0.14), rgba(0,0,0,0.55))",
      }}
    >
      {/* PROGRESS BAR */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-widest text-white/45">
            {runActive ? "RUN WINDOW" : "STANDBY"}
          </div>
          <div className="text-[10px] tracking-widest text-white/55 tabular-nums">
            {runActive ? progressLabel : ""}
          </div>
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

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/60">STARTUP PRESETS</div>

          {!runActive ? (
            <div className="mt-1 text-[12px] text-white/70">
              Pick a style → allocation modal → start.
            </div>
          ) : (
            <div className="mt-1 text-[12px] text-white/70">
              Running <span className="text-white/95 font-semibold">{String(runPresetId).replaceAll("_", " ")}</span> ·
              Remaining <span className="text-white/95 font-semibold tabular-nums">{timeLeft}</span>
            </div>
          )}
        </div>

        {runActive ? (
          <button
            type="button"
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

      {/* DISABLED HINT */}
      {!enabled ? (
        <div className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-3">
          <div className="text-[11px] text-rose-100/90">{hint ?? "Disabled"}</div>
        </div>
      ) : null}

      {/* SPECIAL CTA */}
      {specialHot ? (
        <button
          type="button"
          disabled={disabledAll}
          onClick={() => {
            if (disabledAll) return
            onSpecialCta()
          }}
          className={[
            "mt-3 w-full text-left rounded-2xl border px-4 py-3 transition",
            "border-rose-300/25 bg-rose-300/10 hover:bg-rose-300/15",
            disabledAll ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
          style={{ boxShadow: `0 0 26px ${glow}` }}
        >
          <div className="text-[10px] tracking-widest text-rose-100/80">SPECIAL WINDOW</div>
          <div className="mt-1 text-[12px] text-white/90 font-semibold">Run BALANCED now (recommended)</div>
          <div className="mt-1 text-[10px] text-white/55">
            dd {signals.drawdownPct}% · streak {signals.lossStreak} · flat {(signals.equityFlatMs / 1000).toFixed(0)}s
          </div>
        </button>
      ) : null}

      {/* BUTTONS */}
      <div className="mt-3 space-y-2">
        {renderPreset("SAFE_COPY", "SAFE COPY", "Low variance · tight DD guard")}
        {renderPreset(
          "BALANCED_COPY",
          specialHot ? "RECOVERY ACCESS" : "BALANCED",
          specialHot ? "Recovery window · fast attempt" : "Fast entry · controlled risk"
        )}
        {renderPreset("AGGRO_COPY", "AGGRO", "High vol · aggressive timing")}
      </div>

      <div className="mt-3 text-[10px] text-white/45">
        {runActive ? "Window active. Stop anytime — diploma on finish." : "Pick a profile. Then choose allocation to start execution."}
      </div>
    </section>
  )
}