"use client"

import React, { useMemo } from "react"

export type StartupPresetId = "SAFE_COPY" | "BALANCED_COPY" | "AGGRO_COPY"

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function QuickCopyTopStrategies({
  borderClass,
  glow,
  enabled,
  hint,
  onPick,

  runActive,
  runPresetId,
  runRemainingSec,
  onStop,
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
}) {
  const timeLeft = useMemo(() => fmtTime(runRemainingSec), [runRemainingSec])

  return (
    <section
      className={["rounded-3xl border p-4", borderClass].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 46px ${glow}`,
        background:
          "radial-gradient(900px 260px at 10% 0%, rgba(34,211,238,0.16), rgba(168,85,247,0.14), rgba(0,0,0,0.55))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/60">TOP STRATEGIES WORKING</div>

          {!runActive ? (
            <div className="mt-1 text-[12px] text-white/70">
              Click in <span className="text-white/95 font-semibold">2 seconds</span> → auto-assign + apply
            </div>
          ) : (
            <div className="mt-1 text-[12px] text-white/70">
              Running <span className="text-white/95 font-semibold">{String(runPresetId)}</span> · Remaining{" "}
              <span className="text-white/95 font-semibold tabular-nums">{timeLeft}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {runActive ? (
            <button
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

      {!enabled && (
        <div className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-3">
          <div className="text-[11px] text-rose-100/90">{hint ?? "No traders available — connect one to execute."}</div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <button
          onClick={() => onPick("SAFE_COPY")}
          className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left hover:bg-white/10"
        >
          <div className="text-[12px] font-semibold tracking-widest text-white/95">SAFE COPY</div>
          <div className="mt-1 text-[11px] text-white/70">RISK only · tighter limits</div>
        </button>

        <button
          onClick={() => onPick("BALANCED_COPY")}
          className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left hover:bg-white/10"
        >
          <div className="text-[12px] font-semibold tracking-widest text-white/95">BALANCED</div>
          <div className="mt-1 text-[11px] text-white/70">ENTRY + RISK · recommended</div>
        </button>

        <button
          onClick={() => onPick("AGGRO_COPY")}
          className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left hover:bg-white/10"
        >
          <div className="text-[12px] font-semibold tracking-widest text-white/95">AGGRO</div>
          <div className="mt-1 text-[11px] text-white/70">ENTRY + EXIT · higher variance</div>
        </button>
      </div>

      <div className="mt-3 text-[10px] text-white/45">
        {runActive ? "Window active. Stop anytime — diploma on finish." : "Pressing Copy will configure roles + risk and start execution."}
      </div>
    </section>
  )
}
