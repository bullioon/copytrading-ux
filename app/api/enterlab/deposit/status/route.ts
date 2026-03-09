import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

type Chain = "SOL" | "BTC"
type Tier = "BULLION" | "HELLION" | "TORION"

const MIN_BULLION_USD = 100

function asTier(v: any): Tier {
  const t = String(v || "BULLION").toUpperCase()
  if (t === "HELLION") return "HELLION"
  if (t === "TORION") return "TORION"
  return "BULLION"
}

function asChain(v: any): Chain {
  const c = String(v || "SOL").toUpperCase()
  if (c === "BTC") return "BTC"
  return "SOL"
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const tier = asTier(body?.tier)
    const chain = asChain(body?.chain)

    // uno de los dos para identificar al usuario
    const email = String(body?.email || "").trim().toLowerCase()
    const wallet = String(body?.wallet || "").trim()

    if (!email && !wallet) {
      return NextResponse.json({ error: "Missing identifier (email or wallet)" }, { status: 400 })
    }

    const amountUsd = Number(body?.amountUsd || 0)
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "Invalid amountUsd" }, { status: 400 })
    }

    // ✅ Bullion: mínimo $100
    if (tier === "BULLION" && amountUsd < MIN_BULLION_USD) {
      return NextResponse.json(
        { error: `BULLION minimum is $${MIN_BULLION_USD}` },
        { status: 400 }
      )
    }

    // Tesorerías por chain (env)
    const treasurySOL = process.env.NEXT_PUBLIC_TREASURY_SOL || process.env.TREASURY_SOL || ""
    const treasuryBTC = process.env.NEXT_PUBLIC_TREASURY_BTC || process.env.TREASURY_BTC || ""

    const address = chain === "SOL" ? treasurySOL : treasuryBTC
    if (!address) {
      return NextResponse.json(
        { error: `Missing treasury address for ${chain} (env)` },
        { status: 500 }
      )
    }

    const now = Date.now()
    const expiresAt = now + 20 * 60 * 1000 // 20 min

    // URI para QR (simple)
    // (Luego refinamos para incluir amount en BTC si quieres.)
    const uri = chain === "BTC" ? `bitcoin:${address}` : `solana:${address}`

    const ref = await db.collection("enterLabDeposits").add({
      // identidad
      email: email || null,
      wallet: wallet || null,

      tier,
      chain,
      amountUsd,

      address,
      uri,

      status: "pending",
      createdAt: now,
      expiresAt,
    })

    return NextResponse.json({
      ok: true,
      id: ref.id,
      tier,
      chain,
      amountUsd,
      address,
      uri,
      status: "pending",
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