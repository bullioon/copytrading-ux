import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing deposit id" },
        { status: 400 }
      )
    }

    const ref = db.collection("enterLabDeposits").doc(id)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      )
    }

    const data = snap.data()

    const now = Date.now()

    // expiración automática
    if (data?.status === "pending" && data?.expiresAt && now > data.expiresAt) {
      await ref.update({
        status: "expired",
      })

      return NextResponse.json({
        status: "expired",
        debugRoute: "ENTERLAB_DEPOSIT_STATUS_V1",
      })
    }

    return NextResponse.json({
      status: data?.status || "pending",
      chain: data?.chain,
      tier: data?.tier,
      amountUsd: data?.amountUsd,
      debugRoute: "ENTERLAB_DEPOSIT_STATUS_V1",
    })
  } catch (e: any) {
    console.error("enterlab/deposit/status error:", e)

    return NextResponse.json(
      {
        error: e?.message || "Server error",
        debugRoute: "ENTERLAB_DEPOSIT_STATUS_V1",
      },
      { status: 500 }
    )
  }
}