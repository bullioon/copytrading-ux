"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { useWallet } from "@solana/wallet-adapter-react"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"

type Tier = "BULLION" | "HELLION" | "TORION"

const PRICES: Record<Tier, number> = { BULLION: 300, HELLION: 1500, TORION: 3000 }

// USDC mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
const USDC_DECIMALS = 6

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

const TIER_META: Record<
  Tier,
  { label: string; color: string; glow: string; chips: string[]; feed: string[] }
> = {
  BULLION: {
    label: "BULLION",
    color: "text-emerald-300",
    glow: "0 0 90px rgba(34,197,94,0.22)",
    chips: ["guardrails on", "2-trader routing", "low exposure posture", "fast-start templates"],
    feed: [
      "▸ Slot reserved · BULLION posture locked",
      "▸ Routing warmed · 2-trader execution ready",
      "▸ Risk guardrails locked",
      "▸ Awaiting USDC transfer confirmation",
    ],
  },
  HELLION: {
    label: "HELLION",
    color: "text-red-300",
    glow: "0 0 90px rgba(239,68,68,0.20)",
    chips: ["volatility mode", "3–5 trader orchestration", "spread filters armed", "tier switching supported"],
    feed: [
      "▸ Slot reserved · HELLION volatility posture",
      "▸ Multi-trader routing online (3–5)",
      "▸ Spread/latency filters armed",
      "▸ Awaiting USDC transfer confirmation",
    ],
  },
  TORION: {
    label: "TORION",
    color: "text-purple-300",
    glow: "0 0 90px rgba(168,85,247,0.22)",
    chips: ["institutional layer", "route diversification", "audit trail vibe", "funded path checks"],
    feed: [
      "▸ Slot reserved · TORION institutional posture",
      "▸ Route diversification ready",
      "▸ Execution integrity prioritized",
      "▸ Awaiting USDC transfer confirmation",
    ],
  },
}

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function asTier(v: string | null): Tier {
  const t = (v || "BULLION").toUpperCase()
  if (t === "HELLION") return "HELLION"
  if (t === "TORION") return "TORION"
  return "BULLION"
}

export default function PayPage() {
  const router = useRouter()
  const params = useSearchParams()
  const tier = asTier(params.get("tier"))
  const meta = TIER_META[tier]

  const { publicKey, sendTransaction } = useWallet()

  const [busy, setBusy] = useState(false)
  const [me, setMe] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  // UI-only vibes
  const [countdown, setCountdown] = useState(90)
  const [pressure, setPressure] = useState(42)
  const [feedIndex, setFeedIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const treasury = process.env.NEXT_PUBLIC_TREASURY_WALLET || ""
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || ""

useEffect(() => {
  ;(async () => {
    // ✅ Solo BULLION requiere login (free access / gating)
    if (tier !== "BULLION") {
      setMe({ authed: true, bypass: true })
      return
    }

    const r = await fetch("/api/auth/me", { credentials: "include" })
    const j = await r.json().catch(() => ({}))
    setMe(j)

    if (!j?.authed) {
      router.replace(`/login?next=${encodeURIComponent(`/pay?tier=${tier}`)}`)
    }
  })()
}, [router, tier])



  // FOMO ticker (visual)
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((s) => (s <= 1 ? 90 : s - 1))
      setPressure((p) => Math.min(95, p + 0.35))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Feed ticker (visual)
  useEffect(() => {
    setFeedIndex(0)
    const t = setInterval(() => {
      setFeedIndex((i) => (i + 1) % meta.feed.length)
    }, 2800)
    return () => clearInterval(t)
  }, [tier, meta.feed.length])

  const slotsLeft = useMemo(() => {
    const base = tier === "BULLION" ? 24 : tier === "HELLION" ? 11 : 6
    const drop = Math.floor((pressure - 42) / 10)
    return Math.max(1, base - drop)
  }, [pressure, tier])

  async function copyTreasury() {
    try {
      await navigator.clipboard.writeText(treasury)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  async function payNow() {
    setErr(null)
    setBusy(true)
    try {
      if (!rpcUrl) throw new Error("Missing NEXT_PUBLIC_SOLANA_RPC_URL")
      if (!treasury) throw new Error("Missing NEXT_PUBLIC_TREASURY_WALLET")
      if (!publicKey) throw new Error("Connect Phantom first")
      if (!sendTransaction) throw new Error("Wallet does not support sendTransaction")

      const connection = new Connection(rpcUrl, "confirmed")
      const treasuryPk = new PublicKey(treasury)

      const amountUi = PRICES[tier] // enteros
      const amountBase = BigInt(amountUi) * BigInt(10 ** USDC_DECIMALS)

      const payerAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey, false)
      const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, treasuryPk, false)

      const tx = new Transaction()

      // crear ATA del treasury si no existe
      const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta)
      if (!treasuryAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            treasuryAta,
            treasuryPk, // owner
            USDC_MINT
          )
        )
      }

      // transfer USDC
      tx.add(
        createTransferCheckedInstruction(
          payerAta,
          USDC_MINT,
          treasuryAta,
          publicKey,
          amountBase,
          USDC_DECIMALS
        )
      )

      const sig = await sendTransaction(tx, connection)
      const conf = await connection.confirmTransaction(sig, "confirmed")
      if (conf.value.err) throw new Error("Transaction failed on-chain")

      // backend valida la firma y activa (NO confiar en frontend)
      const r = await fetch("/api/access/activate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, signature: sig }),
      })

      const text = await r.text()
      let j: any = {}
      try {
        j = JSON.parse(text)
      } catch {
        j = { error: text || "" }
      }
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)

      router.replace("/enter")
    } catch (e: any) {
      setErr(e?.message || "Payment failed")
    } finally {
      setBusy(false)
    }
  }

if (tier === "BULLION" && !me) {
  return <div className="min-h-screen bg-black text-white p-6">Loading…</div>
}

  return (
    <main
      className="min-h-screen text-white flex items-center justify-center px-6 py-10"
      style={{
        background:
          "radial-gradient(1100px 520px at 12% 0%, rgba(168,85,247,0.20), rgba(34,197,94,0.14), rgba(250,204,21,0.08), rgba(0,0,0,0.92)), #000",
      }}
    >
      <div className="w-full max-w-3xl space-y-6">
        {/* TOP OPS BAR */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-widest text-white/70">
              STATUS · <span className="text-emerald-400 font-semibold">RESERVED</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-widest text-white/70">
              TIER · <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-widest text-white/70">
              ACCESS WINDOW · <span className="text-white/90 font-semibold">{fmtSec(countdown)}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-widest text-white/70">
              SLOTS LEFT · <span className="text-yellow-300 font-semibold">{slotsLeft}</span>
            </div>

          
          </div>
        </div>

        {/* MAIN CARD */}
        <div
          className="relative rounded-[28px] border border-white/10 bg-black/60 p-7 md:p-10 backdrop-blur" 
          style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), ${meta.glow}` }}
        >

          {/* HERO */}
          <div className="text-center space-y-3">
            <div className="text-[10px] tracking-[0.22em] text-white/45">EXECUTION LAB CHECKOUT</div>

            <div className="text-5xl md:text-6xl font-semibold tracking-tight">
              ${PRICES[tier]} <span className="text-white/60 text-2xl md:text-3xl">USDC</span>
            </div>

            <p className="text-sm md:text-[15px] text-white/60">
              Your <span className={`font-semibold ${meta.color}`}>{tier}</span> slot is locked.
              <span className="text-white/80"> Routing + guardrails armed</span> — confirm transfer to enter.
            </p>

            {/* chips */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] tracking-widest text-white/60">
              {meta.chips.map((c) => (
                <span key={c} className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                  {c}
                </span>
              ))}
            </div>
          </div>

{/* PAY BOX */}
<div className="mt-8 grid gap-4 md:grid-cols-5">
  {/* LEFT */}
  <div className="md:col-span-3 rounded-2xl border border-white/10 bg-black/50 p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="text-[10px] tracking-[0.22em] text-white/45">
        SEND TO TREASURY
      </div>

      <button
        type="button"
        onClick={copyTreasury}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] tracking-widest text-white/70 hover:bg-white/10"
      >
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>

    <div className="mt-3 font-mono text-xs md:text-[13px] break-all text-white/90">
      {treasury || "Missing NEXT_PUBLIC_TREASURY_WALLET"}
    </div>

    <div className="mt-4 grid gap-2 text-[11px] text-white/60">
      <div className="flex items-center justify-between">
        <span className="text-white/45 tracking-widest">AMOUNT</span>
        <span className="text-white/85 font-semibold tracking-widest">
          ${PRICES[tier]} USDC
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/45 tracking-widest">NETWORK</span>
        <span className="text-white/85 font-semibold tracking-widest">
          SOLANA (MAINNET)
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/45 tracking-widest">NOTE</span>
        <span className="text-white/70 tracking-widest">
          Leave tab open for confirmation
        </span>
      </div>
    </div>

    {/* WALLET ACTIONS */}
    <div className="mt-4 flex flex-col sm:flex-row gap-2">
      <button
        type="button"
        onClick={() =>
          router.push(
            `/login?next=${encodeURIComponent(`/wallet?tier=${tier}`)}`
          )
        }
        className="w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-[11px] tracking-widest text-white/80 hover:bg-white/5"
      >
        LOGIN · OPEN YOUR WALLET ▸
      </button>

      <button
        type="button"
        onClick={() => router.push(`/wallet?tier=${tier}`)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] tracking-widest text-white/70 hover:bg-white/10"
      >
        GO TO WALLET (COMING SOON) ▸
      </button>
    </div>
  </div>

  {/* RIGHT */}
  <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/50 p-5">
    <div className="text-[10px] tracking-[0.22em] text-white/45">
      LIVE SYSTEM FEED
    </div>

    <div className="mt-3 font-mono text-xs text-emerald-300">
      {meta.feed[feedIndex]}
    </div>

    <div className="mt-4">
      <div className="text-[10px] tracking-widest text-white/45 mb-2">
        PRESSURE
      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pressure}%`,
            background:
              "linear-gradient(90deg, rgba(34,197,94,0.65), rgba(168,85,247,0.65), rgba(250,204,21,0.55))",
          }}
        />
      </div>

      <div className="mt-2 text-[10px] tracking-widest text-white/45">
        allocation waves ·{" "}
        <span className="text-white/70">
          {pressure.toFixed(0)}%
        </span>
      </div>
    </div>
  </div>
</div>

          {/* ERROR BOX */}
          {err ? (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {err}
              <div className="mt-2 text-[11px] text-red-200/70">
                Tip: Phantom en <span className="text-red-100 font-semibold">Mainnet</span>, suficiente{" "}
                <span className="text-red-100 font-semibold">USDC</span> y un poquito de{" "}
                <span className="text-red-100 font-semibold">SOL</span> para fees.
              </div>
            </div>
          ) : null}

          {/* CTA (pago real) */}
          <button
            disabled={busy || !publicKey}
            onClick={payNow}
            className="mt-7 w-full rounded-2xl border border-white/20 bg-white/10 py-4 md:py-5
                       text-sm font-semibold tracking-[0.18em]
                       hover:bg-white/20 transition disabled:opacity-40"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 55px rgba(168,85,247,0.18)",
            }}
          >
            {busy ? "VERIFYING…" : publicKey ? "PAY USDC · ENTER LAB" : "CONNECT PHANTOM"}
          </button>

          {/* CONNECT WALLET (secondary, checkout style) */}
{!publicKey && (
  <div className="mt-4 flex justify-center">
    <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2
                    text-xs tracking-widest text-white/70">
      <WalletMultiButton />
    </div>
  </div>
)}

          {/* FOOT FOMO */}
          <div className="mt-4 text-center text-[10px] tracking-[0.22em] text-white/45">
            Access is allocated in waves · leaving may release your slot
          </div>
        </div>
      </div>
    </main>
  )
}