import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

function normalizeTier(t?: string | null) {
  const x = (t || "").toUpperCase()
  return x === "BULLION" || x === "HELLION" || x === "TORION" ? x : ""
}

export async function GET() {
  const c = await cookies()

  const token =
    c.get("access_token")?.value ||
    c.get("session")?.value ||
    c.get("token")?.value ||
    ""

  const tier = normalizeTier(c.get("tier")?.value || "")

  if (!token) {
    return NextResponse.json({ ok: true, authed: false, tier: "", active: false }, { status: 200 })
  }

  return NextResponse.json(
    { ok: true, authed: true, tier: tier || "", active: true, address: c.get("address")?.value || null },
    { status: 200 }
  )
}
