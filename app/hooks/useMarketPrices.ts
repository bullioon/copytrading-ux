"use client"
import { useEffect, useRef, useState } from "react"

export function useMarketPrices() {
  const [market, setMarket] = useState<any>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    let alive = true

    const tick = async () => {
      if (fetchingRef.current) return
      fetchingRef.current = true

      try {
        const r = await fetch("/api/price", { cache: "no-store" })

        if (!r.ok) {
          console.log("[MARKET] /api/price failed", r.status)
          return
        }

        const j = await r.json()
        if (!alive || !j?.ok) return

        setMarket({
          btc: { usd: j.btc },
          eth: { usd: j.eth },
          sol: { usd: j.sol },
        })
      } catch (e) {
        console.log("[MARKET] exception", e)
      } finally {
        fetchingRef.current = false
      }
    }

    tick()
    const t = setInterval(tick, 15_000) // ⬅️ NO 5s, 15s

    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  return market
}
