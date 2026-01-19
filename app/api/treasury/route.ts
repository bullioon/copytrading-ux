import { NextResponse } from "next/server"
import { getTreasuryPubkey } from "@/app/lib/solana"

export async function GET() {
  try {
    return NextResponse.json({ ok: true, treasury: getTreasuryPubkey() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Missing treasury" }, { status: 500 })
  }
}
