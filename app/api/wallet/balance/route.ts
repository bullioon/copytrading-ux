
import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = (searchParams.get("wallet") || "").trim()

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 })
    }

    const snap = await db.collection("users").doc(wallet).get()
    const data = snap.exists ? (snap.data() as any) : null

    const balanceUsdRaw = Number(data?.balanceUsd ?? 0)
    const balanceUsd = Number.isFinite(balanceUsdRaw) ? balanceUsdRaw : 0

    return NextResponse.json({ ok: true, wallet, balanceUsd }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}

// 👇 esto evita el error “is not a module” si por alguna razón TS lo interpreta como script
export {}