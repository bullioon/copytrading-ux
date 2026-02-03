"use client"
import { useEffect, useRef, useState } from "react"

type Market = { btc: number; eth: number; sol: number; source?: string; ts?: number }

// defaults “seguros” para que NO se congele la UI si el endpoint falla
const DEFAULT: Market = { btc: 85_000, eth: 2_800, sol: 120, source: "default", ts: Date.now() }

function toPos(n: any) {
  const x = Number(n)
  return Number.isFinite(x) && x > 0 ? x : null
}

export default function useMarketPrices(): Market {
  const [m, setM] = useState<Market>(DEFAULT)
  const lastGoodRef = useRef<Market>(DEFAULT)

  useEffect(() => {
    let dead = false

    const tick = async () => {
      try {
        const r = await fetch("/api/market", { cache: "no-store" })
        const j = await r.json().catch(() => ({}))

        const btc = toPos(j?.btc)
        const eth = toPos(j?.eth)
        const sol = toPos(j?.sol)

        // si vino algo inválido, NO rompas el market; conserva el último bueno
        if (!btc || !eth || !sol) {
          if (!dead) setM(lastGoodRef.current)
          return
        }

        const next: Market = { btc, eth, sol, source: j?.source, ts: j?.ts }
        lastGoodRef.current = next

        ;(window as any).__btc = btc
        ;(window as any).__eth = eth
        ;(window as any).__sol = sol

        if (!dead) setM(next)
      } catch {
        if (!dead) setM(lastGoodRef.current)
      }
    }

    tick()
    const t = setInterval(tick, 1500)
    return () => {
      dead = true
      clearInterval(t)
    }
  }, [])

  return m
}
