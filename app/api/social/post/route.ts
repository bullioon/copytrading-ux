import { NextResponse } from "next/server"
import { db, FieldValue } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function okEmail(x: string) {
  return /^\S+@\S+\.\S+$/.test(x)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const username = String(body?.username || "").trim()
    const email = String(body?.email || "").trim()
    const text = String(body?.text || "").trim()
    const citizenship = String(body?.citizenship || "OTHER").trim()
    const stars = clamp(Number(body?.stars || 5), 1, 5)

    // bonus gating (MVP): solo exige flags; verificación real después
    const followedIg = !!body?.followed?.instagram
    const followedDiscord = !!body?.followed?.discord
    if (!followedIg || !followedDiscord) {
      return NextResponse.json({ ok: false, error: "Bonus locked. Follow IG + Discord first." }, { status: 400 })
    }

    if (username.length < 2) return NextResponse.json({ ok: false, error: "Username too short" }, { status: 400 })
    if (!okEmail(email)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 })
    if (text.length < 2) return NextResponse.json({ ok: false, error: "Comment too short" }, { status: 400 })
    if (text.length > 240) return NextResponse.json({ ok: false, error: "Comment too long" }, { status: 400 })

    const createdAtMs = Date.now()

    const ref = await db.collection("socialComments").add({
      username,
      email, // ✅ se registra en server
      text,
      stars,
      citizenship,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs, // ✅ para ordenar/mostrar rápido sin depender del Timestamp
      bonusIntent: String(body?.bonusIntent || "bonus80"),
      followed: { instagram: true, discord: true },
      status: "public", // si luego quieres moderación: "pending"
    })

    return NextResponse.json({ ok: true, id: ref.id })
  } catch (e: any) {
    console.error("[/api/social/post] ERROR:", e)
    return NextResponse.json({ ok: false, error: e?.message || "post failed" }, { status: 500 })
  }
}