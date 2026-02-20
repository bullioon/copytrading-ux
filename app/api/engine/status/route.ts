import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function cleanWallet(w: unknown) {
  const s = String(w || "").trim()
  if (s.length < 20) return ""
  return s
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = cleanWallet(searchParams.get("wallet"))
    if (!wallet) return NextResponse.json({ ok: false, error: "missing wallet" }, { status: 400 })

    const doc = await db.collection("engineRuns").doc(wallet).get()
    if (!doc.exists) return NextResponse.json({ ok: true, run: null })

    return NextResponse.json({ ok: true, run: doc.data() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}