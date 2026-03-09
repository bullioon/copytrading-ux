import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

type Chain = "SOL" | "BTC"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const chain = String(body?.chain || "SOL").toUpperCase() as Chain
    const amountUsd = Number(body?.amountUsd || 0)

    if (!["SOL", "BTC"].includes(chain)) {
      return NextResponse.json({ error: "Invalid chain" }, { status: 400 })
    }

    if (!Number.isFinite(amountUsd) || amountUsd < 100) {
      return NextResponse.json({ error: "Minimum deposit is $100" }, { status: 400 })
    }

    const solAddr = process.env.TREASURY_SOL || process.env.NEXT_PUBLIC_TREASURY_SOL
    const btcAddr = process.env.TREASURY_BTC || process.env.NEXT_PUBLIC_TREASURY_BTC

    const address = chain === "SOL" ? solAddr : btcAddr
    if (!address) {
      return NextResponse.json({ error: `Missing treasury address for ${chain}` }, { status: 500 })
    }

    const now = Date.now()
    const expiresAt = now + 15 * 60 * 1000 // 15 min

    const uri =
      chain === "SOL"
        ? `solana:${address}`
        : `bitcoin:${address}`

    const ref = await db.collection("enterLabDeposits").add({
      status: "pending",
      chain,
      amountUsd,
      address,
      uri,
      createdAt: now,
      expiresAt,
    })

    return NextResponse.json({
      id: ref.id,
      status: "pending",
      chain,
      amountUsd,
      address,
      uri,
      expiresAt,
    })
  } catch (e: any) {
    console.error("enterlab/deposit POST error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST only" })
}