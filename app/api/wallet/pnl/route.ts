// app/api/wallet/pnl/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const wallet = String(body?.wallet || "").trim()
    const enginePnlUsd = Number(body?.enginePnlUsd || 0)

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 })
    }

    const pnl = Number.isFinite(enginePnlUsd) ? enginePnlUsd : 0

    await db.collection("users").doc(wallet).set(
      {
        enginePnlUsd: pnl,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, wallet, enginePnlUsd: pnl }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = (searchParams.get("wallet") || "").trim()

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 })
    }

    const snap = await db.collection("users").doc(wallet).get()
    const data = snap.exists ? (snap.data() as any) : null

    const raw = Number(data?.enginePnlUsd ?? 0)
    const enginePnlUsd = Number.isFinite(raw) ? raw : 0

    return NextResponse.json({ ok: true, wallet, enginePnlUsd }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown" }, { status: 500 })
  }
}

export {}
