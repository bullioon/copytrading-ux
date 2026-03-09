"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { TabKey } from "@/app/lib/types"

type Chain = "SOL" | "BTC"

type Deposit = {
  id: string
  status?: "pending" | "confirmed" | "expired"
  chain: Chain
  amountUsd: number
  address: string
  uri?: string
  expiresAt?: number
}

function fmtUsd(n: number) {
  return `$${Number(n || 0).toFixed(2)}`
}

function fmtTimeLeft(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function EnterLabDepositPanel(props: {
  uiBalanceUsd: number
  isBullion: boolean
  goTab: (tab: TabKey) => void
}) {
  const router = useRouter()
  const { uiBalanceUsd, isBullion, goTab } = props

  const [chain, setChain] = useState<Chain>("SOL")
  const [amountUsd, setAmountUsd] = useState<number>(100)
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(Date.now())

  const minUsd = 100

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const canCreate = useMemo(() => {
    const a = Number(amountUsd || 0)
    return Number.isFinite(a) && a >= minUsd
  }, [amountUsd])

  const timeLeft = deposit?.expiresAt ? deposit.expiresAt - now : 0

  async function createDeposit() {
    setErr(null)
    setBusy(true)
    try {
      if (!isBullion) throw new Error("Deposits are available in BULLION only (for now).")
      if (!canCreate) throw new Error(`Minimum deposit is ${fmtUsd(minUsd)}.`)

      const r = await fetch("/api/enterlab/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain,
          amountUsd: Number(amountUsd),
        }),
      })

      const j = (await r.json().catch(() => ({}))) as any
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)

      setDeposit({
        id: j.id,
        status: j.status || "pending",
        chain: (j.chain as Chain) || chain,
        amountUsd: j.amountUsd ?? Number(amountUsd),
        address: j.address,
        uri: j.uri,
        expiresAt: j.expiresAt,
      })
    } catch (e: any) {
      setErr(e?.message || "Failed to create deposit")
    } finally {
      setBusy(false)
    }
  }

  async function copyAddress() {
    try {
      if (!deposit?.address) return
      await navigator.clipboard.writeText(deposit.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  // Poll deposit status
  useEffect(() => {
    if (!deposit?.id) return

    let alive = true
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/enterlab/deposit/status?id=${deposit.id}`, {
          credentials: "include",
        })
        const j = await r.json().catch(() => ({}))
        if (!alive) return

        const s = j?.status || "pending"

        if (s === "confirmed") {
          router.replace("/enter")
          return
        }

        if (s === "expired") {
          setErr("Invoice expired. Create a new one.")
          setDeposit((d) => (d ? { ...d, status: "expired" } : d))
          clearInterval(t)
          return
        }

        // keep updated
        setDeposit((d) =>
          d
            ? {
                ...d,
                status: s,
                chain: j?.chain ?? d.chain,
                amountUsd: j?.amountUsd ?? d.amountUsd,
                address: j?.address ?? d.address,
                uri: j?.uri ?? d.uri,
                expiresAt: j?.expiresAt ?? d.expiresAt,
              }
            : d
        )
      } catch {
        // ignore polling errors
      }
    }, 3500)

    return () => {
      alive = false
      clearInterval(t)
    }
  }, [deposit?.id, router])

  const solActive = chain === "SOL"
  const btcActive = chain === "BTC"

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/50 p-5 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] tracking-[0.22em] text-white/55">DEPOSIT</div>
            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] tracking-widest text-white/70">
              BULLION
            </span>
          </div>

          <div className="mt-2 text-[16px] md:text-[18px] font-semibold text-white/90">
            Internal balance: <span className="tabular-nums">{fmtUsd(uiBalanceUsd)}</span>
          </div>

          <div className="mt-1 text-[12px] text-white/55">
            1) Create invoice · 2) Send crypto · 3) Auto-confirm
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] tracking-[0.20em] text-white/70">
          {deposit?.status === "confirmed"
            ? "CONFIRMED"
            : deposit?.status === "expired"
            ? "EXPIRED"
            : deposit?.id
            ? "PENDING"
            : "READY"}
        </div>
      </div>

      {/* CREATE MODE */}
      {!deposit ? (
        <div className="mt-5 space-y-4">
          {/* Chain selector (Phantom style) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChain("SOL")}
              className={[
                "rounded-2xl border px-4 py-4 text-left transition",
                solActive
                  ? "border-violet-300/30 bg-violet-300/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-[0.20em] text-white/85">SOL</div>
                <span
                  className={[
                    "rounded-full border px-2 py-1 text-[10px] tracking-widest",
                    solActive ? "border-violet-300/25 bg-violet-300/10 text-violet-100" : "border-white/10 bg-black/35 text-white/55",
                  ].join(" ")}
                >
                  SOLANA
                </span>
              </div>
              <div className="mt-2 text-[12px] text-white/55">
                Solana network · fastest confirmation
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChain("BTC")}
              className={[
                "rounded-2xl border px-4 py-4 text-left transition",
                btcActive
                  ? "border-yellow-300/30 bg-yellow-300/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-[0.20em] text-white/85">BTC</div>
                <span
                  className={[
                    "rounded-full border px-2 py-1 text-[10px] tracking-widest",
                    btcActive ? "border-yellow-300/25 bg-yellow-300/10 text-yellow-100" : "border-white/10 bg-black/35 text-white/55",
                  ].join(" ")}
                >
                  BITCOIN
                </span>
              </div>
              <div className="mt-2 text-[12px] text-white/55">
                Bitcoin network · on-chain confirmation
              </div>
            </button>
          </div>

          {/* Amount */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-[0.22em] text-white/45">AMOUNT (USD)</div>
              <div className="text-[10px] tracking-widest text-white/45">MIN {fmtUsd(minUsd)}</div>
            </div>

            <input
              value={String(amountUsd)}
              onChange={(e) => setAmountUsd(Number(e.target.value))}
              inputMode="numeric"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-[16px] text-white outline-none"
              placeholder="100"
            />

            <div className="mt-2 text-[11px] text-white/45">
              You choose the amount. Minimum {fmtUsd(minUsd)}.
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={createDeposit}
            disabled={busy || !isBullion || !canCreate}
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 text-[11px] font-semibold tracking-[0.22em]
                       hover:bg-white/20 transition disabled:opacity-40"
          >
            {busy ? "CREATING…" : `CREATE ${chain} INVOICE`}
          </button>

          <button
            type="button"
            onClick={() => goTab("wallet")}
            className="w-full rounded-2xl border border-white/10 bg-black/45 py-3 text-[11px] font-semibold tracking-[0.20em] text-white/70 hover:bg-white/5"
          >
            OPEN WALLET TAB →
          </button>

          {err ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-[12px] text-red-200">
              {err}
            </div>
          ) : null}
        </div>
      ) : (
        /* INVOICE MODE */
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] tracking-[0.22em] text-white/45">INVOICE</div>

              <div className="text-[10px] tracking-widest text-white/55">
                {deposit.expiresAt ? (
                  <>
                    EXPIRES · <span className="text-white/80">{fmtTimeLeft(timeLeft)}</span>
                  </>
                ) : (
                  <>PENDING</>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-[10px] tracking-widest text-white/45">NETWORK</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="font-semibold text-white/90">{deposit.chain}</div>
                  <span
                    className={[
                      "rounded-full border px-2 py-1 text-[10px] tracking-widest",
                      deposit.chain === "SOL"
                        ? "border-violet-300/25 bg-violet-300/10 text-violet-100"
                        : "border-yellow-300/25 bg-yellow-300/10 text-yellow-100",
                    ].join(" ")}
                  >
                    {deposit.chain === "SOL" ? "SOLANA" : "BITCOIN"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-[10px] tracking-widest text-white/45">AMOUNT</div>
                <div className="mt-1 font-semibold text-white/90">{fmtUsd(deposit.amountUsd)}</div>
              </div>
            </div>

            {/* Instructions (only network) */}
            <div className="mt-4 text-[10px] tracking-[0.22em] text-white/45">
              {deposit.chain === "SOL" ? "SOLANA NETWORK" : "BTC NETWORK"}
            </div>

            <div className="mt-2 text-[12px] text-white/65">
              {deposit.chain === "SOL"
                ? "Send only SOL on Solana network to this address."
                : "Send only BTC on Bitcoin network to this address."}
            </div>

            <div className="mt-2 text-xs font-mono break-all rounded-2xl border border-white/10 bg-black/50 p-3 text-white/90">
              {deposit.address}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyAddress}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] tracking-[0.20em] text-white/80 hover:bg-white/10"
              >
                {copied ? "COPIED" : "COPY"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeposit(null)
                  setErr(null)
                }}
                className="rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-[11px] tracking-[0.20em] text-white/70 hover:bg-white/5"
              >
                NEW INVOICE
              </button>
            </div>

            {/* Phantom pay ONLY for SOL */}
            {deposit.chain === "SOL" && deposit.uri ? (
              <a
                href={deposit.uri}
                className="mt-2 block rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 py-3 text-center text-[11px] font-semibold tracking-[0.20em] text-violet-100 hover:bg-violet-300/15"
              >
                PHANTOM PAY →
              </a>
            ) : null}
          </div>

          {/* QR (nice card, optional) */}
          {deposit.uri ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] tracking-[0.22em] text-white/45">QR</div>
                <div className="text-[10px] tracking-widest text-white/55">SCAN TO PAY</div>
              </div>

              <div className="mt-3 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    deposit.uri
                  )}`}
                  alt="QR"
                  className="rounded-2xl border border-white/10 bg-black/50 p-2"
                />
              </div>

              <div className="mt-3 text-[11px] text-yellow-300">
                Waiting for confirmation…
                {deposit.status === "expired" ? " (expired)" : ""}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-yellow-300">Waiting for confirmation…</div>
          )}

          {err ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-[12px] text-red-200">
              {err}
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4 text-[10px] text-white/35">
        Confirmation will redirect you to <span className="text-white/60">/enter</span>.
      </div>
    </div>
  )
}