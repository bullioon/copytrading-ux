// app/api/access/me/route.ts
import { NextResponse } from "next/server"
import { readSession } from "@/lib/session"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || ""
  const part = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="))
  return part ? decodeURIComponent(part.split("=").slice(1).join("=")) : null
}

export async function GET(req: Request) {
  try {
    const token = getCookie(req, "ct_session")
    if (!token) return NextResponse.json({ authed: false }, { status: 200 })

    const payload = await readSession(token).catch(() => null)
    const address = payload?.address || ""
    if (!address) return NextResponse.json({ authed: false }, { status: 200 })

    const snap = await db.collection("access").doc(address).get()
    const data = snap.exists ? (snap.data() as any) : null

    return NextResponse.json(
      {
        authed: true,
        address,
        tier: data?.tier || null,
        active: !!data?.false,
        updatedAt: data?.updatedAt || null,
      },
      { status: 200 }
    )
  } catch (e: any) {
    return NextResponse.json({ authed: false, error: e?.message || "Failed" }, { status: 200 })
  }
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 })
}