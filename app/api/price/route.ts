import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Cache = { ts: number; data: any }
let cache: Cache | null = null

const TTL_MS = 60_000 // 60s cache

async function fetchCoingecko() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"

  const r = await fetch(url, {
    headers: {
      accept: "application/json",
      // ayuda a que no te tiren tan fácil
      "user-agent": "copytrading-ux/1.0",
    },
    // Next cache a nivel server (no siempre basta, pero ayuda)
    next: { revalidate: 60 },
  })

  if (!r.ok) {
    const text = await r.text().catch(() => "")
    return { ok: false as const, status: r.status, text }
  }

  const json = await r.json()
  return { ok: true as const, json }
}

export async function GET() {
  // 1) si hay cache fresco, úsalo
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return NextResponse.json({ ok: true, source: "cache", ...cache.data })
  }

  // 2) intenta coingecko
  const cg = await fetchCoingecko()

  if (cg.ok) {
    const data = {
      btc: cg.json.bitcoin?.usd ?? 0,
      eth: cg.json.ethereum?.usd ?? 0,
      sol: cg.json.solana?.usd ?? 0,
    }
    cache = { ts: Date.now(), data }
    return NextResponse.json({ ok: true, source: "coingecko", ...data })
  }

  // 3) si coingecko falla (429), devuelve último cache si existe
  if (cache) {
    return NextResponse.json({
      ok: true,
      source: "stale-cache",
      warning: "coingecko_rate_limited",
      ...cache.data,
    })
  }

  // 4) si no hay cache, devuelve fallback (para NO congelar UI)
  return NextResponse.json({
    ok: true,
    source: "fallback",
    warning: `coingecko_failed_${cg.status}`,
    btc: 0,
    eth: 0,
    sol: 0,
  })
}