import { NextResponse } from "next/server"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getSolanaConnection, getTreasuryPubkey, getSolUsd } from "@/app/lib/solana"

// ⚠️ MVP anti-duplicados en memoria (en prod usa DB)
// Si tu deploy es serverless, esta memoria puede resetearse.
const seen = new Set<string>()

type Body = {
  signature: string
  publicKey: string // wallet del usuario que pagó (source)
}

export async function POST(req: Request) {
  try {
    const { signature, publicKey } = (await req.json()) as Body

    if (!signature || !publicKey) {
      return NextResponse.json({ ok: false, error: "Missing signature/publicKey" }, { status: 400 })
    }

    if (seen.has(signature)) {
      return NextResponse.json({ ok: true, alreadyCredited: true }, { status: 200 })
    }

    const conn = getSolanaConnection()
    const treasury = getTreasuryPubkey()
    const solUsd = getSolUsd()

    // Busca transacción parseada para poder leer transfers
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

    const userPk = new PublicKey(publicKey)
    const treasuryPk = new PublicKey(treasury)

    // 1) detectar SOL transfer(s) a treasury desde user
    // Soporta parsed instructions tipo "system" transfer
    let lamportsToTreasuryFromUser = 0

    for (const ix of tx.transaction.message.instructions) {
      // parsed instruction
      // @ts-ignore
      const parsed = ix.parsed
      // @ts-ignore
      const program = ix.program

      if (!parsed || program !== "system") continue
      if (parsed.type !== "transfer") continue

      const info = parsed.info as { source: string; destination: string; lamports: number }

      if (!info?.source || !info?.destination || typeof info.lamports !== "number") continue

      if (info.source === userPk.toBase58() && info.destination === treasuryPk.toBase58()) {
        lamportsToTreasuryFromUser += info.lamports
      }
    }

    if (lamportsToTreasuryFromUser <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No valid SOL transfer found from user to treasury in this tx",
          treasury,
          publicKey,
        },
        { status: 400 }
      )
    }

    const sol = lamportsToTreasuryFromUser / LAMPORTS_PER_SOL
    const usd = sol * solUsd

    // Marca como acreditada (MVP)
    seen.add(signature)

    return NextResponse.json({
      ok: true,
      signature,
      from: userPk.toBase58(),
      to: treasuryPk.toBase58(),
      sol,
      usd,
      solUsd,
      credited: true,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
