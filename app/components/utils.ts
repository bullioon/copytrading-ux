export function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

export function formatPct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

export function msToParts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  return { days, hours, mins, secs }
}