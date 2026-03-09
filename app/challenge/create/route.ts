import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"
import type { ChallengeOrder } from "@/app/challenge/store"

const wallets = {
  SOL: "DXcVSRYc4KKofURXEytKFAUGVwfy4Jf1UT8jVwx7KVEP",
  BTC: "bc1pldevpdyczz7gp2x3kpnpqve4sqy0x89z9uedktatjc998ulrvs7q7z844l",
} as const

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { level, amount, asset, userId } = body ?? {}

    if (!level || !amount || !asset) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const upperAsset = String(asset).toUpperCase() as "SOL" | "BTC"

    if (!wallets[upperAsset]) {
      return NextResponse.json(
        { success: false, error: "Unsupported asset" },
        { status: 400 }
      )
    }

    const ref = db.collection("challengeOrders").doc()

    const order: ChallengeOrder = {
      id: ref.id,
      type: "challenge_fee",
      level: String(level).toUpperCase(),
      amountUsd: Number(amount),
      asset: upperAsset,
      walletAddress: wallets[upperAsset],
      status: "pending",
      createdAt: Date.now(),
      txHash: null,
      challengeActivated: false,
      confirmedAt: null,
      userId: userId || null,
    }

    await ref.set(order)

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (err: any) {
    console.error("challenge/create error:", err)
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create challenge order" },
      { status: 500 }
    )
  }
}