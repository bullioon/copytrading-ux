import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const { publicKey, signature, lamports, usdAmount } = body as {
    publicKey: string
    signature: string // tx signature
    lamports: number
    usdAmount: number
  }

  if (!publicKey || !signature || !lamports) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 })
  }

  // MVP: guardamos en cookie/local logic luego, por ahora regresamos ok.
  // En producción esto iría a DB (deposits table).
  return NextResponse.json({
    ok: true,
    deposit: {
      publicKey,
      signature,
      lamports,
      usdAmount: usdAmount ?? null,
      status: "pending",
      createdAt: Date.now(),
    },
  })
}
