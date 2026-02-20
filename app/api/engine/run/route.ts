import { NextResponse } from "next/server"
import { db, FieldValue } from "@/lib/firebaseAdmin" // ajusta si tu path es otro

function cleanWallet(w: unknown) {
  const s = String(w || "").trim()
  // validación mínima (base58 suele ser 32-44 chars, pero no forzamos demasiado)
  if (s.length < 20) return ""
  return s
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const wallet = cleanWallet(body.wallet)
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "missing wallet" }, { status: 400 })
    }

    const ref = db.collection("engineRuns").doc(wallet)

    // si te mandan active=false: apagamos
    if (body.active === false) {
      await ref.set(
        {
          active: false,
          lastTickAt: Date.now(),
          // opcional: marca stoppedAt
          stoppedAt: Date.now(),
        },
        { merge: true }
      )
      return NextResponse.json({ ok: true, wallet, active: false })
    }

    const allocatedUsd = Number(body.allocatedUsd || 0)
    const presetId = body.presetId ?? null

    // Si ya existe, no reseteamos pnlUsd a 0 a menos que lo pidas.
    // Para Paso 1: arrancamos pnl en 0 cuando inicias un run nuevo.
    const startedAt = Date.now()
    const pnlUsd = 0
    const equityUsd = allocatedUsd + pnlUsd

    await ref.set(
      {
        active: true,
        allocatedUsd,
        pnlUsd,
        equityUsd,
        lastTickAt: startedAt,
        startedAt,
        presetId,
        notes: "run started",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, wallet, active: true })
  } catch (e: any) {
    console.error("engine/run POST error", e)
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}