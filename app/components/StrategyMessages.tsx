"use client"

type Props = {
  selectedTraders: number[]
  connectedTraders: number[]
  isHighRisk: boolean
  isBlocked: boolean
  aggressiveCount: number
}

export default function StrategyMessages({
  selectedTraders,
  connectedTraders,
  isHighRisk,
  isBlocked,
  aggressiveCount,
}: Props) {
  if (isBlocked) {
    return (
      <section className="border border-red-900 rounded p-4 text-xs text-red-400">
        SYSTEM BLOCKED — Risk parameters exceeded
      </section>
    )
  }

  if (isHighRisk) {
    return (
      <section className="border border-yellow-900 rounded p-4 text-xs text-yellow-400">
        High risk detected — adjust roles or exposure
      </section>
    )
  }

  if (connectedTraders.length === 0) {
    return (
      <section className="border border-neutral-800 rounded p-4 text-xs opacity-60">
        No traders connected
      </section>
    )
  }

  return (
    <section className="border border-green-900 rounded p-4 text-xs text-green-400">
      Strategy stable — {connectedTraders.length} traders active
    </section>
  )
}
