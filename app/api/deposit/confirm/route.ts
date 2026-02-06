import { NextResponse } from "next/server"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getSolanaConnection, getTreasuryPubkey } from "@/app/lib/solana"
import { db, FieldValue } from "../../../../lib/firebaseAdmin"

export const dynamic = "force-dynamic"

type Body = {
  signature: string
  publicKey?: string // opcional, debug
}

function getBaseUrl() {
  // ✅ Prioridad:
  // 1) SITE_URL (tu dominio) -> ponlo en Vercel
  // 2) VERCEL_URL (sin https) -> lo arma
  // 3) localhost
  const site = (process.env.SITE_URL || "").trim()
  if (site) return site

  const vercel = (process.env.VERCEL_URL || "").trim()
  if (vercel) return `https://${vercel}`

  return "http://localhost:3000"
}

async function fetchSolUsd(): Promise<number> {
  const base = getBaseUrl()
  const url = `${base}/api/prices/sol`

  const r = await fetch(url, { cache: "no-store" })
  const j = await r.json().catch(() => ({} as any))
  const p = Number(j?.solUsd ?? 0)

  // Si el endpoint falló (503) o precio inválido, NO acreditamos 0.
  if (!r.ok || !Number.isFinite(p) || p <= 0) {
    throw new Error(j?.error || `SOL/USD unavailable (${r.status})`)
  }

  return p
}

export async function POST(req: Request) {
  try {
    const { signature } = (await req.json()) as Body

    if (!signature) {
      return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 400 })
    }

    // 0) dedupe por signature
    const depRef = db.collection("deposits").doc(signature)
    const existing = await depRef.get()
    if (existing.exists) {
      return NextResponse.json(
        { ok: true, alreadyCredited: true, signature, ...(existing.data() as any) },
        { status: 200 }
      )
    }

    const conn = getSolanaConnection()
    const treasury = getTreasuryPubkey()
    const treasuryPk = new PublicKey(treasury).toBase58()

    // 1) leer tx confirmada
    const tx = await conn.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    })

    if (!tx) {
      return NextResponse.json({ ok: false, error: "Tx not found yet (not confirmed?)" }, { status: 404 })
    }
    if (tx.meta?.err) {
      return NextResponse.json({ ok: false, error: "Tx failed", metaErr: tx.meta.err }, { status: 400 })
    }

    // 2) encontrar transfer(s) hacia treasury
    let lamportsToTreasury = 0
    let realSender: string | null = null

    for (const ix of tx.transaction.message.instructions as any[]) {
      const program = ix?.program
      const parsed = ix?.parsed
      if (!parsed || program !== "system") continue
      if (parsed.type !== "transfer") continue

      const info = parsed.info as { source?: string; destination?: string; lamports?: number }
      if (!info?.source || !info?.destination || typeof info.lamports !== "number") continue

      if (info.destination === treasuryPk) {
        lamportsToTreasury += info.lamports
        realSender = info.source
      }
    }

    if (!realSender || lamportsToTreasury <= 0) {
      return NextResponse.json(
        { ok: false, error: "No valid SOL transfer to treasury found in this tx", treasury: treasuryPk },
        { status: 400 }
      )
    }

    const sol = lamportsToTreasury / LAMPORTS_PER_SOL

    // 3) precio SOL/USD REAL (si falla, no acreditamos en 0)
    const solUsd = await fetchSolUsd()
    const usd = sol * solUsd

    if (!Number.isFinite(usd) || usd <= 0) {
      return NextResponse.json({ ok: false, error: "Computed USD invalid" }, { status: 500 })
    }

    // 4) escribir depósito + sumar balance (transaction)
    const userRef = db.collection("users").doc(realSender)

    const depositDoc = {
      signature,
      from: realSender,
      to: treasuryPk,
      sol,
      usd,
      solUsd,
      status: "CONFIRMED",
      source: "phantom",
      slot: tx.slot ?? null,
      blockTime: tx.blockTime ?? null,
      createdAt: FieldValue.serverTimestamp(),
    }

    let wrote = false

    await db.runTransaction(async (t) => {
      const depSnap = await t.get(depRef)
      if (depSnap.exists) return

      t.set(
        userRef,
        { wallet: realSender, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      )

      t.set(depRef, depositDoc, { merge: true })

      t.set(
        userRef,
        {
          balanceUsd: FieldValue.increment(usd),
          lastDepositAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      wrote = true
    })

    if (!wrote) {
      const again = await depRef.get()
      return NextResponse.json(
        { ok: true, alreadyCredited: true, signature, ...(again.data() as any) },
        { status: 200 }
      )
    }

    return NextResponse.json({ ok: true, credited: true, ...depositDoc }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
