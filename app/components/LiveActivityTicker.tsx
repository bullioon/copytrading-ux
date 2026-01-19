"use client"

import { useEffect, useState } from "react"

type EventItem = {
  text: string
}

const EVENTS: EventItem[] = [
  { text: "User #4821 just secured +$214" },
  { text: "Bullion capital increased by $500" },
  { text: "Torion pool hit a new equity high" },
  { text: "Execution bonus unlocked" },
  { text: "New account activated" },
]

export default function LiveActivityTicker() {
  const [event, setEvent] = useState<EventItem>(EVENTS[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)])
    }, 2800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 border border-green-900/50 bg-black/70 rounded-md px-4 py-2 text-xs text-green-300 glow-soft">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
      </span>
      <span className="tracking-wide">{event.text}</span>
    </div>
  )
}
