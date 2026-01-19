import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const revalidate = 0

type Cache = { ts: number; payload: any }

// ✅ cache global en memoria (vive mientras el server dev esté vivo)
const g = globalThis as any
if (!g.__PRICE_CACHE) g.__PRICE_CACHE = { ts: 0, payload: null } as Cache

export async function GET() {
  const now = Date.now()
  const cache: Cache = g.__PRICE_CACHE

  // ✅ si tenemos cache reciente (<30s), lo servimos SIN pegarle a CoinGecko
  if (cache.payload && now - cache.ts < 30_000) {
    return NextResponse.json(cache.payload)
  }

  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    })

    if (!r.ok) {
      // ✅ si CoinGecko falla, NO mates todo: regresa cache viejo si existe
      if (cache.payload) return NextResponse.json(cache.payload)
      return NextResponse.json({ ok: false, error: "coingecko_failed", status: r.status }, { status: 502 })
    }

    const raw = await r.json()

    const payload = {
      ok: true,
      btc: raw?.bitcoin?.usd,
      eth: raw?.ethereum?.usd,
      sol: raw?.solana?.usd,
      raw,
    }

    // ✅ guarda cache bueno
    g.__PRICE_CACHE = { ts: now, payload }

    return NextResponse.json(payload)
  } catch (e) {
    // ✅ si truena fetch, igual regresa cache viejo si existe
    if (cache.payload) return NextResponse.json(cache.payload)
    return NextResponse.json({ ok: false, error: "prices_exception" }, { status: 502 })
  }
}
