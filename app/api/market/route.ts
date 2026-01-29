import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Prices = { btc: number; eth: number; sol: number }
type Cache = { ts: number; data: Prices }
let cache: Cache | null = null

const TTL_MS = 15_000 // 15s cache

async function fetchOne(symbol: string) {
  const r = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "user-agent": "copytrading-ux/1.0",
    },
  })

  if (!r.ok) throw new Error(`binance_${r.status}`)
  const j = await r.json()
  const n = Number(j?.markPrice)
  if (!Number.isFinite(n) || n <= 0) throw new Error("bad_mark_price")
  return n
}

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return NextResponse.json({ ok: true, source: "cache", ...cache.data, ts: cache.ts })
  }

  try {
    const [btc, eth, sol] = await Promise.all([
      fetchOne("BTCUSDT"),
      fetchOne("ETHUSDT"),
      fetchOne("SOLUSDT"),
    ])

    const data: Prices = { btc, eth, sol }
    cache = { ts: Date.now(), data }
    return NextResponse.json({ ok: true, source: "binance", ...data, ts: cache.ts })
  } catch (e: any) {
    if (cache) {
      return NextResponse.json({
        ok: true,
        source: "stale-cache",
        warning: "binance_failed_using_cache",
        error: String(e?.message || e),
        ...cache.data,
        ts: cache.ts,
      })
    }

    return NextResponse.json({
      ok: true,
      source: "fallback",
      warning: "binance_failed_no_cache",
      btc: 0,
      eth: 0,
      sol: 0,
      ts: Date.now(),
    })
  }
}
