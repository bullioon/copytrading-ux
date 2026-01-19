"use client"

import type { Trader } from "@/app/hooks/useTraders"

type CoreRole = "RISK" | "ENTRY" | "EXIT"

type Props = {
  role: CoreRole
  trader?: Trader
  locked?: boolean
  error?: string
  onSelect: () => void
  onClear?: () => void
}

/* ================= ROLE META ================= */

const ROLE_META: Record<
  CoreRole,
  { title: string; description: string; accent: string }
> = {
  RISK: {
    title: "Risk Officer",
    description: "Controls drawdown and emergency shutdowns",
    accent: "border-green-500/40 text-green-400",
  },
  ENTRY: {
    title: "Entry Executor",
    description: "Determines execution timing and market entry",
    accent: "border-sky-500/40 text-sky-400",
  },
  EXIT: {
    title: "Exit Executor",
    description: "Manages profit taking and loss exits",
    accent: "border-purple-500/40 text-purple-400",
  },
}

/* ================= COMPONENT ================= */

export default function RoleSlot({
  role,
  trader,
  locked = false,
  error,
  onSelect,
  onClear,
}: Props) {
  const meta = ROLE_META[role]

  return (
    <div
      className={`rounded-lg border p-4 transition-all bg-black/60 backdrop-blur
        ${
          locked
            ? "border-white/5 opacity-40"
            : error
            ? "border-red-500/40"
            : meta.accent
        }
      `}
    >
      {/* HEADER */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold">{meta.title}</h4>
        <p className="text-[11px] opacity-60">{meta.description}</p>
      </div>

      {/* BODY — EMPTY */}
      {!trader && !locked && (
        <button
          onClick={onSelect}
          className="mt-3 w-full rounded border border-white/10 px-3 py-2 text-xs
                     hover:border-white/30 transition"
        >
          Assign operator
        </button>
      )}

      {/* BODY — LOCKED */}
      {locked && (
        <div className="mt-3 text-xs text-white/40">
          Locked — complete previous role
        </div>
      )}

      {/* BODY — FILLED */}
      {trader && (
        <div className="mt-3 flex items-center justify-between rounded border border-white/10 px-3 py-2 text-xs">
          <div>
            <div className="font-medium">{trader.name}</div>
            <div className="text-[10px] opacity-50">
              Strategy: {trader.strategy}
            </div>
          </div>

          {onClear && !locked && (
            <button
              onClick={onClear}
              className="text-[10px] text-red-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mt-2 text-[10px] text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}

