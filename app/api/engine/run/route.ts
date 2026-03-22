import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const MIN_TICK_MS = 5 * 60 * 1000

const BASE_VOL = 0.004
const SPIKE_PROB = 0.05
const SPIKE_MULT = 4

const DRAWDOWN_LIMIT = -0.08
const REGIME_CHANGE_PROB = 0.03
const CLUSTER_PROB = 0.03

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

function pickRegime() {
  const r = Math.random()

  if (r < 0.55) return "TREND_UP"
  if (r < 0.80) return "RANGE"
  if (r < 0.95) return "VOLATILE"
  return "TREND_DOWN"
}

function regimeDrift(regime: string) {
  if (regime === "TREND_UP") return 0.002
  if (regime === "TREND_DOWN") return -0.0015
  return 0
}

function regimeVol(regime: string) {
  if (regime === "VOLATILE") return BASE_VOL * 3
  if (regime === "RANGE") return BASE_VOL * 0.6
  return BASE_VOL
}

function tickEngine(run: any, now: number) {
  const allocatedUsd = Math.max(0, num(run.allocatedUsd, 0))
  const pnlUsd = num(run.pnlUsd, 0)
  const momentum = num(run.momentum, 0)

  const overrideEnabled = run.overrideEnabled === true
  const overrideMode = run.overrideMode ?? "OFF"

  const drawdown = allocatedUsd > 0 ? pnlUsd / allocatedUsd : 0

  if (!overrideEnabled && drawdown <= DRAWDOWN_LIMIT) {
    return {
      active: false,
      riskBrake: true,
      stoppedAt: now,
      lastTickAt: now,
      notes: "risk-brake",
    }
  }

  if (overrideEnabled && overrideMode === "FORCE_PAUSE") {
    return { lastTickAt: now }
  }

  let regime = run.marketRegime ?? "TREND_UP"

  if (Math.random() < REGIME_CHANGE_PROB) {
    regime = pickRegime()
  }

  let volatility = regimeVol(regime)

  if (Math.random() < SPIKE_PROB) {
    volatility *= SPIKE_MULT
  }

  if (overrideEnabled) {
    if (overrideMode === "FORCE_SAFE") volatility *= 0.5
    if (overrideMode === "FORCE_AGGRO") volatility *= 2
  }

  // ======================
  // PROFIT CLUSTER
  // ======================

  let cluster = run.profitCluster ?? 0

  if (cluster <= 0 && Math.random() < CLUSTER_PROB) {
    cluster = Math.floor(Math.random() * 4) + 3
  }

  let clusterBoost = 0

  if (cluster > 0) {
    clusterBoost = 0.003
    cluster -= 1
  }

  const regimeBias = regimeDrift(regime)

  const randomMove = (Math.random() - 0.5) * volatility

  const driftPct = randomMove + momentum + regimeBias + clusterBoost

  const driftUsd = allocatedUsd * driftPct

  const pnlNext = pnlUsd + driftUsd
  const equityNext = allocatedUsd + pnlNext

  const newMomentum = momentum * 0.7 + randomMove * 0.3 + regimeBias * 0.2

  return {
    pnlUsd: pnlNext,
    equityUsd: equityNext,
    momentum: newMomentum,
    marketRegime: regime,
    profitCluster: cluster,
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
  })
}