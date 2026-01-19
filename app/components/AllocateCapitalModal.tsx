"use client"

import React, { useMemo, useState } from "react"

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (amount: number) => void

  balanceUsd: number
  strategyName?: string
  alreadyActiveStrategyName?: string | null
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

export default function AllocateCapitalModal({
  open,
  onClose,
  onConfirm,
  balanceUsd,
  strategyName,
  alreadyActiveStrategyName,
}: Props) {
  const max = useMemo(() => Math.max(0, balanceUsd), [balanceUsd])
  const [raw, setRaw] = useState<string>("")

  const amount = useMemo(() => {
    const n = Number(raw)
    return clamp(n, 0, max)
  }, [raw, max])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[min(520px,92vw)] rounded-2xl bg-neutral-950 border border-white/10 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">
              ¿Cuánto saldo quieres asignar?
            </div>
            <div className="text-sm text-white/60 mt-1">
              {strategyName ? (
                <>
                  Estrategia: <span className="text-white/80">{strategyName}</span>
                </>
              ) : (
                "Selecciona el monto para esta estrategia."
              )}
            </div>
          </div>

          <button
            className="rounded-xl px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {alreadyActiveStrategyName ? (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
            Ya tienes una estrategia activa:{" "}
            <span className="font-semibold">{alreadyActiveStrategyName}</span>.
            <br />
            Para activar otra, primero detén/desasigna la actual.
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Balance disponible</span>
            <span className="font-semibold">${max.toFixed(2)}</span>
          </div>

          <div className="mt-3">
            <label className="text-xs text-white/60">Monto (USD)</label>
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              inputMode="decimal"
              placeholder={`0 — ${max.toFixed(2)}`}
              className="mt-2 w-full rounded-xl bg-neutral-900 border border-white/10 px-3 py-2 text-base outline-none focus:border-white/30"
            />
            <div className="mt-2 flex gap-2">
              <button
                className="rounded-xl px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
                onClick={() => setRaw(String((max * 0.25).toFixed(2)))}
              >
                25%
              </button>
              <button
                className="rounded-xl px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
                onClick={() => setRaw(String((max * 0.5).toFixed(2)))}
              >
                50%
              </button>
              <button
                className="rounded-xl px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
                onClick={() => setRaw(String((max * 0.75).toFixed(2)))}
              >
                75%
              </button>
              <button
                className="ml-auto rounded-xl px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => setRaw(String(max.toFixed(2)))}
              >
                MAX
              </button>
            </div>

            <div className="mt-3 text-xs text-white/50">
              Máximo permitido: ${max.toFixed(2)}.
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded-xl px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            disabled={alreadyActiveStrategyName !== null || amount <= 0}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-500/90"
            onClick={() => onConfirm(amount)}
            title={
              alreadyActiveStrategyName
                ? "Detén la estrategia activa primero"
                : amount <= 0
                ? "El monto debe ser mayor a 0"
                : "Confirmar"
            }
          >
            Confirmar asignación
          </button>
        </div>
      </div>
    </div>
  )
}
