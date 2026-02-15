import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Endpoint placeholder para que NO truene el build.
// Si no lo usas, al menos así compila.
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Deprecated. Use /api/wallet/balance" },
    { status: 410 }
  )
}

// (opcional) también acepta POST por si algo lo llama
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Deprecated. Use /api/wallet/balance" },
    { status: 410 }
  )
}