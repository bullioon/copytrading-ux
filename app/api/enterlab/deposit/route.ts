import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin" // ajusta si tu path es diferente

const BONUS_MAP: Record<number, number> = {
  300: 80,
  500: 200,
  1000: 500,
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const depositAmount = Number(body?.depositAmount || 0)

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }
    if (![300, 500, 1000].includes(depositAmount)) {
      return NextResponse.json({ error: "Invalid depositAmount" }, { status: 400 })
    }

    const bonusAmount = BONUS_MAP[depositAmount]

    const ref = await db.collection("enterLabDeposits").add({
      email,
      depositAmount,
      bonusAmount,
      status: "pending",
      createdAt: Date.now(),
    })

    return NextResponse.json({ ok: true, id: ref.id })
  } catch (e: any) {
    console.error("enterlab/deposit POST error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

// opcional: para que no te confunda si visitas la URL en el browser
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST only" })
}