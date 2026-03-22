import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

// throttle mínimo (UptimeRobot free ≈ 5 min)
const MIN_TICK_MS = 5 * 60 * 1000

// volatilidad base
const BASE_VOL = 0.004

// probabilidad de spike
const SPIKE_PROB = 0.05

// multiplicador de spike
const SPIKE_MULT = 4

// clamps de seguridad
const MAX_PNL = 1_000_000
const MIN_PNL = -1_000_000
const MAX_EQUITY = 1_000_000

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
  const momentum = num(run.momentum, 0)

  const overrideEnabled = run.overrideEnabled === true
  const overrideMode = run.overrideMode ?? "OFF"

  // pause mode
  if (overrideEnabled && overrideMode === "FORCE_PAUSE") {
    return {
      lastTickAt: now,
    }
  }

  let volatility = BASE_VOL

  if (Math.random() < SPIKE_PROB) {
    volatility *= SPIKE_MULT
  }

  if (overrideEnabled) {
    if (overrideMode === "FORCE_SAFE") {
      volatility *= 0.5
    }

    if (overrideMode === "FORCE_AGGRO") {
      volatility *= 2
    }
  }

  const randomMove = (Math.random() - 0.5) * volatility
  const driftPct = randomMove + momentum
  const driftUsd = allocatedUsd * driftPct

  const pnlNext = pnlUsd + driftUsd
  const equityNext = allocatedUsd + pnlNext

  const newMomentum = momentum * 0.7 + randomMove * 0.3

  return {
    pnlUsd: pnlNext,
    equityUsd: equityNext,
    momentum: newMomentum,
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

  const snap = await db
    .collection("engineRuns")
    .where("active", "==", true)
    .get()

  let updated = 0
  let skipped = 0

  const batch = db.batch()

  for (const doc of snap.docs) {
    const run = doc.data()

    const lastTickAt = num(run.lastTickAt, 0)

    if (lastTickAt > 0 && now - lastTickAt < MIN_TICK_MS) {
      skipped++
      continue
    }

    const allocatedUsd = num(run.allocatedUsd, 0)

    if (!Number.isFinite(allocatedUsd) || allocatedUsd < 0) {
      skipped++
      continue
    }

    const next = tickEngine(run, now)

    if (next.pnlUsd !== undefined) {
      next.pnlUsd = clamp(next.pnlUsd, MIN_PNL, MAX_PNL)
    }

    if (next.equityUsd !== undefined) {
      next.equityUsd = clamp(next.equityUsd, 0, MAX_EQUITY)
    }

    batch.update(doc.ref, next)

    updated++
  }

  if (updated > 0) {
    await batch.commit()
  }

  return NextResponse.json({
    ok: true,
    activeCount: snap.size,
    updated,
    skipped,
    now,
    minTickMs: MIN_TICK_MS,
  })
}