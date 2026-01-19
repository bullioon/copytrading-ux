"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js"

type Network = "devnet" | "testnet" | "mainnet-beta"

type Props = {
  network?: Network
  /** MVP: precio interno para acreditar USD (ej: 100 = 1 SOL -> $100 interno) */
  solUsd?: number
  /** destino (treasury). Si no lo pasas, usa NEXT_PUBLIC_TREASURY_WALLET */
  treasury?: string
  /** callback cuando confirma */
  onBalanceCredit: (usdAmount: number, meta: { signature: string; sol: number; publicKey: string; network: Network }) => void
}

declare global {
  interface Window {
    solana?: any
  }
}

export default function PhantomDeposit({
  network = "devnet",
  solUsd = 0,
  treasury,
  onBalanceCredit,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [provider, setProvider] = useState<any>(null)
  const [pubkey, setPubkey] = useState<string | null>(null)
  const [amountSol, setAmountSol] = useState<string>("0.2")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const treasuryPk = useMemo(() => {
    const t = treasury || process.env.NEXT_PUBLIC_TREASURY_WALLET
    return t?.trim() || ""
  }, [treasury])

  const connection = useMemo(() => {
    const url = clusterApiUrl(network)
    return new Connection(url, "confirmed")
  }, [network])

  useEffect(() => {
    if (!mounted) return
    const p = window.solana
    if (p?.isPhantom) {
      setProvider(p)
      // si ya está conectada, levanta el pubkey
      try {
        if (p.publicKey) setPubkey(p.publicKey.toString())
      } catch {}
      // listeners
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
  const amount = Number(amountSol)

  const canDeposit =
    mounted &&
    phantomDetected &&
    isConnected &&
    !busy &&
    treasuryPk.length > 0 &&
    Number.isFinite(amount) &&
    amount > 0

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

      // 3) confirm
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

      // 4) credit internal USD (si solUsd=0, acredita 0 USD pero igual regresa meta.sol)
      const usdAmount = solUsd > 0 ? amount * solUsd : 0

      onBalanceCredit(usdAmount, { signature, sol: amount, publicKey: pubkey, network })

      setOkMsg(`Confirmed: ${amount} SOL`)
      setAmountSol("0.1")
    } catch (e: any) {
      setErr(e?.message || "Deposit failed")
    } finally {
      setBusy(false)
    }
  }

  // evita hydration mismatch
  if (!mounted) return <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-[12px] text-white/60">…</div>

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-widest text-white/45">PHANTOM</div>
          <div className="mt-1 text-[12px] text-white/75">
            Network: <span className="text-white/90 font-semibold">{network}</span>
          </div>
          <div className="mt-1 text-[11px] text-white/55 truncate">
            Treasury: <span className="text-white/75">{treasuryPk ? `${treasuryPk.slice(0, 6)}…${treasuryPk.slice(-6)}` : "NOT SET"}</span>
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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="text-[10px] tracking-widest text-white/45">AMOUNT (SOL)</div>
          <input
            value={amountSol}
            onChange={e => setAmountSol(e.target.value)}
            inputMode="decimal"
            placeholder="0.1"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white/85 outline-none"
          />
          <div className="mt-1 text-[10px] text-white/40">
            {solUsd > 0 ? `MVP rate: 1 SOL = $${solUsd} internal` : "Tip: set solUsd to credit internal USD"}
          </div>
        </div>

        <div className="flex flex-col gap-2">
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
    "phantom-pulse", // 👈 pulso morado
  ].join(" ")}
  style={{
    boxShadow:
      "0 0 0 1px rgba(168,85,247,0.22), 0 0 26px rgba(168,85,247,0.18)",
  }}
>
  {busy ? "DEPOSITING..." : "DEPOSIT"}
</button>

        </div>
      </div>

      {err ? <div className="mt-3 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-[11px] text-rose-100">{err}</div> : null}
      {okMsg ? <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[11px] text-emerald-100">{okMsg}</div> : null}

      {isConnected ? (
        <div className="mt-3 text-[10px] text-white/40">
          Wallet: <span className="text-white/70">{pubkey?.slice(0, 6)}…{pubkey?.slice(-6)}</span>
        </div>
      ) : null}
    </div>
  )
}
