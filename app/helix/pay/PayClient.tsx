"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Chain = "SOL" | "USDC" | "BTC"

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function PayClient() {
  const router = useRouter()

  const product = "HELIX MIRROR ENGINE"
  const amountUsd = 140

  const [chain, setChain] = useState<Chain>("USDC")
  const [deposit, setDeposit] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [countdown, setCountdown] = useState(90)
  const [pressure, setPressure] = useState(42)

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((s) => (s <= 1 ? 90 : s - 1))
      setPressure((p) => Math.min(95, p + 0.3))
    }, 1000)

    return () => clearInterval(t)
  }, [])

  const slotsLeft = useMemo(() => {
    const base = 12
    const drop = Math.floor((pressure - 42) / 10)
    return Math.max(1, base - drop)
  }, [pressure])

  async function createDeposit() {
    setErr(null)
    setBusy(true)

    try {
      const r = await fetch("/api/helix/deposit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product,
          chain,
          amountUsd,
        }),
      })

      const j = await r.json().catch(() => ({}))

      if (!r.ok) {
        throw new Error(j?.error || "Failed to create deposit")
      }

      setDeposit(j)
    } catch (e: any) {
      setErr(e?.message || "Deposit initialization failed")
    } finally {
      setBusy(false)
    }
  }

  async function copyAddress() {
    if (!deposit?.address) return

    await navigator.clipboard.writeText(deposit.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  useEffect(() => {
    if (!deposit?.id) return

    let alive = true

    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/helix/deposit/status?id=${deposit.id}`, {
          credentials: "include",
        })

        const j = await r.json().catch(() => ({}))

        if (!alive) return

        if (j.status === "confirmed") {
          router.replace("/enter")
        }

        if (j.status === "expired") {
          setErr("Deposit expired. Create a new one.")
          clearInterval(t)
        }
      } catch {}
    }, 3500)

    return () => {
      alive = false
      clearInterval(t)
    }
  }, [deposit?.id, router])

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-3">
          <div className="text-xs tracking-widest text-white/50">
            HELIX MODULE CHECKOUT
          </div>

          <div className="text-5xl font-semibold tracking-tight">
            ${amountUsd}
            <span className="text-white/60 text-2xl"> USD</span>
          </div>

          <div className="text-sm text-white/60">
            Confirm payment to activate
            <span className="text-white font-semibold"> HELIX Mirror Engine</span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-white/60 border border-white/10 bg-white/5 rounded-2xl p-4">
          <div>WINDOW · {fmtSec(countdown)}</div>
          <div>SLOTS LEFT · {slotsLeft}</div>
        </div>

        <div className="flex gap-2 justify-center">
          {(["USDC", "SOL", "BTC"] as Chain[]).map((c) => (
            <button
              key={c}
              onClick={() => setChain(c)}
              className={`rounded-xl border px-4 py-2 text-xs tracking-widest transition ${
                chain === c
                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          {!deposit && (
            <>
              <div className="text-xs text-white/60">
                Choose network and create a secure HELIX activation invoice.
              </div>

              <button
                onClick={createDeposit}
                disabled={busy}
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-semibold tracking-widest hover:bg-white/20 transition disabled:opacity-40"
              >
                {busy ? "CREATING DEPOSIT…" : `CREATE ${chain} DEPOSIT`}
              </button>
            </>
          )}

          {deposit && (
            <>
              <div className="text-xs text-white/60">
                Send EXACTLY the amount below to the generated address.
              </div>

              <div className="text-sm">
                <span className="text-white/50">Amount:</span>{" "}
                <span className="font-semibold">${amountUsd} USD</span>
              </div>

              <div className="text-sm">
                <span className="text-white/50">Network:</span>{" "}
                <span className="font-semibold">{deposit.chain}</span>
              </div>

              <div className="text-xs font-mono break-all bg-black/40 border border-white/10 rounded-xl p-3">
                {deposit.address}
              </div>

              <button
                onClick={copyAddress}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-widest hover:bg-white/10"
              >
                {copied ? "COPIED" : "COPY ADDRESS"}
              </button>

              {deposit.uri && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(deposit.uri)}`}
                    alt="QR"
                    className="rounded-xl border border-white/10"
                  />
                </div>
              )}

              <div className="text-xs text-yellow-400 mt-2">
                Waiting for blockchain confirmation…
              </div>
            </>
          )}

          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {err}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-white/40">
          Access is activated automatically after confirmation.
        </div>
      </div>
    </main>
  )
}