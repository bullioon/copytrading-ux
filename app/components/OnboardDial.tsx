"use client"

import React, { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export type Tier = "BULLION" | "HELLION" | "TORION"

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1"
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

const TIER_ARC: Record<Tier, { a0: number; a1: number; label: string; glow: string }> = {
  BULLION: { a0: 210, a1: 300, label: "Conservative", glow: "rgba(34,197,94,0.22)" },
  HELLION: { a0: 300, a1: 30, label: "Dynamic", glow: "rgba(239,68,68,0.20)" },
  TORION: { a0: 30, a1: 120, label: "Institutional", glow: "rgba(168,85,247,0.22)" },
}

function normAngles(a0: number, a1: number) {
  if (a1 < a0) return { start: a0, end: a1 + 360 }
  return { start: a0, end: a1 }
}

export function OnboardDial({
  tier,
  status,
}: {
  tier: Tier
  status: "idle" | "arming" | "live"
}) {
  const [spark, setSpark] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSpark((s) => (s + 1) % 9999), 1400)
    return () => clearInterval(t)
  }, [])

  const arc = useMemo(() => {
    const { a0, a1 } = TIER_ARC[tier]
    return normAngles(a0, a1)
  }, [tier])

  const spin = status === "live" ? 18 : status === "arming" ? 8 : 0
  const label = TIER_ARC[tier].label
  const glow = TIER_ARC[tier].glow

  const cx = 160
  const cy = 160
  const rOuter = 132
  const rInner = 108

  const seg1 = arcPath(cx, cy, rOuter, arc.start, arc.end)
  const seg2 = arcPath(cx, cy, rInner, arc.start, arc.end)

  return (
    <div className="relative mx-auto h-[260px] w-[320px]">
      <div
        className="absolute inset-0 rounded-[32px]"
        style={{
          background: `radial-gradient(260px 160px at 50% 52%, ${glow}, rgba(0,0,0,0) 60%)`,
          opacity: 0.9,
        }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: 320, height: 320, translateX: "-50%", translateY: "-50%" }}
        animate={{ rotate: spin }}
        transition={{ type: "spring", stiffness: 40, damping: 18 }}
      >
        <svg width="320" height="320" viewBox="0 0 320 320">
          <path
            d={arcPath(cx, cy, rOuter, 200, 520)}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          <motion.path
            key={`outer-${tier}-${spark}`}
            d={seg1}
            fill="none"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="16"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6 }}
          />

          <motion.path
            key={`inner-${tier}-${spark}`}
            d={seg2}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          />
        </svg>
      </motion.div>

      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-[10px] tracking-widest text-white/40">
          TAILORED RISK MANAGEMENT
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 inline-flex items-center rounded-xl border border-white/10 bg-black/45 px-4 py-2"
            style={{ boxShadow: `0 0 34px ${glow}` }}
          >
            <span className="text-[12px] font-semibold tracking-widest text-white/85">
              {label}
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="mt-2 text-[10px] tracking-widest text-white/35">
          status: <span className="text-white/70">{status.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
