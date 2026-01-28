import { NextResponse } from "next/server"

export async function GET() {
  const url =
    "https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D"

  try {
    const r = await fetch(url, { cache: "no-store" })
    if (!r.ok) {
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    const data = (await r.json()) as Array<{ symbol: string; price: string }>
    const map = new Map(data.map(x => [x.symbol, Number(x.price)]))

    const btc = map.get("BTCUSDT")
    const eth = map.get("ETHUSDT")
    const sol = map.get("SOLUSDT")

    if (!btc || !eth || !sol) {
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      btc,
      eth,
      sol,
      ts: Date.now(),
    })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}