import { Connection } from "@solana/web3.js"

export function getSolanaConnection() {
  const url = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
  return new Connection(url, "confirmed")
}

export function getTreasuryPubkey() {
  const t = process.env.TREASURY_WALLET
  if (!t) throw new Error("Missing TREASURY_WALLET in .env.local")
  return t
}

export function getSolUsd() {
  const raw = process.env.SOL_USD || "100"
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 100
  return n
}
