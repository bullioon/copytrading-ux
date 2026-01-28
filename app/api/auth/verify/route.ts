import { NextResponse } from "next/server"
import bs58 from "bs58"
import nacl from "tweetnacl"
import { PublicKey } from "@solana/web3.js"
import { db } from "@/lib/firebaseAdmin"
import { signSession } from "@/lib/session"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })

    const { address, signature, message } = body as {
      address: string
      signature: string
      message: string
    }

    if (!address || !signature || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const snap = await db.collection("nonces").doc(address).get()
    if (!snap.exists) return NextResponse.json({ error: "Nonce not found" }, { status: 400 })

    const saved = snap.data() as any
    if (saved.message !== message) {
      return NextResponse.json({ error: "Message mismatch" }, { status: 400 })
    }

    const pubkey = new PublicKey(address)
    const sigBytes = bs58.decode(signature)
    const msgBytes = new TextEncoder().encode(message)

    const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkey.toBytes())
    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })

    const token = await signSession(address)

    // (opcional) borra nonce usado
    await db.collection("nonces").doc(address).delete().catch(() => {})

    const res = NextResponse.json({ ok: true })
    res.cookies.set("ct_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Verify endpoint failed" }, { status: 500 })
  }
}