// app/api/wallet/credit/route.ts
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Endpoint DEPRECATED (lo dejamos solo para que Next/TS no truene el build)
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Deprecated. Use /api/deposit/confirm and /api/wallet/balance" },
    { status: 410 }
  )
}

// 👇 evita “is not a module” si TS se pone mamón
export {}
