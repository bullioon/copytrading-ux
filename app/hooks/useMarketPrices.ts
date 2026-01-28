"use client"
import { useEffect, useState } from "react"

type Market = { btc: number; eth: number; sol: number }

function toPos(n: any) {
  const x = Number(n)
  return Number.isFinite(x) && x > 0 ? x : null
}

export default function useMarketPrices(): Market | null {
  const [m, setM] = useState<Market | null>(null)

  useEffect(() => {
    let dead = false

    const tick = async () => {
      try {
        const r = await fetch("/api/market", { cache: "no-store" })
        const j = await r.json()

        const btc = toPos(j?.btc)
        const eth = toPos(j?.eth)
        const sol = toPos(j?.sol)
        if (!btc || !eth || !sol) return

        ;(window as any).__btc = btc
        ;(window as any).__eth = eth
        ;(window as any).__sol = sol

        if (!dead) setM({ btc, eth, sol })
      } catch {
        // ignore
      }
    }

    tick()
    const t = setInterval(tick, 1200)
    return () => {
      dead = true
      clearInterval(t)
    }
  }, [])

  return m
}