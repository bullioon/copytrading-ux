import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id } = body ?? {}

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing order id" },
        { status: 400 }
      )
    }

    const ref = db.collection("challengeOrders").doc(id)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    const existing = snap.data()

    const updated = {
      ...existing,
      status: "confirmed",
      confirmedAt: Date.now(),
      txHash: `mock_tx_${Date.now()}`,
      challengeActivated: true,
    }

    await ref.set(updated, { merge: true })

    if (existing?.userId) {
      await db.collection("users").doc(existing.userId).set(
        {
          traderChallenge: {
            active: true,
            level: existing.level,
            sourceOrderId: id,
            activatedAt: Date.now(),
          },
        },
        { merge: true }
      )
    }

    return NextResponse.json({
      success: true,
      order: updated,
    })
  } catch (err: any) {
    console.error("challenge/mock-confirm error:", err)
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to confirm challenge order" },
      { status: 500 }
    )
  }
}