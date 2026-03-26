import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const id = String(body?.id || "").trim()
    const wallet = String(body?.wallet || "").trim()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      )
    }

    const depRef = db.collection("helixDeposits").doc(id)
    const depSnap = await depRef.get()

    if (!depSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "HELIX deposit not found" },
        { status: 404 }
      )
    }

    const dep = depSnap.data() || {}

    await depRef.set(
      {
        status: "confirmed",
        wallet: wallet || dep.wallet || null,
        confirmedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    if (wallet) {
      await db
        .collection("users")
        .doc(wallet)
        .collection("modules")
        .doc("HELIX")
        .set(
          {
            active: true,
            product: "HELIX MIRROR ENGINE",
            source: "qr_payment",
            depositId: id,
            amountUsd: dep.amountUsd || 140,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
    }

    return NextResponse.json({
      ok: true,
      id,
      status: "confirmed",
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to confirm HELIX deposit" },
      { status: 500 }
    )
  }
}

export {}