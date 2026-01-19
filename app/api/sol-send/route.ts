import { NextResponse } from "next/server"
import { getSolanaConnection } from "@/app/lib/solana"
import { Transaction } from "@solana/web3.js"

type Body = { raw: number[] }

export async function POST(req: Request) {
  try {
    const { raw } = (await req.json()) as Body
    if (!raw?.length) return NextResponse.json({ ok: false, error: "Missing raw tx" }, { status: 400 })

    const conn = getSolanaConnection()
    const tx = Transaction.from(Uint8Array.from(raw))
    const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false })
    // opcional: espera confirmación aquí (pero ya lo confirma /confirm)
    return NextResponse.json({ ok: true, signature: sig })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "send error" }, { status: 500 })
  }
}
