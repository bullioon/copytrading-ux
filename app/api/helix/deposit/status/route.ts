import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = String(searchParams.get("id") || "").trim()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      )
    }

    const snap = await db.collection("helixDeposits").doc(id).get()

    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "Deposit not found" },
        { status: 404 }
      )
    }

    const data = snap.data() || {}

    return NextResponse.json({
      ok: true,
      id,
      status: data.status || "pending",
      product: data.product || "HELIX MIRROR ENGINE",
      amountUsd: data.amountUsd || 140,
      chain: data.chain || "USDC",
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to read HELIX deposit status" },
      { status: 500 }
    )
  }
}
