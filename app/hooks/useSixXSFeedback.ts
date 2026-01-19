"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Kind = "info" | "good" | "warn"

export function useSixXSFeedback({ items }: { items: { id: string }[] }) {
  const [pulseClass, setPulseClass] = useState("")
  const unlockedRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const last = useMemo(() => (items.length ? items[items.length - 1] : null), [items])

  useEffect(() => {
    if (!last) return
    setPulseClass("burst-terminal")
    const t = setTimeout(() => setPulseClass(""), 260)
    return () => clearTimeout(t)
  }, [last?.id])

  function unlockAudioOnce() {
    if (unlockedRef.current) return
    unlockedRef.current = true
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
      const ctx = audioCtxRef.current ?? new Ctx()
      audioCtxRef.current = ctx

      // “silent ping” para desbloquear
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0.00001
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.01)
    } catch {}
  }

  function playTone(kind: Kind) {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
      const ctx = audioCtxRef.current ?? new Ctx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.value = kind === "good" ? 880 : kind === "warn" ? 220 : 440

      gain.gain.value = 0.0001
      osc.connect(gain)
      gain.connect(ctx.destination)

      const t0 = ctx.currentTime
      gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12)

      osc.start(t0)
      osc.stop(t0 + 0.14)
    } catch {}
  }

  return { pulseClass, playTone, unlockAudioOnce }
}
