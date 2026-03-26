import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const chain = String(body?.chain || "USDC").trim().toUpperCase()
    const amountUsd = Number(body?.amountUsd || 140)
    const product = String(body?.product || "HELIX MIRROR ENGINE").trim()

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid amountUsd" },
        { status: 400 }
      )
    }

    const id = `helix_${Date.now()}_${Math.random().toString(16).slice(2)}`

    const address =
      chain === "BTC"
        ? "bc1qexampleReplaceThisWithRealBTCWallet"
        : "ReplaceThisWithRealSolanaWalletAddress"

    const uri =
      chain === "BTC"
        ? `bitcoin:${address}`
        : `solana:${address}`

    await db.collection("helixDeposits").doc(id).set({
      id,
      product,
      chain,
      amountUsd,
      address,
      uri,
      status: "pending",
      kind: "module",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      ok: true,
      id,
      product,
      chain,
      amountUsd,
      address,
      uri,
      status: "pending",
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to create HELIX deposit" },
      { status: 500 }
    )
  }
}