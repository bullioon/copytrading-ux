"use client"

import { useEffect, useState } from "react"

type EventItem = {
  text: string
}

const EVENTS: EventItem[] = [
  { text: "User #4821 closed +$214.32" },
  { text: "Bullion account withdrew $500" },
  { text: "Torion execution reached new equity high" },
  { text: "User #1093 activated Hellion profile" },
  { text: "Performance bonus credited" },
  { text: "User #5520 closed +$87.10" },
  { text: "Torion account withdrew profits" },
]

export default function LiveActivityFeed() {
  const [event, setEvent] = useState<EventItem>(EVENTS[0])

  useEffect(() => {
    const interval = setInterval(() => {
      const next =
        EVENTS[Math.floor(Math.random() * EVENTS.length)]
      setEvent(next)
    }, 3200)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 border border-green-900/50 bg-black/60 rounded-md px-4 py-2 text-xs text-green-300">
      {/* LIVE DOT */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
      </span>

      {/* TEXT */}
      <span className="opacity-80">{event.text}</span>
    </div>
  )
}
