import { NextResponse } from "next/server"
import { readSession } from "@/lib/session"
import { db, FieldValue } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || ""
  const part = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="))
  return part ? decodeURIComponent(part.split("=").slice(1).join("=")) : null
}

export async function POST(req: Request) {
  try {
    const token = getCookie(req, "ct_session")
    if (!token) return NextResponse.json({ error: "Not authed" }, { status: 401 })

    const payload = await readSession(token)
    const address = payload.address
    if (!address) return NextResponse.json({ error: "Bad session" }, { status: 401 })

    const body = await req.json().catch(() => null)
    const tier = body?.tier as "BULLION" | "HELLION" | "TORION" | undefined
    if (!tier) return NextResponse.json({ error: "Missing tier" }, { status: 400 })

    const allowed = ["BULLION", "HELLION", "TORION"] as const
    if (!allowed.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    await db.collection("access").doc(address).set(
      {
        address,
        tier,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 })
}