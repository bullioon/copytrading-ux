"use client"

import type { StrategyHealth } from "./StrategyTransitionPreview"

/* ================= TYPES ================= */

type TriggerOption = -4 | -6 | -8

type Props = {
  enabled: boolean
  health: StrategyHealth
  trigger: TriggerOption
  onChangeTrigger: (v: TriggerOption) => void
  backupCount: number
  onEnterAssignMode: () => void
}

const TRIGGERS: TriggerOption[] = [-4, -6, -8]

/* ================= COMPONENT ================= */

export default function PlanBConfigPanel({
  enabled,
  health,
  trigger,
  onChangeTrigger,
  backupCount,
  onEnterAssignMode,
}: Props) {
  const status =
    health === "critical"
      ? "ACTIVE"
      : health === "warning"
      ? "ARMED"
      : "STANDBY"

  return (
    <section
      className={`rounded-xl border p-5 bg-black/60 backdrop-blur space-y-4
        ${enabled ? "border-amber-500/30" : "border-white/5 opacity-40"}
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold tracking-widest">
            PLAN B — BACKUP EXECUTION
          </div>
          <div className="text-[11px] opacity-60 mt-1">
            Automatically takes control if performance degrades
          </div>
        </div>

        <span
          className={`text-[10px] px-2 py-0.5 rounded tracking-widest
            ${
              status === "ACTIVE"
                ? "bg-green-500/20 text-green-400"
                : status === "ARMED"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/10 text-white/50"
            }
          `}
        >
          {status}
        </span>
      </div>

      {/* TRIGGER */}
      <div className="space-y-2">
        <div className="text-xs opacity-70">
          Activation trigger (equity drawdown)
        </div>

        <div className="flex gap-2">
          {TRIGGERS.map(v => (
            <button
              key={v}
              type="button"
              disabled={!enabled || status === "ACTIVE"}
              onClick={() => onChangeTrigger(v)}
              className={`px-3 py-1 rounded border text-xs transition
                ${
                  v === trigger
                    ? "border-amber-400 text-amber-400"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }
                ${
                  !enabled || status === "ACTIVE"
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }
              `}
            >
              {v}%
            </button>
          ))}
        </div>

        <div className="text-[10px] opacity-50">
          Backup operators activate automatically when drawdown exceeds this
          level.
        </div>
      </div>

      {/* BACKUPS */}
      <div className="flex justify-between items-center">
        <div className="text-xs opacity-70">
          Backup operators assigned: {backupCount} / 2
        </div>

        <button
          type="button"
          disabled={!enabled || backupCount >= 2 || status === "ACTIVE"}
          onClick={onEnterAssignMode}
          className={`px-3 py-1 rounded border text-xs transition
            ${
              !enabled || backupCount >= 2 || status === "ACTIVE"
                ? "border-white/10 text-white/40 cursor-not-allowed"
                : "border-amber-400 text-amber-400 hover:bg-amber-400/10"
            }
          `}
        >
          Assign backup
        </button>
      </div>

      {/* FOOTER */}
      <div className="text-[10px] opacity-50">
        Plan B cannot be manually activated or disabled once engaged.
      </div>
    </section>
  )
}
