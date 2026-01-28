import { NextResponse } from "next/server"
import { readSession } from "@/lib/session"

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

    const payload = await readSession(token)
    return NextResponse.json({ authed: true, address: payload.address }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ authed: false, error: e?.message || "bad session" }, { status: 200 })
  }
}

// Opcional: por si algún fetch accidental pega POST
export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 })
}