import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing order id" },
        { status: 400 }
      )
    }

    const snap = await db.collection("challengeOrders").doc(id).get()

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: snap.data(),
    })
  } catch (err: any) {
    console.error("challenge/status error:", err)
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to get challenge status" },
      { status: 500 }
    )
  }
}