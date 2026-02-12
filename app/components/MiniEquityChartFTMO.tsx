"use client"

import React, { useMemo, useState } from "react"

type Props = {
  equity: number[]
  baselineUsd?: number | null

  /** línea roja de pérdida máxima (ej -1000) */
  maxLossUsd?: number

  /** targets x2 / x5 / hellion */
  showTargets?: boolean
  hellionUsd?: number

  /** alto responsive */
  heightClassName?: string

  /** opcional: etiqueta arriba */
  title?: string
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

function fmt(n: number) {
  const num = Number(n)
  if (!Number.isFinite(num)) return "0.00"
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function downsampleMinMax(values: number[], bucketCount: number) {
  // reduce puntos sin “aplanar”: min/max por bucket
  if (values.length <= bucketCount) return values
  const out: number[] = []
  const step = values.length / bucketCount
  for (let b = 0; b < bucketCount; b++) {
    const s = Math.floor(b * step)
    const e = Math.floor((b + 1) * step)
    const slice = values.slice(s, Math.max(s + 1, e))
    let mn = slice[0]
    let mx = slice[0]
    for (const v of slice) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    out.push(mn, mx)
  }
  return out
}

export default function MiniEquityChartFTMO({
  equity,
  baselineUsd = null,
  maxLossUsd = -1000,
  showTargets = true,
  hellionUsd = 1500,
  heightClassName = "h-[170px] sm:h-[220px]",
  title,
}: Props) {
  // ✅ hooks SIEMPRE arriba, sin returns antes
  const rawSeries = useMemo(() => {
    const arr = Array.isArray(equity) ? equity.map(Number).filter(Number.isFinite) : []
    return arr.length >= 2 ? arr : []
  }, [equity])

  const base = useMemo(() => {
    if (!rawSeries.length) return 0
    const b = Number.isFinite(baselineUsd as any) ? Number(baselineUsd) : rawSeries[0]
    return Number.isFinite(b) ? b : rawSeries[0]
  }, [rawSeries, baselineUsd])

  // timeframe interno (H/D/M) – aquí va el useState que preguntaste
  const [tf, setTf] = useState<"H" | "D" | "M">("H")

  // ====== Filtrado de puntos (H/D/M) ======
  // Asumimos: equityBuffer empuja ~1 punto por segundo.
  // H = últimos 3600, D = 86400, M = 2592000 (30 días)
  const filteredSeries = useMemo(() => {
    if (!rawSeries.length) return []
    const cap =
      tf === "H" ? 3600 :
      tf === "D" ? 86400 :
      2592000

    // si no tienes tantos puntos, no recorta
    const start = Math.max(0, rawSeries.length - cap)
    const cut = rawSeries.slice(start)

    // downsample para que se vea “natural” en móvil (no línea dura)
    // bucketCount se ajusta al ancho típico
    const bucketCount = 140
    return downsampleMinMax(cut, bucketCount)
  }, [rawSeries, tf])

  const series = filteredSeries

  // si no hay data suficiente, UI placeholder (DESPUÉS de hooks)
  const hasData = series.length >= 2

  // targets
  const target2 = base * 2
  const target5 = base * 5
  const targetHellion = Number.isFinite(hellionUsd as any) ? Number(hellionUsd) : null

  // ====== RANGO “NATURAL” SOLO POR EQUITY ======
  // NO metemos maxLoss/x2/x5 en el rango → así no se aplana.
  const { minY, maxY, spanY } = useMemo(() => {
    if (!hasData) return { minY: 0, maxY: 1, spanY: 1 }
    let mn = series[0]
    let mx = series[0]
    for (const v of series) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    let span = (mx - mn) || 1
    // padding para aire
    const pad = span * 0.18
    // si está MUY plano, fuerza span mínimo
    const minSpan = Math.max(1e-6, Math.abs(series[series.length - 1] ?? 1) * 0.01)
    if (span < minSpan) {
      const mid = (mx + mn) / 2
      mn = mid - minSpan / 2
      mx = mid + minSpan / 2
      span = mx - mn
    }
    return { minY: mn - pad, maxY: mx + pad, spanY: (mx - mn) + pad * 2 }
  }, [series, hasData])

  // glow según PnL (verde/rojo)
  const pnlUsd = useMemo(() => {
    if (!hasData) return 0
    const last = series[series.length - 1]
    return (Number.isFinite(last) ? last : 0) - (Number.isFinite(base) ? base : 0)
  }, [series, base, hasData])

  const glow = pnlUsd >= 0 ? "rgba(34,197,94,0.55)" : "rgba(244,63,94,0.55)"
  const stroke = pnlUsd >= 0 ? "rgba(134,239,172,0.92)" : "rgba(253,164,175,0.92)"
  const fill = pnlUsd >= 0 ? "rgba(34,197,94,0.14)" : "rgba(244,63,94,0.12)"

  // ===== SVG mapping =====
  const W = 980
  const H = 320
  const P = 18

  const sx = (i: number) => P + (i / Math.max(1, series.length - 1)) * (W - P * 2)
  const sy = (v: number) => {
    const t = (v - minY) / (maxY - minY || 1)
    return H - P - t * (H - P * 2)
  }

  const linePath = useMemo(() => {
    if (!hasData) return ""
    let d = `M ${sx(0)} ${sy(series[0])}`
    for (let i = 1; i < series.length; i++) d += ` L ${sx(i)} ${sy(series[i])}`
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, series, minY, maxY])

  const areaPath = useMemo(() => {
    if (!hasData) return ""
    const yBase = sy(base)
    let d = `M ${sx(0)} ${yBase} L ${sx(0)} ${sy(series[0])}`
    for (let i = 1; i < series.length; i++) d += ` L ${sx(i)} ${sy(series[i])}`
    d += ` L ${sx(series.length - 1)} ${yBase} Z`
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, series, base, minY, maxY])

  const last = hasData ? series[series.length - 1] : 0
  const lastX = hasData ? sx(series.length - 1) : P
  const lastY = hasData ? sy(last) : H - P

  // ====== Helpers para “marcadores” que pueden estar fuera del rango ======
  const yInRange = (v: number) => clamp(sy(v), P, H - P)
  const outsideTag = (v: number) => (v > maxY ? "▲" : v < minY ? "▼" : "")

  const yMaxLoss = yInRange(maxLossUsd)
  const maxLossTag = outsideTag(maxLossUsd)

  const yT2 = yInRange(target2)
  const yT5 = yInRange(target5)
  const yHell = targetHellion != null ? yInRange(targetHellion) : null

  const tagT2 = outsideTag(target2)
  const tagT5 = outsideTag(target5)
  const tagHell = targetHellion != null ? outsideTag(targetHellion) : ""

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30",
        heightClassName,
      ].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 34px ${glow}`,
      }}
    >
      {/* estrellas sutil + grain + scanline */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.28]">
        <div className="ftmo-stars absolute inset-0" />
        <div className="ftmo-grain absolute inset-0" />
        <div className="ftmo-scanline absolute inset-0" />
      </div>

      {/* header mini */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-2">
        <div className="text-[10px] tracking-widest text-white/55">
          {title ?? "FTMO · HELLION"}{" "}
          <span className="text-white/35">retro-space-hud</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/12 bg-black/40 px-2 py-1 text-[10px] text-white/70">
            N={rawSeries.length}
          </div>
          <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-100/80">
            LIVE
          </div>
        </div>
      </div>

      {/* botones timeframe (H/D/M) */}
      <div className="relative z-10 mt-2 flex items-center gap-2 px-3">
        {(["H", "D", "M"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTf(k)}
            className={[
              "rounded-full border px-3 py-1 text-[10px] tracking-widest transition",
              tf === k
                ? "border-white/25 bg-white/10 text-white/85"
                : "border-white/10 bg-black/30 text-white/55 hover:bg-white/5",
            ].join(" ")}
          >
            {k}
          </button>
        ))}

        <div className="ml-auto text-[10px] text-white/45">
          span: {fmt(spanY)}
        </div>
      </div>

      {/* chart */}
      <div className="relative z-10 mt-2 px-2 pb-2">
        {!hasData ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
            Waiting for equity…
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-full">
            {/* grid minimal */}
            {Array.from({ length: 10 }).map((_, i) => {
              const x = (i / 9) * W
              return <line key={`gx-${i}`} x1={x} y1={0} x2={x} y2={H} stroke="rgba(255,255,255,0.05)" />
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const y = (i / 5) * H
              return <line key={`gy-${i}`} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" />
            })}

            {/* corner ticks tipo nave */}
            <g stroke="rgba(255,255,255,0.20)" strokeWidth="2">
              {/* TL */}
              <path d={`M ${P} ${P + 26} L ${P} ${P} L ${P + 46} ${P}`} />
              {/* TR */}
              <path d={`M ${W - P - 46} ${P} L ${W - P} ${P} L ${W - P} ${P + 26}`} />
              {/* BL */}
              <path d={`M ${P} ${H - P - 26} L ${P} ${H - P} L ${P + 46} ${H - P}`} />
              {/* BR */}
              <path d={`M ${W - P - 46} ${H - P} L ${W - P} ${H - P} L ${W - P} ${H - P - 26}`} />
            </g>

            {/* fill */}
            <path d={areaPath} fill={fill} />

            {/* equity line */}
            <path
              d={linePath}
              fill="none"
              stroke={stroke}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* last point */}
            <circle cx={lastX} cy={lastY} r={8} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.22)" />
            <circle cx={lastX} cy={lastY} r={3.2} fill={stroke} />

            {/* Max Loss (si está fuera del rango, se pega al borde con tag) */}
            <line x1={P} y1={yMaxLoss} x2={W - P} y2={yMaxLoss} stroke="rgba(239,68,68,0.80)" strokeWidth={3} />
            <g transform={`translate(${P}, ${clamp(yMaxLoss - 22, 10, H - 34)})`}>
              <rect width="150" height="30" rx="14" fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.45)" />
              <text x="14" y="20" fill="rgba(255,255,255,0.88)" fontSize="14" fontWeight="700">
                MAX LOSS {maxLossTag}
              </text>
            </g>

            {/* Targets opcionales (no aplastan el zoom) */}
            {showTargets ? (
              <>
                {/* x2 */}
                <line x1={P} y1={yT2} x2={W - P} y2={yT2} stroke="rgba(56,189,248,0.35)" strokeWidth={2} strokeDasharray="10 10" />
                <text x={P + 6} y={clamp(yT2 - 6, 14, H - 10)} fill="rgba(147,197,253,0.85)" fontSize="12" fontWeight="700">
                  x2 {tagT2}
                </text>

                {/* x5 */}
                <line x1={P} y1={yT5} x2={W - P} y2={yT5} stroke="rgba(167,139,250,0.32)" strokeWidth={2} strokeDasharray="10 10" />
                <text x={P + 6} y={clamp(yT5 - 6, 14, H - 10)} fill="rgba(216,180,254,0.85)" fontSize="12" fontWeight="700">
                  x5 {tagT5}
                </text>

                {/* base */}
                <line x1={P} y1={yInRange(base)} x2={W - P} y2={yInRange(base)} stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeDasharray="8 10" />
                <text x={W - P - 110} y={clamp(yInRange(base) - 6, 14, H - 10)} fill="rgba(255,255,255,0.55)" fontSize="12" fontWeight="700">
                  base
                </text>

                {/* hellion */}
                {yHell != null ? (
                  <>
                    <line x1={P} y1={yHell} x2={W - P} y2={yHell} stroke="rgba(250,204,21,0.28)" strokeWidth={2} strokeDasharray="10 10" />
                    <text x={P + 6} y={clamp(yHell - 6, 14, H - 10)} fill="rgba(253,224,71,0.80)" fontSize="12" fontWeight="700">
                      Hellion {tagHell}
                    </text>
                  </>
                ) : null}
              </>
            ) : null}

            {/* label abajo */}
            <text x={W / 2} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="14">
              Number of trades
            </text>

            {/* last label */}
            <text x={W - P - 160} y={H - 10} fill="rgba(255,255,255,0.55)" fontSize="12">
              last: <tspan fill="rgba(255,255,255,0.85)" fontWeight="700">{fmt(last)}</tspan>
            </text>
          </svg>
        )}
      </div>

      {/* css effects */}
      <style jsx>{`
        .ftmo-scanline {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.00),
            rgba(255,255,255,0.06),
            rgba(255,255,255,0.00)
          );
          mix-blend-mode: overlay;
          opacity: 0.30;
          transform: translateY(-40%);
          animation: scanline 7.5s linear infinite;
        }

        @keyframes scanline {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(160%); }
        }

        .ftmo-grain {
          background-image:
            radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 3px 3px;
          opacity: 0.08;
          mix-blend-mode: overlay;
          filter: blur(0.2px);
        }

        .ftmo-stars {
          background-image:
            radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px),
            radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
          background-size: 120px 120px, 180px 180px, 260px 260px;
          background-position: 0 0, 40px 80px, 90px 30px;
          opacity: 0.22;
          filter: blur(0.1px);
        }
      `}</style>
    </div>
  )
}