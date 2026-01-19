"use client"

import React, { useMemo, useState } from "react"

type Health = "stable" | "warning" | "critical" | null
type StartupPresetId = "SAFE_COPY" | "BALANCED_COPY" | "AGGRO_COPY"

type Props = {
  equity: number[]
  initialBalance: number
  lineColor?: string
  border?: string
  pnl: number
  health: Health
  warningDD: number
  criticalDD: number
  missionTargetUsd: number

  /** NEW: show big balance + startup presets area */
  showBalanceCore?: boolean
  startupEnabled?: boolean
  startupHint?: string
  onStartupPreset?: (id: StartupPresetId) => void

  /** NEW: color del balance (verde/rojo) */
  balanceTone?: string

  /** NEW: delta vs baseline (para mostrar +$ / -$ con comas) */
  balanceDeltaUsd?: number

  /** NEW: callback para pedir override desde el EquityCard */
  onRequestDisableProtections?: () => void
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

/** $ con comas, 2 decimales, y signo +/- si lo pides */
function fmtUsd(n: number, opts?: { sign?: boolean; decimals?: number }) {
  const decimals = opts?.decimals ?? 2

  const num = Number(n)
  if (!Number.isFinite(num)) return "$0.00"

  const sign = opts?.sign ? (num > 0 ? "+" : num < 0 ? "-" : "") : ""
  const abs = Math.abs(num)

  const fixed = abs.toFixed(decimals)
  const [intPart, decPart] = fixed.split(".")
  const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  return `${sign}$${intWithCommas}.${decPart ?? "00"}`
}

export default function EquityCard({
  equity,
  initialBalance,
  lineColor = "rgba(56,189,248,0.75)",
  border = "border-white/10",
  pnl,
  health,
  warningDD,
  criticalDD,
  missionTargetUsd,
  showBalanceCore = false,
  startupEnabled = true,
  startupHint,
  onStartupPreset,
  balanceTone = "text-white/90",
  balanceDeltaUsd,

  // ✅ IMPORTANT: desestructurarla (aquí estaba tu fallo)
  onRequestDisableProtections,
}: Props) {
  // ✅ estabilidad + no mutación + no recompute gratis
  const seriesUsd = useMemo(() => {
    const base = (equity?.length ? equity : [initialBalance]).map(Number).filter(Number.isFinite)
    return base.length ? base : [Number(initialBalance) || 0]
  }, [equity, initialBalance])

  const lastEquity = seriesUsd[seriesUsd.length - 1] ?? initialBalance
  const firstEquity = seriesUsd[0] ?? initialBalance

  // ✅ separar DD NOW (último punto vs peak) y DD WORST (peor histórico)
  const { ddWorstPct, ddNowPct, peakEquity } = useMemo(() => {
    if (seriesUsd.length < 2) return { ddWorstPct: 0, ddNowPct: 0, peakEquity: seriesUsd[0] ?? 0 }
    let peak = seriesUsd[0]
    let worst = 0
    for (const v of seriesUsd) {
      if (v > peak) peak = v
      const cur = ((v - peak) / (peak || 1)) * 100
      if (cur < worst) worst = cur
    }
    const last = seriesUsd[seriesUsd.length - 1]
    const now = ((last - peak) / (peak || 1)) * 100
    return { ddWorstPct: worst, ddNowPct: now, peakEquity: peak }
  }, [seriesUsd])

  const seriesPct = useMemo(() => {
    const base = firstEquity || 1
    return seriesUsd.map(v => ((v - base) / base) * 100)
  }, [seriesUsd, firstEquity])

  const progressPct = clamp((pnl / (missionTargetUsd || 1)) * 100, 0, 100)

  // chart mode toggles (HUD style)
  const [autoZoom, setAutoZoom] = useState(true)
  const [unit, setUnit] = useState<"PCT" | "USD">("PCT")

  // choose chart series based on unit
  const chartValues = useMemo(() => {
    if (unit === "USD") return seriesUsd.map(v => v - firstEquity)
    return seriesPct
  }, [unit, seriesUsd, seriesPct, firstEquity])

  // compute min/max for stat chips
  const { minV, maxV, lastV, spanV } = useMemo(() => {
    const arr = chartValues.length ? chartValues : [0]
    let mn = arr[0] ?? 0
    let mx = arr[0] ?? 0
    for (const v of arr) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    const last = arr[arr.length - 1] ?? 0
    return { minV: mn, maxV: mx, lastV: last, spanV: mx - mn }
  }, [chartValues])

  // auto zoom: tighten min/max around data (still with headroom)
  const zoomedRange = useMemo(() => {
    if (!autoZoom) return null
    const span = (maxV - minV) || 1
    const extra = span * 0.22
    return { min: minV - extra, max: maxV + extra }
  }, [autoZoom, minV, maxV])

  const healthLabel =
    health === "stable"
      ? "STABLE"
      : health === "warning"
        ? "WARNING"
        : health === "critical"
          ? "CRITICAL"
          : "—"

  return (
    <section className={`rounded-3xl border ${border} bg-black/60 p-4`}>
      {/* top header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/40">EQUITY</div>
          <div className="mt-1 text-sm text-white/85 font-semibold">Telemetry</div>
          <div className="mt-1 text-[12px] text-white/55">
            Now: <span className="text-white/85 font-semibold">{fmtUsd(lastEquity)}</span> · Start:{" "}
            <span className="text-white/75 font-semibold">{fmtUsd(firstEquity)}</span>
          </div>
          <div className="mt-1 text-[11px] text-white/45">
            Peak: <span className="text-white/70 font-semibold">{fmtUsd(peakEquity)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HealthChip health={health} />
        </div>
      </div>

      {/* ===== BALANCE CORE + WARNINGS ===== */}
      {showBalanceCore && (
        <div className="mt-4 rounded-3xl border border-white/10 bg-black/35 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* ===== LEFT: BALANCE ===== */}
            <div className="min-w-0">
              <div className="text-[10px] tracking-widest text-white/40">BALANCE</div>

              <div className={`mt-1 text-[44px] leading-none font-semibold tabular-nums ${balanceTone}`}>
                {fmtUsd(lastEquity)}
              </div>

              {typeof balanceDeltaUsd === "number" && (
                <div className="mt-1 text-[12px] text-white/60">
                  Delta{" "}
                  <span className="text-white/90 font-semibold tabular-nums">
                    {fmtUsd(balanceDeltaUsd, { sign: true })}
                  </span>
                </div>
              )}

              <div className="mt-2 text-[12px] text-white/55">
                Account equity · PnL{" "}
                <span className="text-white/85 font-semibold tabular-nums">{fmtUsd(pnl, { sign: true })}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <HudPill label="HEALTH" value={healthLabel} />
                <HudPill label="DD NOW" value={`${ddNowPct.toFixed(2)}%`} />
                <HudPill label="DD WORST" value={`${ddWorstPct.toFixed(2)}%`} />
                <HudPill label="TARGET" value={fmtUsd(missionTargetUsd)} />
              </div>

              {/* (opcional) Startup presets: si quieres usarlos */}
              {(onStartupPreset || startupHint) && (
                <div className="mt-4">
                  <div className="text-[10px] tracking-widest text-white/40">STARTUP</div>
                  {startupHint ? <div className="mt-1 text-[12px] text-white/55">{startupHint}</div> : null}

                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <StartupButton
                      title="SAFE"
                      sub="Slow and steady"
                      disabled={!startupEnabled}
                      onClick={() => startupEnabled && onStartupPreset?.("SAFE_COPY")}
                    />
                    <StartupButton
                      title="BALANCED"
                      sub="Adaptive recovery"
                      disabled={!startupEnabled}
                      onClick={() => startupEnabled && onStartupPreset?.("BALANCED_COPY")}
                    />
                    <StartupButton
                      title="AGGRO"
                      sub="Higher volatility"
                      disabled={!startupEnabled}
                      onClick={() => startupEnabled && onStartupPreset?.("AGGRO_COPY")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ===== RIGHT: IMPORTANT WARNINGS ===== */}
            <div className="w-full md:w-[360px]">
              <div>
                <div className="text-[10px] tracking-widest text-rose-300/70">IMPORTANT WARNINGS</div>
                <div className="mt-1 text-[12px] text-white/65">
                  Execution may pause automatically to protect your balance.
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {health === "critical" ? (
                  <div className="rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-rose-100/80">RISK BRAKE · ACTIVE</div>
                    <div className="mt-1 text-[12px] text-white/85 font-semibold">Execution paused for protection.</div>
                    <div className="mt-1 text-[10px] text-white/55">Drawdown exceeded {criticalDD}% limit.</div>
                  </div>
                ) : health === "warning" ? (
                  <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-amber-100/80">WARNING</div>
                    <div className="mt-1 text-[12px] text-white/80">Approaching protection limits.</div>
                    <div className="mt-1 text-[10px] text-white/55">Drawdown near {warningDD}%.</div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <div className="text-[10px] tracking-widest text-white/45">PROTECTIONS</div>
                    <div className="mt-1 text-[12px] text-white/70">Normal. No active limits.</div>
                  </div>
                )}

                {/* ✅ OVERRIDE CTA si existe el callback */}
                {onRequestDisableProtections ? (
                  <button
                    onClick={onRequestDisableProtections}
                    className="w-full rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-left transition hover:bg-rose-300/15"
                  >
                    <div className="text-[10px] tracking-widest text-rose-100/80">OVERRIDE</div>
                    <div className="mt-1 text-[12px] text-white/85 font-semibold">Disable protections now</div>
                    <div className="mt-1 text-[10px] text-white/55">Manual control · higher risk</div>
                  </button>
                ) : (
                  <div className="text-[10px] text-white/40">You can disable protections in Advanced mode.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== sensors ===== */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <DrawdownProximitySensor drawdownPct={ddNowPct} warningDD={warningDD} criticalDD={criticalDD} />
        </div>

        <div className="lg:col-span-4">
          <EquitySpeedSensor equity={seriesUsd} />
        </div>

        <div className="lg:col-span-4">
          <MissionThruster progressPct={progressPct} pnl={pnl} target={missionTargetUsd} />
        </div>
      </div>

      {/* ===== chart ===== */}
      <div className="mt-4 rounded-3xl border border-white/10 bg-black/35 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[10px] tracking-widest text-white/40">TRAJECTORY</div>
            <div className="mt-1 text-[12px] text-white/55">Auto-zoom (keeps detail visible)</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TogglePill label="AUTO ZOOM" active={autoZoom} onClick={() => setAutoZoom(v => !v)} />
            <TogglePill label="% VS START" active={unit === "PCT"} onClick={() => setUnit("PCT")} />
            <TogglePill label="USD" active={unit === "USD"} onClick={() => setUnit("USD")} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
          <StatMini label="PEAK" value={unit === "PCT" ? `${maxV.toFixed(2)}%` : fmtUsd(maxV)} />
          <StatMini label="DD NOW" value={`${ddNowPct.toFixed(2)}%`} />
          <StatMini label="DD WORST" value={`${ddWorstPct.toFixed(2)}%`} />
          <StatMini label="Δ LAST" value={unit === "PCT" ? `${lastV.toFixed(3)}%` : fmtUsd(lastV, { sign: true })} />
          <StatMini label="SPAN" value={unit === "PCT" ? `${spanV.toFixed(3)}%` : fmtUsd(spanV)} />
          <StatMini label="TARGET" value={fmtUsd(missionTargetUsd)} />
        </div>

        <MiniLineChart
          values={chartValues}
          stroke={lineColor}
          labelLeft={unit === "PCT" ? "MIN" : "MIN USD"}
          labelRight={unit === "PCT" ? "MAX" : "MAX USD"}
          fixedRange={zoomedRange ?? undefined}
          baseline={0}
          formatValue={v => (unit === "PCT" ? `${v.toFixed(2)}%` : fmtUsd(v, { sign: true }))}
        />

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <StatMini label="LAST" value={unit === "PCT" ? `${lastV.toFixed(3)}%` : fmtUsd(lastV, { sign: true })} />
          <StatMini label="PnL" value={fmtUsd(pnl, { sign: true })} />
          <StatMini label="MODE" value={autoZoom ? "AUTO ZOOM" : "MANUAL"} />
        </div>
      </div>
    </section>
  )
}

/* ================= small blocks ================= */

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[10px] tracking-widest text-white/40">{label}</div>
      <div className="mt-1 text-[12px] text-white/80 font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-[11px] tracking-widest transition",
        active ? "border-white/20 bg-white/10 text-white/85" : "border-white/10 bg-black/30 text-white/60 hover:bg-white/5",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

function HudPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5">
      <span className="text-[10px] tracking-widest text-white/40">{label}</span>{" "}
      <span className="text-[11px] font-semibold text-white/80 tabular-nums">{value}</span>
    </div>
  )
}

function StartupButton({
  title,
  sub,
  onClick,
  disabled,
}: {
  title: string
  sub: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      disabled={!!disabled}
      onClick={onClick}
      className={[
        "group rounded-2xl border px-4 py-3 text-left transition",
        disabled ? "border-white/10 bg-black/25 opacity-50 cursor-not-allowed" : "border-white/10 bg-black/40 hover:bg-white/5",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold tracking-widest text-white/85">{title}</div>
        <div className="text-[10px] text-white/40 group-hover:text-white/55">START ▸</div>
      </div>
      <div className="mt-1 text-[11px] text-white/55">{sub}</div>
    </button>
  )
}

function HealthChip({ health }: { health: Health }) {
  const label = health === "stable" ? "STABLE" : health === "warning" ? "WARNING" : health === "critical" ? "CRITICAL" : "—"

  const cls =
    health === "stable"
      ? "border-white/10 bg-black/40"
      : health === "warning"
        ? "border-yellow-400/20 bg-yellow-400/5"
        : health === "critical"
          ? "border-red-400/20 bg-red-400/5"
          : "border-white/10 bg-black/40"

  return (
    <div className={`rounded-2xl border px-3 py-2 ${cls}`}>
      <div className="text-[10px] tracking-widest text-white/45">HEALTH</div>
      <div className="mt-1 text-[12px] text-white/80 font-semibold">{label}</div>
    </div>
  )
}

/* ================= SENSOR 1: DD PROXIMITY ================= */

function DrawdownProximitySensor({
  drawdownPct,
  warningDD,
  criticalDD,
}: {
  drawdownPct: number
  warningDD: number
  criticalDD: number
}) {
  const critAbs = Math.max(1e-6, Math.abs(criticalDD))
  const prox = clamp(Math.abs(drawdownPct) / critAbs, 0, 1)

  const isWarn = drawdownPct <= warningDD
  const isCrit = drawdownPct <= criticalDD
  const tag = isCrit ? "CRITICAL" : isWarn ? "WARNING" : "SAFE"

  const fill = isCrit ? "rgba(239,68,68,0.70)" : isWarn ? "rgba(250,204,21,0.60)" : "rgba(34,197,94,0.55)"

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">PROXIMITY</div>
          <div className="mt-1 text-[11px] text-white/55">to crit {criticalDD}%</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-white/45">{tag}</div>
          <div className="mt-1 text-[12px] text-white/80 font-semibold tabular-nums">
            {drawdownPct >= 0 ? "+" : ""}
            {drawdownPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="w-[66%] bg-[rgba(34,197,94,0.18)]" />
          <div className="w-[17%] bg-[rgba(250,204,21,0.18)]" />
          <div className="w-[17%] bg-[rgba(239,68,68,0.18)]" />
        </div>
        <div className="absolute top-0 left-0 h-full" style={{ width: `${prox * 100}%`, background: fill }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
        <span>0%</span>
        <span>warning {warningDD}%</span>
        <span>crit {criticalDD}%</span>
      </div>
    </div>
  )
}

/* ================= SENSOR 2: EQUITY SPEED ================= */

function EquitySpeedSensor({ equity }: { equity: number[] }) {
  const speed = useMemo(() => {
    if (!equity || equity.length < 2) return 0
    return equity[equity.length - 1] - equity[equity.length - 2]
  }, [equity])

  // ✅ escalado un poquito mejor (0.2% de equity previo como techo, mínimo $5)
  const maxAbs = useMemo(() => {
    const prev = equity?.[equity.length - 2] ?? 0
    return Math.max(5, Math.abs(prev) * 0.002)
  }, [equity])

  const t = clamp(speed / (maxAbs || 1), -1, 1)
  const dir = t > 0.05 ? "BOOST" : t < -0.05 ? "BRAKE" : "IDLE"
  const pct = Math.round(Math.abs(t) * 100)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">SPEED</div>
          <div className="mt-1 text-[11px] text-white/55">Equity Δ / tick</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-white/45">{dir}</div>
          <div className="mt-1 text-[12px] text-white/80 font-semibold tabular-nums">{fmtUsd(speed, { sign: true })}</div>
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/5 relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/15" />
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: t >= 0 ? "50%" : `${50 - Math.abs(t) * 50}%`,
            width: `${Math.abs(t) * 50}%`,
            background: t >= 0 ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)",
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
        <span>BRAKE</span>
        <span>{pct}%</span>
        <span>BOOST</span>
      </div>
    </div>
  )
}

/* ================= SENSOR 3: MISSION THRUSTER ================= */

function MissionThruster({ progressPct, pnl, target }: { progressPct: number; pnl: number; target: number }) {
  const remaining = Math.max(0, target - pnl)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">THRUSTER</div>
          <div className="mt-1 text-[11px] text-white/55">Mission progress</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-white/45">PROG</div>
          <div className="mt-1 text-[12px] text-white/80 font-semibold tabular-nums">{Math.round(progressPct)}%</div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
        <span className="tabular-nums">
          {fmtUsd(pnl, { sign: true })} / {fmtUsd(target)}
        </span>
        <span className="tabular-nums">ETA {fmtUsd(remaining)}</span>
      </div>
    </div>
  )
}

/* ================= MINI LINE CHART (PRO) ================= */

function ema(values: number[], alpha = 0.28) {
  if (!values.length) return values
  const out = new Array(values.length)
  let prev = values[0]
  out[0] = prev
  for (let i = 1; i < values.length; i++) {
    const v = values[i]
    const next = alpha * v + (1 - alpha) * prev
    out[i] = next
    prev = next
  }
  return out
}

function MiniLineChart({
  values,
  stroke,
  labelLeft,
  labelRight,
  fixedRange,
  formatValue,
  baseline = 0,
  smoothAlpha = 0.26,
}: {
  values: number[]
  stroke: string
  labelLeft?: string
  labelRight?: string
  fixedRange?: { min: number; max: number }
  formatValue?: (v: number) => string
  baseline?: number
  smoothAlpha?: number
}) {
  const w = 980
  const h = 260
  const pad = 18

  const raw = values?.length ? values : [0]
  const smooth = useMemo(() => ema(raw, smoothAlpha), [raw, smoothAlpha])

  const { min, max } = useMemo(() => {
    if (fixedRange) return fixedRange

    let mn = raw[0] ?? 0
    let mx = raw[0] ?? 0
    for (const v of raw) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }

    let span = mx - mn
    if (!Number.isFinite(span) || span <= 0) span = 1

    const minSpan = Math.max(1e-6, Math.abs(raw[raw.length - 1] ?? 0) * 0.015)
    if (span < minSpan) {
      const mid = (mx + mn) / 2
      mn = mid - minSpan / 2
      mx = mid + minSpan / 2
      span = mx - mn
    }

    const extra = span * 0.18
    return { min: mn - extra, max: mx + extra }
  }, [raw, fixedRange])

  const sx = (i: number) => pad + (i / Math.max(1, raw.length - 1)) * (w - pad * 2)
  const sy = (v: number) => {
    const t = (v - min) / (max - min || 1)
    return h - pad - t * (h - pad * 2)
  }

  const baselineY = sy(baseline)

  const { linePath, posAreaPath, negAreaPath, lastPoint } = useMemo(() => {
    if (!raw.length) {
      return {
        linePath: "",
        posAreaPath: "",
        negAreaPath: "",
        lastPoint: { x: pad, y: h - pad },
      }
    }

    let d = `M ${sx(0)} ${sy(smooth[0])}`
    for (let i = 1; i < smooth.length; i++) d += ` L ${sx(i)} ${sy(smooth[i])}`

    const lx = sx(raw.length - 1)
    const ly = sy(smooth[smooth.length - 1])

    type Pt = { x: number; y: number; v: number }
    const pts: Pt[] = raw.map((v, i) => ({ x: sx(i), y: sy(v), v }))

    const buildAreas = () => {
      const posParts: string[] = []
      const negParts: string[] = []

      const addPoly = (arr: Pt[], target: "pos" | "neg") => {
        if (arr.length < 2) return
        let p = `M ${arr[0].x} ${arr[0].y}`
        for (let i = 1; i < arr.length; i++) p += ` L ${arr[i].x} ${arr[i].y}`
        p += ` L ${arr[arr.length - 1].x} ${baselineY} L ${arr[0].x} ${baselineY} Z`
        if (target === "pos") posParts.push(p)
        else negParts.push(p)
      }

      let cur: Pt[] = [pts[0]]
      let curAbove = pts[0].v >= baseline

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const bAbove = b.v >= baseline

        if (bAbove === curAbove) {
          cur.push(b)
          continue
        }

        const dv = b.v - a.v
        const t = dv === 0 ? 0.5 : (baseline - a.v) / dv
        const ix = a.x + (b.x - a.x) * t
        const iy = a.y + (b.y - a.y) * t
        const inter: Pt = { x: ix, y: iy, v: baseline }

        cur.push(inter)
        addPoly(cur, curAbove ? "pos" : "neg")

        cur = [inter, b]
        curAbove = bAbove
      }

      addPoly(cur, curAbove ? "pos" : "neg")
      return { pos: posParts.join(" "), neg: negParts.join(" ") }
    }

    const areas = buildAreas()

    return {
      linePath: d,
      posAreaPath: areas?.pos ?? "",
      negAreaPath: areas?.neg ?? "",
      lastPoint: { x: lx, y: ly },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, smooth, min, max, baseline, baselineY])

  const fmt = formatValue ?? ((v: number) => v.toFixed(2))
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const hover = hoverIdx != null ? clamp(hoverIdx, 0, raw.length - 1) : null
  const hx = hover != null ? sx(hover) : null
  const hv = hover != null ? raw[hover] : null
  const hy = hover != null ? sy(raw[hover]) : null

  const lastV = raw[raw.length - 1] ?? 0
  const lastIsPos = lastV >= baseline

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block w-full h-[260px] touch-none"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          const x = e.clientX - rect.left
          const t = clamp(x / rect.width, 0, 1)
          const idx = Math.round(t * Math.max(1, raw.length - 1))
          setHoverIdx(idx)
        }}
        onTouchStart={(e) => {
          const touch = e.touches?.[0]
          if (!touch) return
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          const x = touch.clientX - rect.left
          const t = clamp(x / rect.width, 0, 1)
          const idx = Math.round(t * Math.max(1, raw.length - 1))
          setHoverIdx(idx)
        }}
        onTouchMove={(e) => {
          const touch = e.touches?.[0]
          if (!touch) return
          const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
          const x = touch.clientX - rect.left
          const t = clamp(x / rect.width, 0, 1)
          const idx = Math.round(t * Math.max(1, raw.length - 1))
          setHoverIdx(idx)
        }}
        onTouchEnd={() => setHoverIdx(null)}
      >
        {/* grid */}
        {Array.from({ length: 11 }).map((_, i) => {
          const x = (i / 10) * w
          return <line key={`gx-${i}`} x1={x} y1={0} x2={x} y2={h} stroke="rgba(255,255,255,0.05)" />
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const y = (i / 6) * h
          return <line key={`gy-${i}`} x1={0} y1={y} x2={w} y2={y} stroke="rgba(255,255,255,0.05)" />
        })}

        {/* baseline */}
        <line x1={0} y1={baselineY} x2={w} y2={baselineY} stroke="rgba(255,255,255,0.10)" />

        {/* areas */}
        {negAreaPath ? <path d={negAreaPath} fill="rgba(244,63,94,0.10)" /> : null}
        {posAreaPath ? <path d={posAreaPath} fill="rgba(34,197,94,0.10)" /> : null}

        {/* line (smooth) */}
        <path d={linePath} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {/* last point */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.25)" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2.75} fill={stroke} />

        {/* hover cursor */}
        {hover != null && hx != null && hy != null && hv != null ? (
          <>
            <line x1={hx} y1={0} x2={hx} y2={h} stroke="rgba(255,255,255,0.10)" />
            <circle cx={hx} cy={hy} r={6} fill="rgba(0,0,0,0.60)" stroke="rgba(255,255,255,0.25)" />
            <circle cx={hx} cy={hy} r={2.75} fill={hv >= baseline ? "rgba(34,197,94,0.85)" : "rgba(244,63,94,0.85)"} />

            <g transform={`translate(${clamp(hx + 12, pad, w - 260)}, ${clamp(hy - 34, 18, h - 58)})`}>
              <rect width="248" height="44" rx="12" fill="rgba(0,0,0,0.72)" stroke="rgba(255,255,255,0.12)" />
              <text x="12" y="18" fill="rgba(255,255,255,0.55)" fontSize="10" letterSpacing="1.8">
                POINT
              </text>
              <text x="12" y="34" fill="rgba(255,255,255,0.88)" fontSize="12" fontWeight="700">
                {fmt(hv)}
              </text>
              <text x="118" y="34" fill="rgba(255,255,255,0.62)" fontSize="11">
                vs base:{" "}
                <tspan fill={hv - baseline >= 0 ? "rgba(34,197,94,0.9)" : "rgba(244,63,94,0.9)"} fontWeight="700">
                  {fmt(hv - baseline)}
                </tspan>
              </text>
            </g>
          </>
        ) : null}

        {/* last value label (solo si no hay hover) */}
        {hover == null ? (
          <text
            x={clamp(lastPoint.x + 10, pad, w - pad)}
            y={clamp(lastPoint.y - 10, 16, h - 16)}
            fill="rgba(255,255,255,0.78)"
            fontSize="12"
            fontWeight="700"
          >
            {fmt(lastV)}
          </text>
        ) : null}

        {/* min/max labels */}
        <text x={pad} y={14} fill="rgba(255,255,255,0.35)" fontSize="10" letterSpacing="1.5">
          {labelRight ?? "MAX"} {fmt(max)}
        </text>
        <text x={pad} y={h - 8} fill="rgba(255,255,255,0.35)" fontSize="10" letterSpacing="1.5">
          {labelLeft ?? "MIN"} {fmt(min)}
        </text>

        {/* baseline label */}
        <text x={w - pad - 90} y={clamp(baselineY - 6, 14, h - 10)} fill="rgba(255,255,255,0.32)" fontSize="10">
          base {fmt(baseline)}
        </text>

        {/* tiny state label */}
        <text x={w - pad - 140} y={14} fill="rgba(255,255,255,0.32)" fontSize="10" letterSpacing="1.2">
          {lastIsPos ? "ABOVE" : "BELOW"} BASE
        </text>
      </svg>
    </div>
  )
}
