import { PublicKey } from "@solana/web3.js"

// USDC mint mainnet
export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")

export const TIERS = {
  BULLION: { label: "Bullion", usdc: 300 },
  HELLION: { label: "Hellion", usdc: 1500 },
  TORION: { label: "Torion", usdc: 3000 },
} as const

export type Tier = keyof typeof TIERS

export const TREASURY_WALLET = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET!)
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!