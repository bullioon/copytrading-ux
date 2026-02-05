"use client"

import { useEffect, useMemo, useState } from "react"

type Kind = "good" | "info" | "warn"

type FeedEvent = {
  id: string
  handle: string
  action: string
  kind: Kind
  ts: number
}

/** nombres que van rotando */
const HANDLES = [
  "mike89",
  "mordon87",
  "operator_013",
  "routewatch",
  "ax_runner",
  "nyx_grid",
  "orion_ops",
  "vega_edge",
  "kronos_core",
  "shdw_202",
  "lucid_77",
  "cold_alpha",
]

const ACTIONS: Array<{ text: (h: string) => string; kind: Kind }> = [
  { text: h => `${h} withdrew +$309`, kind: "good" },
  { text: h => `${h} joined`, kind: "info" },
  { text: h => `${h} closed +$87.10`, kind: "good" },
  { text: h => `${h} hit new equity high`, kind: "good" },
  { text: h => `${h} routed into SAFE mode`, kind: "info" },
  { text: h => `${h} triggered DD guard`, kind: "warn" },
]

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

/** avatar “pixel” determinístico (sin libs, sin APIs) */
function hashColor(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = (h ^ seed.charCodeAt(i)) * 16777619
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 80% 60%)`
}

function PixelAvatar({ handle }: { handle: string }) {
  const c = useMemo(() => hashColor(handle), [handle])
  const initials = useMemo(() => {
    const s = String(handle || "u").replace(/[^a-z0-9]/gi, "")
    return (s.slice(0, 2) || "u").toUpperCase()
  }, [handle])

  return (
    <div
      className="relative h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-black/40"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 22px rgba(34,197,94,0.10)` }}
      title={handle}
    >
      {/* pixel noise overlay */}
      <div className="absolute inset-0 rounded-xl opacity-[0.25] [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:6px_6px]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="grid grid-cols-2 gap-0.5 rounded-lg p-1"
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <span className="h-2 w-2 rounded-[3px]" style={{ background: c, opacity: 0.95 }} />
          <span className="h-2 w-2 rounded-[3px]" style={{ background: "rgba(255,255,255,0.18)" }} />
          <span className="h-2 w-2 rounded-[3px]" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span className="h-2 w-2 rounded-[3px]" style={{ background: c, opacity: 0.75 }} />
        </div>
      </div>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-black/60 px-1.5 py-[2px] text-[8px] tracking-widest text-white/70">
        {initials}
      </div>
    </div>
  )
}

export default function LiveActivityFeed({
  className = "",
  glow = "rgba(34,197,94,0.14)",
  intervalMs = 2200,
  maxItems = 3,
}: {
  className?: string
  glow?: string
  intervalMs?: number
  maxItems?: number
}) {
  const [items, setItems] = useState<FeedEvent[]>(() => {
    // arranque con 3
    const now = Date.now()
    return Array.from({ length: maxItems }).map((_, i) => {
      const handle = pick(HANDLES)
      const a = pick(ACTIONS)
      return {
        id: uid(),
        handle,
        action: a.text(handle),
        kind: a.kind,
        ts: now - (maxItems - i) * 700,
      }
    })
  })

  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => {
        const handle = pick(HANDLES)
        const a = pick(ACTIONS)
        const next: FeedEvent = {
          id: uid(),
          handle,
          action: a.text(handle),
          kind: a.kind,
          ts: Date.now(),
        }
        const merged = [next, ...prev].slice(0, maxItems)
        return merged
      })
    }, intervalMs)

    return () => clearInterval(t)
  }, [intervalMs, maxItems])

  return (
    <div
      className={[
        "rounded-[22px] border border-white/10 bg-black/40 p-4",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
        className,
      ].join(" ")}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 38px ${glow}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <div className="text-[10px] tracking-widest text-white/60">LIVE ACTIVITY</div>
        </div>
        <div className="text-[10px] tracking-widest text-white/35">AUTO</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.map(ev => {
          const tone =
            ev.kind === "warn"
              ? "border-rose-300/15 bg-rose-300/5 text-rose-50/85"
              : ev.kind === "good"
              ? "border-emerald-300/15 bg-emerald-300/5 text-emerald-50/85"
              : "border-white/10 bg-black/35 text-white/80"

          return (
            <div
              key={ev.id}
              className={[
                "flex items-center gap-3 rounded-2xl border px-3 py-2",
                "transition-all",
                tone,
              ].join(" ")}
            >
              <PixelAvatar handle={ev.handle} />

              <div className="min-w-0 flex-1">
                <div className="text-[12px] leading-snug truncate">{ev.action}</div>
                <div className="mt-0.5 text-[10px] text-white/35">
                  {new Date(ev.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div className="text-[10px] tracking-widest text-white/35">LIVE</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
