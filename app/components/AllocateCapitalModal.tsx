"use client"

import { useEffect, useState } from "react"

type Props = {
  open: boolean
  maxUsd: number
  onClose: () => void
  onConfirm: (amount: number) => void
}

function fmtUsd(n: number, opts?: { sign?: boolean }) {
  const v = Number.isFinite(n) ? n : 0
  const s = v < 0 ? "-" : opts?.sign && v > 0 ? "+" : ""
  return `${s}$${Math.abs(v).toFixed(2)}`
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export function AllocateCapitalModal({ open, maxUsd, onClose, onConfirm }: Props) {
  const MIN_DEPOSIT_USD = 50

  const [raw, setRaw] = useState("")
  const [maxSnapshot, setMaxSnapshot] = useState(0)

  // ✅ snapshot SOLO al abrir (no cambia aunque maxUsd parpadee)
  useEffect(() => {
    if (!open) return
    const m = Number.isFinite(Number(maxUsd)) ? Number(maxUsd) : 0
    setMaxSnapshot(m)
    setRaw("")
  }, [open]) // 👈 SOLO open

  const max = maxSnapshot

  // ✅ parse seguro
  const n = Number(String(raw).replace(/[^0-9.]/g, ""))
  const amount = Number.isFinite(n) ? clamp(n, 0, max) : 0

  const belowMin = amount > 0 && amount < MIN_DEPOSIT_USD
  const canConfirm = amount >= MIN_DEPOSIT_USD && amount <= max

  // DEBUG (déjalo 1 minuto)
  console.log("[ALLOC MODAL]", { open, raw, n, amount, maxUsd, max, belowMin, canConfirm })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* ✅ EL OVERLAY es el que cierra */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* ✅ stopPropagation para que click adentro NO cierre */}
      <div
        className="relative w-full max-w-[520px] rounded-[22px] border border-white/10 bg-black/75 p-5 neon-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[14px] text-white/90 font-semibold">¿How much want to add?</div>
            <div className="mt-1 text-[12px] text-white/60">
              Minimum: <span className="text-white/85 font-semibold">$50.00</span> · Max Available:{" "}
              <span className="text-white/85 font-semibold">{fmtUsd(max)}</span>
            </div>

            {belowMin ? (
              <div className="mt-2 text-[11px] text-rose-200/90">Minimum Deposit: $50.00</div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(amount)}
            className="rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-4 py-2 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-300/20 disabled:opacity-40"
          >
            Confirm
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
          <div className="text-[10px] tracking-widest text-white/45">AMOUNT (USD)</div>

          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-[14px] text-white/90 outline-none focus:border-white/25"
            placeholder={`0 — ${fmtUsd(max)}`}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            inputMode="decimal"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {[0.25, 0.5, 0.75].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRaw(String((max * p).toFixed(2)))} // ✅ usa max snapshot
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 hover:bg-white/10"
              >
                {Math.round(p * 100)}%
              </button>
            ))}

            <button
              type="button"
              onClick={() => setRaw(String(max.toFixed(2)))} // ✅ snapshot
              className="ml-auto rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-white/85 hover:bg-white/15"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[11px] text-white/70 hover:bg-white/5"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(amount)}
            className="rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-4 py-2 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-300/20 disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}