import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0


function tickEngine(run: any) {
  const drift = (Math.random() - 0.5) * 4 // -2 a +2 USD por minuto
  const pnlNext = (Number(run.pnlUsd) || 0) + drift
  const equityNext = (Number(run.allocatedUsd) || 0) + pnlNext

  return {
    pnlUsd: pnlNext,
    equityUsd: equityNext,
    lastTickAt: Date.now(),
  }
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get("secret")

if (!process.env.ENGINE_TICK_SECRET || secret !== process.env.ENGINE_TICK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const snap = await db.collection("engineRuns").where("active", "==", true).get()

  let updated = 0

const batch = db.batch()

for (const doc of snap.docs) {
  const run = doc.data()
  const next = tickEngine(run)
  batch.update(doc.ref, next)
  updated++
}

await batch.commit()

  return NextResponse.json({ ok: true, updated })
}