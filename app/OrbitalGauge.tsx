function OrbitalGauge({
  label,
  value,
  min,
  max,
  status,
  sublabel,
}: {
  label: string
  value: number
  min: number
  max: number
  status?: "stable" | "warning" | "critical" | null
  sublabel?: string
}) {
  // clamp + normalize
  const v = Math.max(min, Math.min(max, value))
  const t = (v - min) / (max - min || 1)

  // arc geometry
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const r = 78
  const startDeg = -210
  const sweepDeg = 240
  const endDeg = startDeg + sweepDeg

  const statusGlow =
    status === "stable"
      ? "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(34,197,94,0.14)]"
      : status === "warning"
        ? "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(250,204,21,0.14)]"
        : status === "critical"
          ? "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_30px_rgba(239,68,68,0.14)]"
          : "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"

  const accent =
    status === "stable"
      ? "rgba(34,197,94,0.95)"
      : status === "warning"
        ? "rgba(250,204,21,0.95)"
        : status === "critical"
          ? "rgba(239,68,68,0.95)"
          : "rgba(56,189,248,0.95)" // cyan default

  const muted = "rgba(255,255,255,0.10)"

  const polar = (deg: number, rad: number) => {
    const a = (Math.PI / 180) * deg
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad }
  }

  const arcPath = (fromDeg: number, toDeg: number) => {
    const p0 = polar(fromDeg, r)
    const p1 = polar(toDeg, r)
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
    const sweep = 1
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`
  }

  const filledDeg = startDeg + sweepDeg * t
  const needleDeg = filledDeg

  // ticks
  const ticks = Array.from({ length: 21 }, (_, i) => i) // 0..20
  const tickDeg = (i: number) => startDeg + (sweepDeg * i) / 20

  return (
    <div className={`relative rounded-3xl border border-white/10 bg-black/60 p-4 ${statusGlow}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">{label}</div>
          <div className="mt-1 text-[12px] text-white/55">{sublabel ?? "orbital telemetry"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
          <div className="text-[10px] tracking-widest text-white/45">STATUS</div>
          <div className="mt-1 text-[12px] text-white/80 font-semibold">
            {status === "stable" ? "STABLE" : status === "warning" ? "WARNING" : status === "critical" ? "CRITICAL" : "—"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="relative">
          {/* starfield */}
          <div className="pointer-events-none absolute inset-0 rounded-full opacity-60 blur-[0.2px]"
               style={{
                 background:
                   "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.16) 0 1px, transparent 2px),\
                    radial-gradient(circle at 70% 35%, rgba(255,255,255,0.12) 0 1px, transparent 2px),\
                    radial-gradient(circle at 60% 80%, rgba(255,255,255,0.10) 0 1px, transparent 2px),\
                    radial-gradient(circle at 25% 75%, rgba(255,255,255,0.10) 0 1px, transparent 2px)",
               }}
          />

          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
            <defs>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
                <stop offset="45%" stopColor={accent} stopOpacity="0.85" />
                <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
              </linearGradient>

              <radialGradient id="coreGrad" cx="50%" cy="45%" r="65%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
              </radialGradient>
            </defs>

            {/* outer rings */}
            <circle cx={cx} cy={cy} r={92} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={62} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={44} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

            {/* base arc */}
            <path d={arcPath(startDeg, endDeg)} stroke={muted} strokeWidth="10" strokeLinecap="round" fill="none" />

            {/* filled arc */}
            <path
              d={arcPath(startDeg, filledDeg)}
              stroke="url(#arcGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              filter="url(#softGlow)"
              style={{ transition: "d 220ms ease" }}
            />

            {/* ticks */}
            {ticks.map(i => {
              const d = tickDeg(i)
              const pA = polar(d, 92)
              const pB = polar(d, i % 5 === 0 ? 84 : 88)
              return (
                <line
                  key={i}
                  x1={pA.x}
                  y1={pA.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke={i % 5 === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)"}
                  strokeWidth={i % 5 === 0 ? 1.4 : 1}
                />
              )
            })}

            {/* core */}
            <circle cx={cx} cy={cy} r={56} fill="url(#coreGrad)" stroke="rgba(255,255,255,0.08)" />

            {/* needle */}
            {(() => {
              const pTip = polar(needleDeg, 78)
              const pBase = polar(needleDeg + 180, 10)
              return (
                <g style={{ transition: "transform 220ms ease" }}>
                  <line
                    x1={pBase.x}
                    y1={pBase.y}
                    x2={pTip.x}
                    y2={pTip.y}
                    stroke={accent}
                    strokeOpacity="0.9"
                    strokeWidth="2.2"
                    filter="url(#softGlow)"
                  />
                  <circle cx={cx} cy={cy} r={6.5} fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.18)" />
                  <circle cx={cx} cy={cy} r={2.5} fill={accent} fillOpacity="0.9" />
                </g>
              )
            })()}

            {/* value text */}
            <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize="20" fontWeight="700">
              {Number.isFinite(v) ? v.toFixed(2) : "—"}
            </text>
            <text
              x={cx}
              y={cy + 26}
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize="10"
              letterSpacing="2"
            >
              TELEMETRY
            </text>
          </svg>

          {/* little HUD labels */}
          <div className="absolute left-3 top-3 text-[10px] tracking-widest text-white/40">ORBIT</div>
          <div className="absolute right-3 bottom-3 text-[10px] tracking-widest text-white/40">
            {Math.round(t * 100)}%
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
        <span>min {min.toFixed(2)}</span>
        <span>max {max.toFixed(2)}</span>
      </div>
    </div>
  )
}
