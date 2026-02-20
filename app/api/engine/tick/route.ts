import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const MIN_TICK_MS = 5 * 60 * 1000 // 5 min (UptimeRobot free)
const DRIFT_PER_TICK = 4 // rango total aprox (±2)

function num(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function tickEngine(run: any, now: number) {
  const allocatedUsd = Math.max(0, num(run.allocatedUsd, 0))
  const pnlUsd = num(run.pnlUsd, 0)

  // drift random en [-2, +2]
  const drift = (Math.random() - 0.5) * DRIFT_PER_TICK
  const pnlNext = pnlUsd + drift
  const equityNext = allocatedUsd + pnlNext

  return {
    pnlUsd: pnlNext,
    equityUsd: equityNext,
    lastTickAt: now,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get("secret")

  if (!process.env.ENGINE_TICK_SECRET || secret !== process.env.ENGINE_TICK_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const now = Date.now()

  const snap = await db.collection("engineRuns").where("active", "==", true).get()

  let updated = 0
  let skipped = 0

  const batch = db.batch()

  for (const doc of snap.docs) {
    const run = doc.data() as any

    // ✅ throttle por doc (evita doble tick si te pegan seguido)
    const lastTickAt = num(run.lastTickAt, 0)
    if (lastTickAt > 0 && now - lastTickAt < MIN_TICK_MS) {
      skipped++
      continue
    }

    // ✅ sanity: si allocated no es válido, skip (opcional)
    const allocatedUsd = num(run.allocatedUsd, 0)
    if (!Number.isFinite(allocatedUsd) || allocatedUsd < 0) {
      skipped++
      continue
    }

    const next = tickEngine(run, now)

    // ✅ safety clamp (por si algo se va raro)
    next.pnlUsd = clamp(next.pnlUsd, -1_000_000, 1_000_000)
    next.equityUsd = clamp(next.equityUsd, 0, 1_000_000)

    batch.update(doc.ref, next)
    updated++
  }

  if (updated > 0) await batch.commit()

  return NextResponse.json({
    ok: true,
    activeCount: snap.size,
    updated,
    skipped,
    now,
    minTickMs: MIN_TICK_MS,
  })
}

