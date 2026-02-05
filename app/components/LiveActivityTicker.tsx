"use client"

import { useEffect, useMemo, useState } from "react"

type SocialKind = "WITHDRAW" | "JOINED" | "COPY" | "PAYOUT" | "ALERT"

type EventItem = {
  id: string
  text: string
  kind: SocialKind
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeTickerEvent(): EventItem {
  const user = pick(["mike89", "mordon87", "atlas.exe", "nyx", "kronos", "routewatch", "vega", "orion", "nova", "krato"])
  const kind = pick<SocialKind>(["WITHDRAW", "JOINED", "COPY", "PAYOUT", "ALERT"])
  const v = Math.round(60 + Math.random() * 1500)

  const text =
    kind === "WITHDRAW"
      ? `${user} withdrew +$${v}`
      : kind === "PAYOUT"
        ? `${user} payout processed +$${v}`
        : kind === "JOINED"
          ? `${user} joined the terminal`
          : kind === "ALERT"
            ? `${user} latency route enabled`
            : `${user} is copying AX · mirroring entry`

  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, kind }
}

function tone(kind: SocialKind) {
  if (kind === "WITHDRAW" || kind === "PAYOUT") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
  if (kind === "ALERT") return "border-rose-300/20 bg-rose-300/10 text-rose-100"
  if (kind === "JOINED") return "border-sky-300/20 bg-sky-300/10 text-sky-100"
  return "border-violet-300/20 bg-violet-300/10 text-violet-100"
}

export default function LiveActivityTicker({
  glow = "rgba(74,222,128,0.14)",
}: {
  glow?: string
}) {
  const [event, setEvent] = useState<EventItem>(() => makeTickerEvent())

  useEffect(() => {
    const interval = setInterval(() => setEvent(makeTickerEvent()), 2600)
    return () => clearInterval(interval)
  }, [])

  const dot = useMemo(() => {
    if (event.kind === "ALERT") return "bg-rose-300"
    if (event.kind === "JOINED") return "bg-sky-300"
    if (event.kind === "COPY") return "bg-violet-300"
    return "bg-emerald-300"
  }, [event.kind])

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/55 px-4 py-2 text-xs text-white/80 glow-soft overflow-hidden"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 28px ${glow}` }}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-50`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>

      <span className={`inline-flex rounded-xl border px-2 py-1 text-[10px] tracking-widest ${tone(event.kind)}`}>
        {event.kind}
      </span>

      <span className="min-w-0 truncate tracking-wide">{event.text}</span>
    </div>
  )
}
