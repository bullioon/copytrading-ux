import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // ... tu lógica de verify que genera sessionToken ...

  const sessionToken = "TU_TOKEN" // <- el que ya estás generando

  const isProd = process.env.NODE_ENV === "production"
  const res = NextResponse.json({ ok: true })

  res.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: isProd,          // ✅ en localhost = false, en prod = true
    sameSite: isProd ? "none" : "lax", // ✅ prod cross-site, local normal
    path: "/",               // ✅ importantísimo
    maxAge: 60 * 60 * 24 * 7 // 7 días
  })

  return res
}
