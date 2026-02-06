import { NextResponse } from "next/server"

export const revalidate = 20

export async function GET() {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    const r = await fetch(url, {
      next: { revalidate: 20 },
      headers: { Accept: "application/json" },
    })

    if (!r.ok) {
      // IMPORTANT: no regreses 200 si falló, porque eso te mata el usd en confirm
      return NextResponse.json(
        { ok: false, solUsd: 0, ts: Date.now(), error: `price fetch failed ${r.status}` },
        { status: 503 }
      )
    }

    const j = await r.json()
    const price = Number(j?.solana?.usd ?? 0)

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { ok: false, solUsd: 0, ts: Date.now(), error: "bad price" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { ok: true, solUsd: price, ts: Date.now(), source: "coingecko" },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
        },
      }
    )
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, solUsd: 0, ts: Date.now(), error: e?.message ?? "unknown" },
      { status: 503 }
    )
  }
}
