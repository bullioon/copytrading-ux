import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

/**
 * ✅ CONFIRM DEPOSIT (SERVER)
 * - Guarda un registro en /deposits
 * - Acredita balance en /users/{wallet}.balanceUsd
 * - Idempotente por depositId (no duplica crédito)
 *
 * Body esperado (JSON):
 * {
 *   wallet: string,            // Phantom publicKey (base58)
 *   amountUsd: number,         // cuánto vas a acreditar en USD
 *   depositId?: string,        // id único de la tx (signature) o tu id interno
 *   token?: string,            // "SOL" por default
 *   status?: string,           // "CONFIRMED" por default
 *   note?: string,             // texto opcional
 *   blockTime?: number         // opcional: unix seconds
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const wallet = String(body?.wallet || "").trim()
    const amountUsd = Number(body?.amountUsd || 0)

    // depositId: idealmente la signature de Solana
    // si no viene, generamos uno (pero OJO: sin depositId real no hay idempotencia real)
    const depositIdRaw = String(body?.depositId || "").trim()
    const depositId = depositIdRaw || `dep_${Date.now()}_${Math.random().toString(16).slice(2)}`

    const token = String(body?.token || "SOL").trim()
    const status = String(body?.status || "CONFIRMED").trim()
    const note = String(body?.note || "Deposit · Phantom").trim()

    // unix seconds opcional
    const blockTime = Number(body?.blockTime || 0)
    const blockTimeSec = Number.isFinite(blockTime) && blockTime > 0 ? Math.floor(blockTime) : null

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Missing wallet" }, { status: 400 })
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid amountUsd" }, { status: 400 })
    }

    // refs
    const userRef = db.collection("users").doc(wallet)
    const creditLockRef = userRef.collection("credits").doc(depositId)

    // deposits doc: usamos depositId como docId para dedupe fácil
    const depRef = db.collection("deposits").doc(depositId)

    await db.runTransaction(async (tx) => {
      // 1) idempotencia: si ya acreditamos este depositId, salimos
      const lockSnap = await tx.get(creditLockRef)
      if (lockSnap.exists) return

      // 2) guarda depósito (si existía, lo mergea)
      tx.set(
        depRef,
        {
          from: wallet, // para tu /api/wallet/txs (where("from","==",wallet))
          usd: amountUsd,
          token,
          status,
          note,
          depositId,
          blockTime: blockTimeSec ?? Math.floor(Date.now() / 1000), // si no viene blockTime, guardamos algo usable
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      // 3) lock de crédito (evita doble credit)
      tx.set(creditLockRef, {
        amountUsd,
        token,
        status,
        note,
        ts: Date.now(),
        createdAt: FieldValue.serverTimestamp(),
      })

      // 4) acredita balance
      tx.set(
        userRef,
        {
          balanceUsd: FieldValue.increment(amountUsd),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    })

    return NextResponse.json(
      {
        ok: true,
        wallet,
        amountUsd,
        depositId,
      },
      { status: 200 }
    )
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}

// 👇 evita “is not a module” si TS se pone mamón
export {}