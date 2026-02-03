import { NextResponse } from "next/server"
import { readSession } from "@/lib/session"
import { db, FieldValue } from "@/lib/firebaseAdmin"
import { Connection, PublicKey } from "@solana/web3.js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ================= CONFIG ================= */

type Tier = "BULLION" | "HELLION" | "TORION"

const PRICES: Record<Tier, number> = { BULLION: 300, HELLION: 1500, TORION: 3000 }

// USDC mainnet mint
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
const USDC_DECIMALS = 6

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || ""
  const part = cookie
    .split(";")
    .map(s => s.trim())
    .find(s => s.startsWith(name + "="))
  return part ? decodeURIComponent(part.split("=").slice(1).join("=")) : null
}

function asTier(x: any): Tier | null {
  const t = String(x || "").toUpperCase()
  if (t === "BULLION" || t === "HELLION" || t === "TORION") return t
  return null
}

function toBaseUnits(amountUi: number) {
  // exact integer dollars -> base units
  return BigInt(amountUi) * BigInt(10 ** USDC_DECIMALS)
}

/**
 * Extract payer + verify the tx paid exact USDC amount to treasury ATA.
 * Uses parsed transaction meta (reliable for SPL transfers).
 */
async function verifyUsdcPayment({
  rpcUrl,
  signature,
  tier,
  treasury,
}: {
  rpcUrl: string
  signature: string
  tier: Tier
  treasury: string
}): Promise<{ payer: string }> {
  const connection = new Connection(rpcUrl, "confirmed")

  const tx = await connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  })

  if (!tx) throw new Error("Transaction not found / not confirmed yet")

  // payer: feePayer is always index 0 in message account keys for legacy tx
  const payer = tx.transaction.message.accountKeys?.[0]?.pubkey?.toBase58?.()
  if (!payer) throw new Error("Cannot read payer from tx")

  const treasuryPk = new PublicKey(treasury)
  const expected = toBaseUnits(PRICES[tier])

  // We validate via token balance deltas on the destination ATA
  // Find token balance entries related to USDC mint and owned by treasury
  const pre = tx.meta?.preTokenBalances || []
  const post = tx.meta?.postTokenBalances || []

  // Get destination ATA by mint+owner: use post token balances owner==treasury & mint==USDC
  // Note: parsed meta contains `owner` and `mint` strings.
  const postTreasury = post.filter(b => b.mint === USDC_MINT.toBase58() && b.owner === treasuryPk.toBase58())
  if (postTreasury.length === 0) {
    throw new Error("No USDC credited to treasury in this tx")
  }

  // We need delta for the credited account(s). In normal flow it's exactly one ATA.
  let totalDelta = BigInt(0)

  for (const p of postTreasury) {
    const idx = p.accountIndex
    const preMatch = pre.find(b => b.accountIndex === idx)
    const preAmt = preMatch?.uiTokenAmount?.amount ? BigInt(preMatch.uiTokenAmount.amount) : BigInt(0)
    const postAmt = p.uiTokenAmount?.amount ? BigInt(p.uiTokenAmount.amount) : BigInt(0)
    const delta = postAmt - preAmt
    if (delta > 0) totalDelta += delta
  }

  if (totalDelta !== expected) {
    throw new Error(`Invalid amount. Expected ${expected.toString()} base units, got ${totalDelta.toString()}`)
  }

  // Extra sanity: ensure tx succeeded
  if (tx.meta?.err) throw new Error("Transaction failed on-chain")

  return { payer }
}

/* ================= ROUTE ================= */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const tier = asTier(body?.tier)
    const signature = String(body?.signature || "")

    if (!tier) return NextResponse.json({ error: "Missing/invalid tier" }, { status: 400 })
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || ""
    const treasury = process.env.NEXT_PUBLIC_TREASURY_WALLET || ""

    if (!rpcUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_SOLANA_RPC_URL" }, { status: 500 })
    if (!treasury) return NextResponse.json({ error: "Missing NEXT_PUBLIC_TREASURY_WALLET" }, { status: 500 })

    // ✅ BULLION requires auth (your choice)
    if (tier === "BULLION") {
      const token = getCookie(req, "ct_session")
      if (!token) return NextResponse.json({ error: "Not authed" }, { status: 401 })

      const payload = await readSession(token)
      const address = payload?.address
      if (!address) return NextResponse.json({ error: "Bad session" }, { status: 401 })

      // Optional: you could also require signature for Bullion if you want deposits there.
      await db.collection("access").doc(address).set(
        {
          address,
          tier,
          active: true,
          source: "session",
          signature,
          activatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      return NextResponse.json({ ok: true, address, tier }, { status: 200 })
    }

    // ✅ HELLION/TORION: NO LOGIN. VERIFY PAYMENT ON-CHAIN.
    const { payer } = await verifyUsdcPayment({ rpcUrl, signature, tier, treasury })

    await db.collection("access").doc(payer).set(
      {
        address: payer,
        tier,
        active: true,
        source: "onchain",
        signature,
        activatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, address: payer, tier }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Activate failed" }, { status: 500 })
  }
}

// (opcional) para que no te confunda si pegas en el browser:
export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST" }, { status: 405 })
}
