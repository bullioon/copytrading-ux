"use client"

type Point = { x: number; y: number }

export default function MiniEquityChart({
  equity,
}: {
  equity: number[]
}) {
  // 1️⃣ Validación extrema
  if (
    !Array.isArray(equity) ||
    equity.length < 2 ||
    equity.some(v => typeof v !== "number" || !Number.isFinite(v))
  ) {
    return (
      <div className="h-28 flex items-center justify-center text-xs opacity-40">
        Waiting for closed trades…
      </div>
    )
  }

  const min = Math.min(...equity)
  const max = Math.max(...equity)
  const range = max - min || 1

  // 2️⃣ Precalcular puntos de forma SEGURA
  const points: Point[] = []

  for (let i = 0; i < equity.length; i++) {
    const value = equity[i]

    const x =
      equity.length === 1
        ? 0
        : (i / (equity.length - 1)) * 100

    const y =
      45 - ((value - min) / range) * 40

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return (
        <div className="h-28 flex items-center justify-center text-xs opacity-40">
          Waiting for closed trades…
        </div>
      )
    }

    points.push({ x, y })
  }

  // 3️⃣ SVG SOLO SI TODO ES VÁLIDO
  return (
    <svg viewBox="0 0 100 50" className="w-full h-28">
      <polyline
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        points={points.map(p => `${p.x},${p.y}`).join(" ")}
      />

      {/* ❌ SIN CIRCLES = SIN cy NaN */}
      <text x="0" y="48" fontSize="3" fill="#6b7280">
        Start
      </text>
      <text x="92" y="48" fontSize="3" fill="#6b7280">
        Now
      </text>
    </svg>
  )
}
