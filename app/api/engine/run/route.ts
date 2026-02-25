import { NextResponse } from "next/server"
import { db, FieldValue } from "@/lib/firebaseAdmin"

function cleanWallet(w: unknown) {
  const s = String(w || "").trim()
  if (s.length < 20) return ""
  return s
}

function num(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const wallet = cleanWallet(body.wallet)
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "missing wallet" }, { status: 400 })
    }

    const ref = db.collection("engineRuns").doc(wallet)

    // ======================
    // STOP RUN
    // ======================
    if (body.active === false) {
      await ref.set(
        {
          active: false,
          stoppedAt: Date.now(),
          lastTickAt: Date.now(),
          updatedAt: FieldValue.serverTimestamp(),
          notes: body.notes ?? "stopped",
        },
        { merge: true }
      )
      return NextResponse.json({ ok: true, wallet, active: false })
    }

    // ======================
    // START / UPDATE RUN
    // ======================
    const allocatedUsd = Math.max(0, num(body.allocatedUsd, 0))
    const durationSec = Math.max(0, Math.floor(num(body.durationSec, 0))) // ✅ persist run window
    const presetId = body.presetId ?? null
    const resetPnl = body.resetPnl === true
    const now = Date.now()

    // leer estado actual
    const snap = await ref.get()
    const prev = snap.exists ? (snap.data() as any) : null

    // ✅ SOLO continuamos startedAt si el run anterior seguía activo
    const continuing = prev?.active === true

    const startedAt = continuing
      ? Number(prev?.startedAt ?? now)
      : now

    const prevPnl = Number.isFinite(Number(prev?.pnlUsd)) ? Number(prev.pnlUsd) : 0

    // ✅ Si NO es continuing (nuevo run), por default resetea pnl a 0 (a menos que tú quieras lo contrario)
    const pnlUsd = continuing
      ? (resetPnl ? 0 : prevPnl)
      : 0

    const equityUsd = allocatedUsd + pnlUsd

    await ref.set(
      {
        active: true,

        allocatedUsd,
        durationSec,
        presetId,

        startedAt,
        lastStartedAt: now,

        pnlUsd,
        equityUsd,

        // ticks
        lastTickAt: now, // ✅ en start/update siempre marca tick actual

        // ✅ IMPORTANTE: limpia stoppedAt al arrancar
        stoppedAt: FieldValue.delete(),

        updatedAt: FieldValue.serverTimestamp(),
        notes: body.notes ?? "ui-run",
      },
      { merge: true }
    )

    return NextResponse.json({
      ok: true,
      wallet,
      active: true,
      allocatedUsd,
      durationSec,
      presetId,
      startedAt,
      pnlUsd,
      equityUsd,
      resetPnl,
      continuing,
    })
  } catch (e: any) {
    console.error("engine/run POST error", e)
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}