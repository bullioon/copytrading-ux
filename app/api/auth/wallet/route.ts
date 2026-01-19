import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  const { publicKey, message, signature } = body as {
    publicKey?: string
    message?: string
    signature?: string
  }

  if (!publicKey || !message || !signature) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 }
    )
  }

  // 🔥 DEBUG: esto lo ves en la TERMINAL
  console.log("PHANTOM LOGIN:", publicKey)
  console.log("TREASURY:", process.env.TREASURY_WALLET)

  // MVP: crear sesión simple con cookie
  const res = NextResponse.json({ ok: true, publicKey })

  res.cookies.set("bullions_pk", publicKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })

  return res
}
