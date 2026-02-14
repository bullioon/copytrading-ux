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

    const balanceUsd = Number(data?.balanceUsd ?? 0)
    const enginePnlUsd = Number(data?.enginePnlUsd ?? 0)

    const safeBalance = Number.isFinite(balanceUsd) ? balanceUsd : 0
    const safePnl = Number.isFinite(enginePnlUsd) ? enginePnlUsd : 0

    const totalBalanceUsd = safeBalance + safePnl

    return NextResponse.json(
      {
        ok: true,
        wallet,
        balanceUsd: totalBalanceUsd,
        rawBalanceUsd: safeBalance,
        enginePnlUsd: safePnl,
      },
      { status: 200 }
    )
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}

export {}