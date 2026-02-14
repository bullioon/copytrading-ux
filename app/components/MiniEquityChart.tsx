"use client"

import { useMemo, useState } from "react"

type TF = "H" | "D" | "M"
type Point = { x: number; y: number }

export default function MiniEquityChart({
  equity,
  baselineUsd,
  startUsd, // alias opcional
  showTargets = true,
}: {
  equity: number[]
  baselineUsd?: number | null
  startUsd?: number
  showTargets?: boolean
}) {
  const [tf, setTf] = useState<TF>("H")

  // --------- sanitize + slice by timeframe (best-effort) ----------
  const clean = useMemo(() => {
    const arr = Array.isArray(equity) ? equity.filter(v => Number.isFinite(v)) : []
    // tu buffer suele ser 160, pero igual ponemos un “slice” por tf (si crece)
    const max =
      tf === "H" ? 3600 :      // ~1h si fuera 1 punto/seg
      tf === "D" ? 86400 :     // ~1d
      30 * 86400               // ~1m
    return arr.length > max ? arr.slice(-max) : arr
  }, [equity, tf])

  // baseline (para targets)
  const base = useMemo(() => {
    const b =
      (baselineUsd ?? null) != null ? Number(baselineUsd) :
      Number.isFinite(startUsd as any) ? Number(startUsd) :
      Number.isFinite(clean?.[0] as any) ? Number(clean[0]) :
      0
    return Number.isFinite(b) ? b : 0
  }, [baselineUsd, startUsd, clean])

  // --------- empty state ----------
  if (!Array.isArray(clean) || clean.length < 2) {
    return (
      <div className="h-24 md:h-28 flex items-center justify-center text-[11px] text-white/40">
        Waiting for equity…
      </div>
    )
  }

  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const range = (max - min) || 1

  // mapping helpers
  const yOf = (value: number) => {
    // top padding 6, bottom padding 44 (en viewBox 0..50)
    const y = 44 - ((value - min) / range) * 36
    return Number.isFinite(y) ? y : 44
  }

  const points: Point[] = []
  for (let i = 0; i < clean.length; i++) {
    const v = clean[i]
    const x = (i / (clean.length - 1)) * 100
    const y = yOf(v)
    points.push({ x, y })
  }

  const poly = points.map(p => `${p.x},${p.y}`).join(" ")

  // Targets
  const t2 = base * 2
  const t5 = base * 5
  const tHellion = base * 1.5 // ajusta si quieres otro “Hellion” target

  const targets = showTargets
    ? [
        { label: "x2", v: t2, cls: "stroke-white/20" },
        { label: "x5", v: t5, cls: "stroke-white/20" },
        { label: "HELLION", v: tHellion, cls: "stroke-rose-400/25" },
      ]
    : []

  // current / delta
  const last = clean[clean.length - 1]
  const delta = last - base
  const deltaTxt = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`

  return (
    <div className="w-full">
      {/* top row: timeframe + mini numbers */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-white/10 bg-black/25 p-1">
          {(["H", "D", "M"] as TF[]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setTf(k)}
              className={[
                "px-2.5 py-1 text-[10px] tracking-widest rounded-lg transition",
                tf === k ? "bg-white/10 text-white/85" : "text-white/45 hover:text-white/70",
              ].join(" ")}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-white/45 tabular-nums">
          <span className="text-white/70">{last.toFixed(2)}</span>{" "}
          <span className={delta >= 0 ? "text-emerald-300/80" : "text-rose-300/80"}>
            ({deltaTxt})
          </span>
        </div>
      </div>

      {/* chart */}
      <svg viewBox="0 0 100 50" className="w-full h-24 md:h-28">
        {/* background grid (ultra subtle) */}
        <path
          d="M0 10 H100 M0 25 H100 M0 40 H100"
          className="stroke-white/5"
          strokeWidth="0.6"
        />

        {/* targets */}
        {targets.map((t, i) => {
          const y = yOf(t.v)
          // solo pinta si cae dentro del rango visible
          if (!Number.isFinite(y) || y < 2 || y > 48) return null
          return (
            <g key={i}>
              <line x1="0" x2="100" y1={y} y2={y} className={t.cls} strokeWidth="0.8" />
              <text x="1.5" y={y - 1.2} fontSize="3" fill="rgba(255,255,255,0.35)">
                {t.label}
              </text>
            </g>
          )
        })}

        {/* equity line */}
        <polyline
          fill="none"
          stroke="rgba(74,222,128,0.95)" // emerald vibe
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={poly}
        />

        {/* labels */}
        <text x="0" y="49" fontSize="3" fill="rgba(255,255,255,0.28)">
          Start
        </text>
        <text x="92" y="49" fontSize="3" fill="rgba(255,255,255,0.28)">
          Now
        </text>
      </svg>
    </div>
  )
}