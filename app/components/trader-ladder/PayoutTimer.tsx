"use client"

import { useEffect, useMemo, useState } from "react"

type Props = {
  nextPayoutAtISO: string
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

export default function PayoutTimer({ nextPayoutAtISO }: Props) {
  const targetMs = useMemo(() => {
    const ms = Date.parse(nextPayoutAtISO)
    return Number.isFinite(ms) ? ms : Date.now() + 1000 * 60 * 60 * 24 * 7
  }, [nextPayoutAtISO])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = Math.max(0, targetMs - now)
  const totalSec = Math.floor(diff / 1000)

  const days = Math.floor(totalSec / 86400)
  const hrs = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-white/55">NEXT PAYOUT</div>
        <div className="text-[10px] tracking-widest text-white/35">21D WINDOW</div>
      </div>

      <div className="mt-3 text-[22px] font-semibold text-white/90 tabular-nums">
        {days}d {pad2(hrs)}:{pad2(mins)}:{pad2(secs)}
      </div>

      <div className="mt-2 text-[11px] text-white/45">
        Target: <span className="text-white/65">{new Date(targetMs).toLocaleString()}</span>
      </div>
    </div>
  )
}