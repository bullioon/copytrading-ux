"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js"

type Network = "devnet" | "testnet" | "mainnet-beta"

type Props = {
  network?: Network

  /** ✅ mínimo requerido en USD (ej 50) */
  minUsd?: number

  /** ✅ override manual: si lo pasas, no consulta API */
  solUsdOverride?: number

  /** destino (treasury). Si no lo pasas, usa NEXT_PUBLIC_TREASURY_WALLET */
  treasury?: string

  /** ✅ className extra para wrapper */
  className?: string

  /** ✅ callback friendly (tu UI la usa) */
  onConfirmed?: (
    usdAmount: number,
    meta: { signature: string; sol: number; publicKey: string; network: Network; solUsd: number }
  ) => void

  /** ✅ callback “core” (compat si quieres) */
  onBalanceCredit?: (
    usdAmount: number,
    meta: { signature: string; sol: number; publicKey: string; network: Network; solUsd: number }
  ) => void
}

declare global {
  interface Window {
    solana?: any
  }
}

function fmt(n: number, d = 4) {
  if (!Number.isFinite(n)) return "0"
  return n.toFixed(d)
}

export default function PhantomDeposit({
  network = "mainnet-beta",
  minUsd = 50,
  solUsdOverride,
  treasury,
  className = "",
  onConfirmed,
  onBalanceCredit,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [provider, setProvider] = useState<any>(null)
  const [pubkey, setPubkey] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const [solUsdLive, setSolUsdLive] = useState<number>(0)

  // ✅ Trae precio real SOL/USD desde tu API
  useEffect(() => {
    if (!mounted) return
    if (Number.isFinite(solUsdOverride) && (solUsdOverride ?? 0) > 0) {
      setSolUsdLive(Number(solUsdOverride))
      return
    }
    let alive = true
    ;(async () => {
      try {
        const r = await fetch("/api/prices/sol", { cache: "no-store" })
        const j = await r.json()
        const p = Number(j?.solUsd ?? 0)
        if (alive) setSolUsdLive(Number.isFinite(p) ? p : 0)
      } catch {
        if (alive) setSolUsdLive(0)
      }
    })()
    return () => {
      alive = false
    }
  }, [mounted, solUsdOverride])

  const treasuryPk = useMemo(() => {
    const t = treasury || process.env.NEXT_PUBLIC_TREASURY_WALLET
    return t?.trim() || ""
  }, [treasury])

  const connection = useMemo(() => {
    const rpc = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "").trim() || clusterApiUrl(network)
    return new Connection(rpc, "confirmed")
  }, [network])

  // ✅ detectar phantom
  useEffect(() => {
    if (!mounted) return
    const p = window.solana
    if (p?.isPhantom) {
      setProvider(p)
      try {
        if (p.publicKey) setPubkey(p.publicKey.toString())
      } catch {}
      const onConnect = () => setPubkey(p.publicKey?.toString?.() ?? null)
      const onDisconnect = () => setPubkey(null)
      p.on?.("connect", onConnect)
      p.on?.("disconnect", onDisconnect)
      return () => {
        p.off?.("connect", onConnect)
        p.off?.("disconnect", onDisconnect)
      }
    } else {
      setProvider(null)
    }
  }, [mounted])

  const phantomDetected = !!provider
  const isConnected = !!pubkey

  // ✅ SOL requerido para minUsd con precio real
  const requiredSol = useMemo(() => {
    if (!(solUsdLive > 0)) return 0
    return minUsd / solUsdLive
  }, [minUsd, solUsdLive])

  // ✅ amountSol arranca en “lo mínimo requerido”
  const [amountSol, setAmountSol] = useState<string>("")
  useEffect(() => {
    if (!mounted) return
    if (amountSol) return
    if (requiredSol > 0) setAmountSol(fmt(requiredSol, 4))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, requiredSol])

  const amount = Number(amountSol)

  const canDeposit =
    mounted &&
    phantomDetected &&
    isConnected &&
    !busy &&
    treasuryPk.length > 0 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    (requiredSol <= 0 || amount >= requiredSol)

  async function connect() {
    setErr(null)
    setOkMsg(null)
    try {
      if (!provider) throw new Error("Phantom not found")
      const res = await provider.connect()
      const pk = res?.publicKey?.toString?.() ?? provider.publicKey?.toString?.()
      setPubkey(pk || null)
    } catch (e: any) {
      setErr(e?.message || "Failed to connect")
    }
  }

  async function deposit() {
    setErr(null)
    setOkMsg(null)

    try {
      if (!provider) throw new Error("Phantom not found")
      if (!pubkey) throw new Error("Wallet not connected")
      if (!treasuryPk) throw new Error("Missing treasury wallet (NEXT_PUBLIC_TREASURY_WALLET)")
      if (!(amount > 0)) throw new Error("Enter an amount > 0")
      if (requiredSol > 0 && amount < requiredSol) {
        throw new Error(`Minimum: ${fmt(requiredSol, 4)} SOL (~$${minUsd})`)
      }

      setBusy(true)

      const from = new PublicKey(pubkey)
      const to = new PublicKey(treasuryPk)

      const lamports = Math.round(amount * LAMPORTS_PER_SOL)
      if (lamports <= 0) throw new Error("Amount too small")

      // 1) build tx
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports,
        })
      )

      tx.feePayer = from
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
      tx.recentBlockhash = blockhash

      // 2) sign + send via Phantom
      const signed = await provider.signTransaction(tx)
      const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })

      // 3) confirm on-chain
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

      // 4) ✅ confirm/credit en backend (Firebase)
      const confirmRes = await fetch("/api/deposit/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          publicKey: pubkey, // MVP (luego lo endurecemos)
        }),
      })

      const confirmJson = await confirmRes.json()

      if (!confirmRes.ok || !confirmJson?.ok) {
        throw new Error(confirmJson?.error || "Failed to confirm/credit deposit")
      }

      // backend manda los valores oficiales
      const usdAmount = Number(confirmJson?.usd ?? 0)
      const solUsd = Number(confirmJson?.solUsd ?? 0)

      const meta = {
        signature,
        sol: Number(confirmJson?.sol ?? amount),
        publicKey: pubkey,
        network,
        solUsd,
      }

      onConfirmed?.(usdAmount, meta)
      onBalanceCredit?.(usdAmount, meta)

      setOkMsg(`Confirmed: ${fmt(amount, 4)} SOL`)
    } catch (e: any) {
      setErr(e?.message || "Deposit failed")
    } finally {
      setBusy(false)
    }
  }

  // evita hydration mismatch
  if (!mounted) {
    return (
      <div
        className={["rounded-2xl border border-white/10 bg-black/30 p-3 text-[12px] text-white/60", className].join(
          " "
        )}
      >
        …
      </div>
    )
  }

  return (
    <div
      className={[
        "rounded-[24px] border border-white/10 bg-black/35 p-5 md:p-6",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-widest text-white/45">PHANTOM</div>

          <div className="mt-1 text-[11px] text-white/70">
            Network: <span className="text-white/90 font-semibold">{network}</span>
          </div>

          <div className="mt-1 text-[11px] text-white/60">
            Min: <span className="text-white/85 font-semibold">${minUsd}</span>{" "}
            {solUsdLive > 0 ? (
              <span className="text-white/45">(~{fmt(requiredSol, 4)} SOL @ ${Math.round(solUsdLive)} / SOL)</span>
            ) : (
              <span className="text-white/45">(price loading…)</span>
            )}
          </div>

          <div className="mt-1 text-[10px] text-white/45 truncate">
            Treasury:{" "}
            <span className="text-white/70">
              {treasuryPk ? `${treasuryPk.slice(0, 6)}…${treasuryPk.slice(-6)}` : "NOT SET"}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {phantomDetected ? (
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/70">
              {isConnected ? "connected" : "ready"}
            </div>
          ) : (
            <a
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/70 hover:bg-white/5"
              href="https://phantom.app/"
              target="_blank"
              rel="noreferrer"
            >
              install phantom
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* LEFT — AMOUNT */}
        <div className="md:col-span-8">
          <div className="text-[10px] tracking-widest text-white/45">AMOUNT (SOL)</div>

          <input
            value={amountSol}
            onChange={e => setAmountSol(e.target.value)}
            inputMode="decimal"
            placeholder={requiredSol > 0 ? fmt(requiredSol, 4) : "0.1"}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white/85 outline-none"
          />

          <div className="mt-1 text-[10px] text-white/40">
            {solUsdLive > 0
              ? `Min ${fmt(requiredSol, 4)} SOL (~$${minUsd}) · ${Math.round(solUsdLive)} USD / SOL`
              : "Price loading…"}
          </div>
        </div>

        {/* RIGHT — ACTIONS */}
        <div className="md:col-span-4 flex flex-col gap-2">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={!phantomDetected || busy}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-widest text-white/90 hover:bg-white/15 disabled:opacity-50"
            >
              CONNECT
            </button>
          ) : (
            <button
              onClick={() => provider?.disconnect?.()}
              disabled={busy}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[11px] tracking-widest text-white/70 hover:bg-white/5 disabled:opacity-50"
            >
              DISCONNECT
            </button>
          )}

          <button
            onClick={deposit}
            disabled={!canDeposit}
            className={[
              "rounded-xl px-4 py-2 text-[11px] font-semibold tracking-widest transition-all",
              "border border-violet-300/30 bg-violet-300/15 text-violet-100",
              "hover:bg-violet-300/25",
              "disabled:opacity-40",
              "phantom-pulse",
            ].join(" ")}
            style={{
              boxShadow: "0 0 0 1px rgba(168,85,247,0.22), 0 0 26px rgba(168,85,247,0.18)",
            }}
          >
            {busy ? "DEPOSITING..." : "DEPOSIT"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-[11px] text-rose-100">
          {err}
        </div>
      ) : null}

      {okMsg ? (
        <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[11px] text-emerald-100">
          {okMsg}
        </div>
      ) : null}

      {isConnected ? (
        <div className="mt-2 text-[10px] text-white/40">
          Wallet: <span className="text-white/70">{pubkey?.slice(0, 6)}…{pubkey?.slice(-6)}</span>
        </div>
      ) : null}
    </div>
  )
}
