import { NextResponse } from "next/server"
import { makeNonce, makeSignInMessage } from "@/lib/authNonce"
import { db, FieldValue } from "@/lib/firebaseAdmin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")
    if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 })

    const nonce = makeNonce()
    const message = makeSignInMessage(address, nonce)

    await db.collection("nonces").doc(address).set(
      { address, nonce, message, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    )

    return NextResponse.json({ nonce, message })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Nonce endpoint failed" }, { status: 500 })
  }
}