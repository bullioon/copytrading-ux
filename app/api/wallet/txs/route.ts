import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get("wallet") || ""

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "missing wallet" }, { status: 400 })
    }

    // TODO: aquí conectas Firestore/DB real.
    // Por ahora devolvemos vacío para que compile y no truene.
    return NextResponse.json({ ok: true, items: [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 })
  }
}
