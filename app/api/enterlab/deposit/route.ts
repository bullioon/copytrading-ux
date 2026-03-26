import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

type Chain = "SOL" | "BTC" | "USDC"
type Tier = "BULLION" | "HELLION" | "TORION"

const MIN_BULLION_USD = 100

function asTier(v: unknown): Tier {
  const t = String(v || "BULLION").toUpperCase()
  if (t === "HELLION") return "HELLION"
  if (t === "TORION") return "TORION"
  return "BULLION"
}

function asChain(v: unknown): Chain {
  const c = String(v || "SOL").toUpperCase()
  if (c === "BTC") return "BTC"
  if (c === "USDC") return "USDC"
  return "SOL"
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const tier = asTier(body?.tier)
    const chain = asChain(body?.chain)

    const email = String(body?.email || "").trim().toLowerCase()
    const wallet = String(body?.wallet || "").trim()

    const amountUsd = Number(body?.amountUsd || body?.depositAmount || 0)
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "Invalid amountUsd" }, { status: 400 })
    }

    if (tier === "BULLION" && amountUsd < MIN_BULLION_USD) {
      return NextResponse.json(
        { error: `BULLION minimum is $${MIN_BULLION_USD}` },
        { status: 400 }
      )
    }

const treasurySOL =
  process.env.ENTERLAB_TREASURY_SOL ||
  process.env.TREASURY_SOL ||
  ""

const treasuryBTC =
  process.env.ENTERLAB_TREASURY_BTC ||
  process.env.TREASURY_BTC ||
  ""

const treasuryUSDC =
  process.env.ENTERLAB_TREASURY_USDC ||
  process.env.TREASURY_USDC ||
  ""

  
    const TREASURY_MAP: Record<Chain, string> = {
      SOL: treasurySOL,
      BTC: treasuryBTC,
      USDC: treasuryUSDC,
    }

    const address = TREASURY_MAP[chain]
    if (!address) {
      return NextResponse.json(
        {
          error: `V2 Missing treasury address for ${chain}`,
          debugRoute: "ENTERLAB_DEPOSIT_V2",
          debugEnv: {
            hasSOL: !!process.env.TREASURY_SOL,
            hasBTC: !!process.env.TREASURY_BTC,
            hasUSDC: !!process.env.TREASURY_USDC,
          },
        },
        { status: 500 }
      )
    }

    const now = Date.now()
    const expiresAt = now + 20 * 60 * 1000

    let uri = ""
    if (chain === "BTC") {
      uri = `bitcoin:${address}`
    } else {
      uri = `solana:${address}`
    }

    const ref = await db.collection("enterLabDeposits").add({
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
      debugRoute: "ENTERLAB_DEPOSIT_V2",
    })

    return NextResponse.json({
      ok: true,
      debugRoute: "ENTERLAB_DEPOSIT_V2",
      id: ref.id,
      tier,
      chain,
      amountUsd,
      address,
      uri,
      status: "pending",
      expiresAt,
      debugEnv: {
        hasSOL: !!process.env.TREASURY_SOL,
        hasBTC: !!process.env.TREASURY_BTC,
        hasUSDC: !!process.env.TREASURY_USDC,
      },
    })
  } catch (e: any) {
    console.error("enterlab/deposit POST error:", e)
    return NextResponse.json(
      {
        error: e?.message || "Server error",
        debugRoute: "ENTERLAB_DEPOSIT_V2",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST only",
    debugRoute: "ENTERLAB_DEPOSIT_V2",
    env: {
      hasSOL: !!process.env.TREASURY_SOL,
      hasBTC: !!process.env.TREASURY_BTC,
      hasUSDC: !!process.env.TREASURY_USDC,
    },
  })
}