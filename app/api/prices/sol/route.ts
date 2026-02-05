import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 20

export async function GET() {
  try {
    // CoinGecko simple price endpoint /simple/price (SOL->USD) :contentReference[oaicite:0]{index=0}
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    const r = await fetch(url, { next: { revalidate: 20 } })
    if (!r.ok) throw new Error(`price fetch failed ${r.status}`)
    const j = await r.json()

    const price = Number(j?.solana?.usd ?? 0)
    if (!Number.isFinite(price) || price <= 0) throw new Error("bad price")

    return NextResponse.json({ solUsd: price, ts: Date.now(), source: "coingecko" })
  } catch (e: any) {
    return NextResponse.json(
      { solUsd: 0, ts: Date.now(), error: e?.message ?? "unknown" },
      { status: 200 }
    )
  }
}
