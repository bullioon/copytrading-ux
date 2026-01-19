"use client"

import type { Trader } from "@/app/hooks/useTraders"
import type { StrategyHealth } from "./StrategyTransitionPreview"

type Props = {
  planBTraders: Trader[]
  onAssign: () => void
  onClear: (index: number) => void
  health: StrategyHealth
  enabled: boolean
}

/* ================= COMPONENT ================= */

export default function PlanBSlots({
  planBTraders,
  onAssign,
  onClear,
  health,
  enabled,
}: Props) {
  const active = health === "critical"

  return (
    <section className="space-y-4">
      {/* HEADER */}
      <div className="text-xs tracking-widest opacity-60">
        PLAN B — BACKUP EXECUTION
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map(index => {
          const trader = planBTraders[index]

          return (
            <div
              key={index}
              className={`rounded-xl border p-4 bg-black/60 backdrop-blur transition
                ${
                  !enabled
                    ? "border-white/5 opacity-40"
                    : trader
                    ? active
                      ? "border-green-500/40"
                      : "border-amber-500/40"
                    : "border-white/10"
                }
              `}
            >
              {/* TITLE */}
              <div className="mb-2 flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold">
                    Backup Operator #{index + 1}
                  </div>
                  <div className="text-[10px] opacity-60">
                    Activated automatically on critical performance
                  </div>
                </div>

                {trader && enabled && (
                  <button
                    onClick={() => onClear(index)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* BODY */}
              {!enabled && (
                <div className="text-xs opacity-50 h-14 flex items-center">
                  Complete Plan A to unlock
                </div>
              )}

              {enabled && !trader && (
                <button
                  onClick={onAssign}
                  className="mt-3 w-full rounded border border-white/10 px-3 py-2 text-xs hover:border-white/30"
                >
                  Assign backup operator
                </button>
              )}

              {trader && (
                <div className="mt-3 flex items-center justify-between rounded border border-white/10 px-3 py-2 text-xs">
                  <div>
                    <div className="font-medium">{trader.name}</div>
                    <div className="text-[10px] opacity-50">
                      Strategy: {trader.strategy}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded
                      ${
                        active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-amber-500/20 text-amber-400"
                      }
                    `}
                  >
                    {active ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
