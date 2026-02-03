import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"
import { RPC_URL, TREASURY_WALLET, USDC_MINT } from "./solana"

export async function verifyUsdcTransfer(params: { signature: string; payer: string; usdcAmount: number }) {
  const { signature, payer, usdcAmount } = params
  const connection = new Connection(RPC_URL, "confirmed")

  const payerPk = new PublicKey(payer)
  const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_WALLET, false)

  const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: "confirmed" })
  if (!tx) throw new Error("Transaction not found (yet).")
  if (tx.meta?.err) throw new Error("Transaction failed.")

  const ixs = tx.transaction.message.instructions as any[]
  for (const ix of ixs) {
    if (!("parsed" in ix)) continue
    const parsed = ix.parsed
    if (!parsed) continue
    if (parsed.type !== "transferChecked" && parsed.type !== "transfer") continue

    const info = parsed.info
    if (info.mint !== USDC_MINT.toBase58()) continue
    if (info.destination !== treasuryAta.toBase58()) continue

    const authority = info.authority || info.owner
    if (authority !== payerPk.toBase58()) continue

    const raw = info.tokenAmount?.amount ?? info.amount
    const decimals = info.tokenAmount?.decimals ?? 6
    const expectedRaw = BigInt(Math.round(usdcAmount * 10 ** decimals))
    const gotRaw = BigInt(raw)
    if (gotRaw !== expectedRaw) throw new Error("Wrong USDC amount.")

    return { ok: true }
  }

  throw new Error("No matching USDC transfer to treasury found in this tx.")
}