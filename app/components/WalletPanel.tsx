"use client"

import React, { useMemo, useState } from "react"
import PhantomDeposit from "@/app/components/PhantomDeposit" // ajusta si tu path es distinto

function fmtUsd(n: number) {
  const num = Number(n)
  if (!Number.isFinite(num)) return "$0.00"
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

type Tx = {
  id: string
  type: "DEPOSIT" | "WITHDRAW" | "CARD"
  title: string
  subtitle: string
  amountUsd?: number
  time: number
  status: "CONFIRMED" | "PENDING" | "FAILED"
}

type Props = {
  glow?: string
  borderClass?: string

  // el balance “real” que ya tienes (bullionsBalanceUsd)
  availableUsd: number

  // hooks/acciones visuales
  onGetCard?: () => void
}

export default function WalletPanel({
  glow = "rgba(34,211,238,0.22)",
  borderClass = "border-white/10",
  availableUsd,
  onGetCard,
}: Props) {
  const [txs, setTxs] = useState<Tx[]>([
    {
      id: "seed-1",
      type: "CARD",
      title: "Card waitlist",
      subtitle: "Request submitted",
      time: Date.now() - 1000 * 60 * 60 * 7,
      status: "CONFIRMED",
    },
    {
      id: "seed-2",
      type: "DEPOSIT",
      title: "Deposit credited",
      subtitle: "Phantom · Solana mainnet",
      amountUsd: 50,
      time: Date.now() - 1000 * 60 * 24,
      status: "CONFIRMED",
    },
  ])

  const sorted = useMemo(() => [...txs].sort((a, b) => b.time - a.time), [txs])

  const badge = (s: Tx["status"]) =>
    s === "CONFIRMED"
      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
      : s === "PENDING"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
        : "border-rose-300/25 bg-rose-300/10 text-rose-100"

  const icon = (t: Tx["type"]) =>
    t === "DEPOSIT" ? "↓" : t === "WITHDRAW" ? "↑" : "◈"

  return (
    <section
      className={["rounded-[28px] border bg-black/55 p-5", borderClass].join(" ")}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 80px ${glow}`,
        background:
          "radial-gradient(1100px 420px at 14% 0%, rgba(56,189,248,0.14), rgba(168,85,247,0.10), rgba(0,0,0,0.55))",
      }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-widest text-white/55">WALLET</div>
          <div className="mt-1 text-[14px] text-white/90 font-semibold">Account balance</div>
          <div className="mt-1 text-[11px] text-white/55">
            Phantom deposits credit your internal balance (casino-style).
          </div>
        </div>

        <button
          type="button"
          onClick={onGetCard}
          className="shrink-0 rounded-2xl border border-white/12 bg-white/10 px-3 py-2 text-[11px] font-semibold tracking-widest text-white/90 hover:bg-white/15"
          style={{ boxShadow: `0 0 26px ${glow}` }}
        >
          GET YOUR CARD
        </button>
      </div>

      {/* TOP GRID */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* LEFT: BALANCE + ACTIONS */}
        <div className="lg:col-span-7">
          <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest text-white/45">TOTAL AVAILABLE</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-white/95 tabular-nums">
                  {fmtUsd(availableUsd)}
                </div>
                <div className="mt-1 text-[11px] text-white/55">USD · internal credit</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
                <div className="text-[10px] tracking-widest text-white/45">NETWORK</div>
                <div className="mt-1 text-[11px] text-white/85 font-semibold">SOLANA</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {/* withdraw visual */}
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-left transition hover:bg-white/5"
              >
                <div className="text-[10px] tracking-widest text-white/45">WITHDRAW</div>
                <div className="mt-1 text-[12px] font-semibold tracking-widest text-white/90">REQUEST →</div>
                <div className="mt-1 text-[11px] text-white/55">Visual only (soon)</div>
              </button>

              {/* deposit anchor */}
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-left transition hover:bg-white/5"
                onClick={() => {
                  const el = document.getElementById("deposit-panel")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
              >
                <div className="text-[10px] tracking-widest text-white/45">DEPOSIT</div>
                <div className="mt-1 text-[12px] font-semibold tracking-widest text-white/90">PHANTOM →</div>
                <div className="mt-1 text-[11px] text-white/55">Credit instantly</div>
              </button>
            </div>
          </div>

          {/* CARD PREVIEW (visual) */}
          <div className="mt-3 rounded-[24px] border border-white/10 bg-black/45 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest text-white/45">BULLIONS CARD</div>
                <div className="mt-1 text-[12px] text-white/80">Premium access card (visual)</div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] tracking-widest text-white/60">
                NFC
              </div>
            </div>

            <div
              className="mt-3 overflow-hidden rounded-[22px] border border-white/10 bg-black/50 p-4"
              style={{
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 42px ${glow}`,
                background:
                  "radial-gradient(520px 260px at 10% 0%, rgba(34,211,238,0.18), rgba(168,85,247,0.10), rgba(0,0,0,0.6))",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] tracking-widest text-white/70">BULLIONS</div>
                <div className="text-[10px] tracking-widest text-white/45">CARD • 01</div>
              </div>

              <div className="mt-6 text-[18px] font-semibold tracking-tight text-white/90">
                Available: <span className="tabular-nums">{fmtUsd(availableUsd)}</span>
              </div>

              <div className="mt-2 text-[10px] tracking-widest text-white/55">
                LIMITS · GUARDRAILS · PRO DROPS
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div className="text-[10px] text-white/45">User</div>
                <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[10px] tracking-widest text-white/70">
                  ACTIVE
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-white/40">
              This is UI only — not a real card flow yet.
            </div>
          </div>
        </div>

        {/* RIGHT: TX HISTORY */}
        <div className="lg:col-span-5">
          <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] tracking-widest text-white/55">TRANSACTIONS</div>
              <div className="text-[10px] tracking-widest text-white/35">{sorted.length}</div>
            </div>

            <div className="mt-3 space-y-2">
              {sorted.slice(0, 8).map(tx => (
                <div key={tx.id} className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center text-white/75">
                          {icon(tx.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] text-white/85 font-semibold truncate">{tx.title}</div>
                          <div className="text-[10px] text-white/45 truncate">{tx.subtitle}</div>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-white/35">
                        {new Date(tx.time).toLocaleString()}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className={["inline-flex rounded-xl border px-2.5 py-1 text-[10px] tracking-widest", badge(tx.status)].join(" ")}>
                        {tx.status}
                      </div>

                      {typeof tx.amountUsd === "number" ? (
                        <div className="mt-2 text-[12px] font-semibold text-white/90 tabular-nums">
                          {tx.type === "WITHDRAW" ? "-" : "+"}
                          {fmtUsd(tx.amountUsd)}
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-white/40">—</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {!sorted.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-[11px] text-white/55">
                  No transactions yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* DEPOSIT PANEL */}
      <div id="deposit-panel" className="mt-4 rounded-[24px] border border-white/10 bg-black/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-black/40">
              <img src="/phantom.svg" alt="Phantom" className="h-4 w-4 object-contain opacity-95" draggable={false} />
            </div>
            <div>
              <div className="text-[10px] tracking-widest text-white/55">PHANTOM DEPOSIT</div>
              <div className="text-[11px] text-white/55">Mainnet · credits internal balance</div>
            </div>
          </div>

          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] tracking-widest text-emerald-100">
            SOLANA
          </div>
        </div>

        <div className="mt-4">
          <PhantomDeposit
            network="mainnet-beta"
            minUsd={50}
            onBalanceCredit={(usdAmount) => {
              const credit = Math.max(0, Number(usdAmount) || 0)

              // SOLO UI: insertamos tx visual
              setTxs(prev => [
                {
                  id: `tx-${Date.now()}`,
                  type: "DEPOSIT",
                  title: "Deposit credited",
                  subtitle: "Phantom · Solana mainnet",
                  amountUsd: credit,
                  time: Date.now(),
                  status: "CONFIRMED",
                },
                ...prev,
              ])
            }}
          />
        </div>

        <div className="mt-3 text-[10px] text-white/40">
          Confirmed tx → we credit your internal USD (visual for now).
        </div>
      </div>
    </section>
  )
}
