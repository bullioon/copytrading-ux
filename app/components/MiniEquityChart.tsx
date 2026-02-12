"use client"

type Point = { x: number; y: number }

export default function MiniEquityChart({ equity }: { equity: number[] }) {
  // 1) Normaliza: si hay NaN/undefined, lo reemplazamos por el último valor válido
  const clean: number[] = []
  let last = 0

  if (Array.isArray(equity)) {
    for (let i = 0; i < equity.length; i++) {
      const v = equity[i]
      if (typeof v === "number" && Number.isFinite(v)) {
        last = v
        clean.push(v)
      } else {
        // reemplaza basura por el último bueno
        clean.push(last)
      }
    }
  }

  // si no hay nada válido, placeholder
  if (!clean.length) {
    return (
      <div className="h-28 flex items-center justify-center text-xs opacity-40">
        Waiting for data…
      </div>
    )
  }

  // 2) Si solo hay 1 punto, dibuja línea flat (2 puntos iguales)
  const series = clean.length === 1 ? [clean[0], clean[0]] : clean

  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1

  const points: Point[] = []
  for (let i = 0; i < series.length; i++) {
    const value = series[i]
    const x = series.length === 1 ? 0 : (i / (series.length - 1)) * 100
    const y = 45 - ((value - min) / range) * 40
    points.push({ x, y })
  }

  const pts = points.map(p => `${p.x},${p.y}`).join(" ")

  return (
    <svg viewBox="0 0 100 50" className="w-full h-28">
      <polyline fill="none" stroke="#4ade80" strokeWidth="2" points={pts} />

      <text x="0" y="48" fontSize="3" fill="#6b7280">
        Start
      </text>
      <text x="92" y="48" fontSize="3" fill="#6b7280">
        Now
      </text>
    </svg>
  )
}