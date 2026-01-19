"use client"

import { useEffect, useState } from "react"

export type SocialPopupData = {
  id: number
  user: string
  level: "PRO" | "TORION"
  performance: number
}

const users = [
  "Ax",
  "Carlos",
  "Luis",
  "Mateo",
  "Ivan",
  "Sebas",
  "Nico",
  "Andres",
  "Javier",
  "Pablo",
]

export default function useSocialProof() {
  const [popup, setPopup] = useState<SocialPopupData | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const level = Math.random() > 0.7 ? "TORION" : "PRO"

      const performance =
        level === "TORION"
          ? 800 + Math.random() * 2200
          : 400 + Math.random() * 800

      setPopup({
        id: Date.now(),
        user: users[Math.floor(Math.random() * users.length)],
        level,
        performance: Math.floor(performance),
      })

      const hide = setTimeout(() => setPopup(null), 5000)
      return () => clearTimeout(hide)
    }, 15000 + Math.random() * 20000)

    return () => clearTimeout(timeout)
  }, [])

  return popup
}
