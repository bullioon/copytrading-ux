"use client"

import React, { useMemo } from "react"

type Props = {
  title: string
  description: string
  rewardUsd: number
  progress: number // 0..100
  missionId?: string
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function fmtUsd0(n: number) {
  return `$${Math.round(n)}`
}

export default function NextMissionCard({
  title,
  description,
  rewardUsd,
  progress,
  missionId = "M1",
}: Props) {
  const pct = useMemo(() => clamp(progress ?? 0, 0, 100), [progress])

  const status =
    pct >= 100 ? "READY" : pct >= 66 ? "ON TRACK" : pct >= 33 ? "IN PROGRESS" : "START"

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/55 p-5 font-mono">
      {/* ====== BACKGROUND: stars (subtle) ====== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), radial-gradient(rgba(56,189,248,0.22) 1px, transparent 1px)",
          backgroundSize: "48px 48px, 72px 72px",
          backgroundPosition: "0 0, 24px 18px",
        }}
      />

      {/* ====== BACKGROUND: 60s grid ====== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56,189,248,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.12) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* ====== BACKGROUND: scanlines ====== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.10), transparent 2px)",
          backgroundSize: "100% 7px",
        }}
      />

      {/* ====== CORNER GLOW ====== */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.22), transparent 62%)",
        }}
      />

      {/* ====== TOP STRIP (60s label bar) ====== */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/60 px-3 py-[6px] text-[10px] tracking-[0.26em] text-white/70">
            NEXT MISSION
          </span>

          <span className="rounded-full border border-white/10 bg-black/60 px-3 py-[6px] text-[10px] tracking-[0.26em] text-white/55">
            ID {missionId}
          </span>

          <span
            className="rounded-full border px-3 py-[6px] text-[10px] tracking-[0.26em]"
            style={{
              borderColor: "rgba(56,189,248,0.35)",
              background: "rgba(56,189,248,0.08)",
              color: "rgba(224,242,254,0.92)",
            }}
          >
            {status}
          </span>
        </div>

        {/* Reward capsule */}
        <div
          className="rounded-2xl border border-white/10 bg-black/60 px-4 py-2"
          style={{ boxShadow: "0 0 0 1px rgba(56,189,248,0.10) inset" }}
        >
          <div className="text-[10px] tracking-[0.22em] text-white/55">REWARD</div>
          <div className="mt-1 text-sm font-semibold text-white/85">
            {fmtUsd0(rewardUsd)} <span className="text-white/50 font-normal">USD</span>
          </div>
        </div>
      </div>

      {/* ====== MAIN PANEL ====== */}
      <div
        className="relative mt-4 rounded-[22px] border border-white/10 bg-black/45 p-4"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* Left: title/desc */}
          <div className="min-w-0">
            <div className="text-[11px] tracking-[0.24em] text-white/50">OBJECTIVE</div>

            <div className="mt-2 text-lg md:text-xl font-semibold text-white/90 leading-tight">
              {title}
            </div>

            <div className="mt-2 text-[12px] leading-relaxed text-white/60 max-w-[68ch]">
              {description}
            </div>

            {/* tiny instruction */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 text-[11px] text-white/55">
              <span className="text-white/75 font-semibold">Fast rule:</span> pick 1 role → click 1 trader → apply.
            </div>
          </div>

          {/* Right: percent big */}
          <div className="shrink-0">
            <div
              className="rounded-[22px] border border-white/10 bg-black/55 px-4 py-3"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(56,189,248,0.10) inset, 0 0 40px rgba(56,189,248,0.10)",
              }}
            >
              <div className="text-[10px] tracking-[0.22em] text-white/55">PROGRESS</div>
              <div className="mt-2 text-3xl font-extrabold text-white/90 leading-none">
                {Math.round(pct)}%
              </div>
              <div className="mt-1 text-[11px] tracking-[0.18em] text-white/45">CALIBRATED</div>
            </div>
          </div>
        </div>

        {/* ====== PROGRESS BAR (retro beam) ====== */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-[0.26em] text-white/50">SIGNAL</div>
            <div className="text-[10px] tracking-[0.26em] text-white/45">
              {Math.round(pct)}/100
            </div>
          </div>

          <div className="mt-2 h-[14px] w-full rounded-full border border-white/10 bg-black/55 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, rgba(56,189,248,0.20), rgba(56,189,248,0.80), rgba(224,242,254,0.35))",
                boxShadow:
                  "0 0 18px rgba(56,189,248,0.30), inset 0 0 0 1px rgba(255,255,255,0.10)",
              }}
            />
            {/* beam line */}
            <div
              aria-hidden
              className="pointer-events-none relative -mt-[14px] h-[14px] w-full opacity-[0.18]"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.26), transparent)",
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] tracking-[0.18em] text-white/40">
            <span>RETRO-SPACE CONSOLE</span>
            <span>v1968</span>
          </div>
        </div>
      </div>

      {/* ====== FOOTER TICKETS (60s cards) ====== */}
      <div className="relative mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Ticket label="MODE" value="LIVE" />
        <Ticket label="CHANNEL" value="ORBITAL" />
        <Ticket label="LATENCY" value="LOW" />
      </div>
    </section>
  )
}

function Ticket({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[18px] border border-white/10 bg-black/50 px-4 py-3"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset" }}
    >
      <div className="text-[10px] tracking-[0.26em] text-white/45">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white/85 tracking-[0.12em]">{value}</div>
    </div>
  )
}
