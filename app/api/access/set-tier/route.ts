// app/api/access/set-tier/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { readSession } from "@/lib/session"
import { setTier } from "@/lib/accessStore"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function normalizeTier(t?: string | null) {
  const x = (t || "").toUpperCase()
  return x === "BULLION" || x === "HELLION" || x === "TORION" ? x : ""
}

export async function POST(req: Request) {
  console.log("🔥 SET-TIER HIT")

  const body = await req.json().catch(() => ({}))
  const tier = normalizeTier(body?.tier)

  if (!tier) return NextResponse.json({ ok: false, error: "bad_tier" }, { status: 400 })

  // ✅ siempre responde 200 (no rompas UX)
  const res = NextResponse.json({ ok: true, tier, marker: "SET_TIER_DB" })

  // cookie (debug/fallback)
  res.cookies.set("tier", tier, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: false,
    secure: false, // localhost
  })

  // ✅ guardar en Firestore si hay sesión
  try {
    const c = await cookies()
    const token =
      c.get("ct_session")?.value ||
      c.get("access_token")?.value ||
      c.get("session")?.value ||
      c.get("token")?.value ||
      ""

    if (!token) {
      console.log("⚠️ set-tier: no token cookie found")
      return res
    }

    const payload: any = await readSession(token).catch(() => null)
    const address =
  payload?.address ||
  payload?.sub ||
  payload?.publicKey ||
  payload?.wallet ||
  ""

    if (!address) {
      console.log("⚠️ set-tier: session ok but no address")
      return res
    }

    await setTier(address, tier as any)
    console.log("✅ set-tier saved in DB", { address, tier })
  } catch (e) {
    console.log("⚠️ set-tier best-effort db error:", e)
  }

  return res
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST" }, { status: 405 })
}