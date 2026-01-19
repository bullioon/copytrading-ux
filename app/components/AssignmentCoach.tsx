"use client"

import { useEffect, useMemo, useState } from "react"

export type AssignmentCoachProps = {
  step: 1 | 2 | 3
  anchorId: string
  title: string
  subtitle: string
  cta: string
  onCta?: () => void
  onSkip?: () => void
}

export default function AssignmentCoach({
  step,
  anchorId,
  title,
  subtitle,
  cta,
  onCta,
  onSkip,
}: AssignmentCoachProps) {
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  useEffect(() => {
    function compute() {
      const el = document.getElementById(anchorId)
      if (!el) {
        setPos(null)
        return
      }
      const r = el.getBoundingClientRect()
      setPos({ x: r.left, y: r.top, w: r.width, h: r.height })
    }

    compute()
    window.addEventListener("resize", compute)
    window.addEventListener("scroll", compute, true)

    const t = setInterval(compute, 350)
    return () => {
      clearInterval(t)
      window.removeEventListener("resize", compute)
      window.removeEventListener("scroll", compute, true)
    }
  }, [anchorId])

  const badge = useMemo(() => {
    if (step === 1) return "STEP 1/3"
    if (step === 2) return "STEP 2/3"
    return "STEP 3/3"
  }, [step])

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {pos && (
        <div
          className="absolute rounded-3xl border border-white/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.68)]"
          style={{
            left: Math.max(10, pos.x - 10),
            top: Math.max(10, pos.y - 10),
            width: pos.w + 20,
            height: pos.h + 20,
            background: "rgba(0,0,0,0.35)",
          }}
        />
      )}

      <div className="absolute left-1/2 top-[12%] w-[min(560px,92vw)] -translate-x-1/2">
        <div className="rounded-3xl border border-white/10 bg-black/85 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.65)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-widest text-white/45">{badge}</div>
              <div className="mt-1 text-lg font-semibold text-white/85">{title}</div>
              <div className="mt-1 text-[12px] text-white/60 leading-relaxed">{subtitle}</div>
            </div>

            <button
              onClick={onSkip}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] tracking-widest text-white/55 hover:bg-white/5"
            >
              SKIP
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-[10px] text-white/35">tip: sigue el highlight (cuadro iluminado)</div>

            <button
              onClick={onCta}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold tracking-widest text-white/80 hover:bg-white/10"
            >
              {cta}
            </button>
          </div>

          <div className="mt-4 h-px w-full bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.18),transparent)]" />
        </div>
      </div>
    </div>
  )
}
