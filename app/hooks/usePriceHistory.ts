"use client"

import { useEffect, useState } from "react"

type PricePoint = {
  price: number
  time: number
}

export function usePriceHistory(price?: number) {
  const [history, setHistory] = useState<PricePoint[]>([])

  useEffect(() => {
    if (!price) return

    setHistory((prev) => {
      const next = [
        ...prev,
        {
          price,
          time: Date.now(),
        },
      ]

      // mantenemos solo los últimos 30 puntos
      return next.slice(-30)
    })
  }, [price])

  return history
}

