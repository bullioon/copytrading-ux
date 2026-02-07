import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = (searchParams.get("wallet") || "").trim()
    if (!wallet) return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 })

    const snap = await db
      .collection("deposits")
      .where("from", "==", wallet)
      .orderBy("blockTime", "desc")
      .limit(25)
      .get()

    const items = snap.docs.map(d => {
      const x = d.data() as any
      return {
        id: d.id,
        kind: "DEPOSIT",
        amountUsd: Number(x.usd || 0),
        token: "SOL",
        ts: Number(x.blockTime ? x.blockTime * 1000 : Date.now()),
        status: x.status || "CONFIRMED",
        note: `Deposit · ${String(d.id).slice(0, 6)}…`,
      }
    })

    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown" }, { status: 500 })
  }
}



