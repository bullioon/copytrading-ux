"use client"

import React, { useMemo } from "react"

export type StartupPresetId = "SAFE_COPY" | "BALANCED_COPY" | "AGGRO_COPY"

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

type Signals = {
  drawdownPct: number
  lossStreak: number
  equityFlatMs: number
}

export default function QuickCopyTopStrategies({
  borderClass,
  glow,
  enabled,
  hint,
  onPick,

  // ✅ RUN
  runActive,
  runPresetId,
  runRemainingSec,
  onStop,

  // ✅ UI state
  starting,

  // ✅ SPECIAL CTA
  specialHot,
  onSpecialCta,
  signals,
}: {
  borderClass: string
  glow: string
  enabled: boolean
  hint?: string
  onPick: (id: StartupPresetId) => void

  runActive: boolean
  runPresetId: StartupPresetId | null
  runRemainingSec: number
  onStop: () => void

  starting: boolean

  specialHot: boolean
  onSpecialCta: () => void
  signals: Signals
}) {
  const timeLeft = useMemo(() => fmtTime(runRemainingSec), [runRemainingSec])

  const progressPct = useMemo(() => {
    // si no tienes duration total aquí, solo animamos una barrita “viva”
    // cuando corre; cuando no corre => 0
    return runActive ? 100 : 0
  }, [runActive])

  const progressLabel = useMemo(() => {
    return runActive ? timeLeft : ""
  }, [runActive, timeLeft])

  const renderPresetButton = (id: StartupPresetId) => {
    const label =
      id === "SAFE_COPY" ? "SAFE COPY" : id === "BALANCED_COPY" ? "BALANCED" : "AGGRO"

    const sub =
      id === "SAFE_COPY"
        ? "RISK only · tighter limits"
        : id === "BALANCED_COPY"
          ? "ENTRY + RISK · recommended"
          : "ENTRY + EXIT · higher variance"

    return (
      <button
        key={id}
        type="button"
        disabled={!enabled || runActive || starting}
        onClick={() => {
          if (!enabled || runActive || starting) return
          onPick(id)
        }}
        className={[
          "w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left hover:bg-white/10 transition",
          (!enabled || runActive || starting) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <div className="text-[12px] font-semibold tracking-widest text-white/95">{label}</div>
        <div className="mt-1 text-[11px] text-white/70">{sub}</div>
      </button>
    )
  }

  return (
    <section
      className={["rounded-3xl border p-4", borderClass].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 46px ${glow}`,
        background:
          "radial-gradient(900px 260px at 10% 0%, rgba(34,211,238,0.16), rgba(168,85,247,0.14), rgba(0,0,0,0.55))",
      }}
    >
      {/* PROGRESS BAR (TOP) */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-widest text-white/45">{runActive ? "RUN WINDOW" : "STANDBY"}</div>
          <div className="text-[10px] tracking-widest text-white/55 tabular-nums">{runActive ? progressLabel : ""}</div>
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

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/60">STARTUP PRESETS · LIMITED WINDOWS</div>

          {!runActive ? (
            <div className="mt-1 text-[12px] text-white/70">Pick a style → we auto-assign roles + apply.</div>
          ) : (
            <div className="mt-1 text-[12px] text-white/70">
              Running{" "}
              <span className="text-white/95 font-semibold">
                {String(runPresetId ?? "").replaceAll("_", " ")}
              </span>{" "}
              · Remaining <span className="text-white/95 font-semibold tabular-nums">{timeLeft}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {!enabled ? (
        <div className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-3">
          <div className="text-[11px] text-rose-100/90">{hint ?? "No traders available — connect one to execute."}</div>
        </div>
      ) : null}

      {specialHot ? (
        <button
          type="button"
          disabled={!enabled || runActive || starting}
          onClick={() => {
            if (!enabled || runActive || starting) return
            onSpecialCta()
          }}
          className={[
            "mt-3 w-full text-left rounded-2xl border px-4 py-3 transition panel-pop",
            "border-rose-300/25 bg-rose-300/10 hover:bg-rose-300/15",
            (!enabled || runActive || starting) ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
          style={{ boxShadow: `0 0 26px ${glow}` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] tracking-widest text-rose-100/80">SPECIAL WINDOW · RECOVERY ACCESS</div>
              <div className="mt-1 text-[12px] text-white/90 font-semibold">Tap to run BALANCED now (recommended).</div>
              <div className="mt-1 text-[10px] text-white/55">
                dd {signals.drawdownPct}% · streak {signals.lossStreak} · flat {(signals.equityFlatMs / 1000).toFixed(0)}s
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div className="rounded-xl border border-rose-300/25 bg-rose-300/15 px-3 py-2 text-[10px] tracking-widest text-rose-100 animate-pulse">
                LIVE
              </div>
              <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[10px] tracking-widest text-white/80">
                RUN →
              </div>
            </div>
          </div>
        </button>
      ) : null}

      <div className="mt-3 space-y-2">
        {renderPresetButton("SAFE_COPY")}
        {renderPresetButton("BALANCED_COPY")}
        {renderPresetButton("AGGRO_COPY")}
      </div>

      <div className="mt-3 text-[10px] text-white/45">
        {runActive ? "Window active. Stop anytime — diploma on finish." : "Pick a profile. Then choose allocation to start execution."}
      </div>
    </section>
  )
}