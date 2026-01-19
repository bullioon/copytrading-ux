"use client"

import React, { useMemo, useState } from "react"
import type { Trader, Role, AssignedRoles } from "@/app/hooks/useTraders"

type TriggerOption = -4 | -6 | -8

type Props = {
  traders: Trader[]
  assignedRoles?: AssignedRoles

  // core state
  primaryTraderId: number | null
  onSetPrimary: (id: number) => void

  // plan b
  planBTrigger: TriggerOption
  onChangeTrigger: (v: TriggerOption) => void
  planBTraderId: number | null
  onSetPlanBTrader: (id: number | null) => void

  // engine/strategy
  canActivate: boolean
  onActivate: () => void

  // advanced toggle content
  advanced: React.ReactNode
  intel: React.ReactNode
}

function fmtTrader(t: Trader) {
  const wr = typeof t.winRate === "number" ? ` • ${Math.round(t.winRate)}%` : ""
  return `${t.name}${wr}`
}

export default function StrategyCorePanel({
  traders,
  assignedRoles,
  primaryTraderId,
  onSetPrimary,
  planBTrigger,
  onChangeTrigger,
  planBTraderId,
  onSetPlanBTrader,
  canActivate,
  onActivate,
  advanced,
  intel,
}: Props) {
  const [openAdvanced, setOpenAdvanced] = useState(false)

  const primary = useMemo(
    () => traders.find(t => t.id === primaryTraderId) ?? null,
    [traders, primaryTraderId]
  )

  const planBTrader = useMemo(
    () => traders.find(t => t.id === planBTraderId) ?? null,
    [traders, planBTraderId]
  )

  const hasPrimary = !!primaryTraderId

  return (
    <section className="rounded-3xl border border-white/10 bg-black/60 p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">STRATEGY CORE</div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            Choose who controls execution. Add safety rule if you want.
          </div>
          <div className="mt-1 text-[11px] text-white/55">
            This is the only part most users ever need.
          </div>
        </div>

        <button
          onClick={() => setOpenAdvanced(v => !v)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] tracking-widest text-white/70 hover:bg-white/5"
        >
          {openAdvanced ? "CLOSE ADVANCED" : "ADVANCED"}
        </button>
      </div>

      {/* CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PRIMARY */}
        <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[10px] tracking-widest text-white/45">PRIMARY TRADER</div>
          <div className="mt-2 text-[12px] text-white/70">
            Controls <span className="text-white/90 font-semibold">ENTRY + EXIT</span>.
          </div>

          <div className="mt-3">
            <select
              value={primaryTraderId ?? ""}
              onChange={(e) => onSetPrimary(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-[12px] text-white/85 outline-none"
            >
              <option value="" disabled>
                Select a trader…
              </option>
              {traders.map(t => (
                <option key={t.id} value={t.id}>
                  {fmtTrader(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] tracking-widest text-white/35">SUMMARY</div>
            <div className="mt-1 text-[12px] text-white/70">
              {primary ? (
                <>
                  Primary: <span className="text-white/90 font-semibold">{primary.name}</span>
                  <span className="text-white/40"> • ENTRY+EXIT</span>
                </>
              ) : (
                <span className="text-white/45">No primary selected yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* SAFETY RULE */}
        <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-[10px] tracking-widest text-white/45">SAFETY RULE (PLAN B)</div>
          <div className="mt-2 text-[12px] text-white/70">
            If drawdown reaches <span className="text-white/90 font-semibold">{planBTrigger}%</span>,
            then switch control to a fallback trader.
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] tracking-widest text-white/35 mb-1">TRIGGER</div>
              <select
                value={planBTrigger}
                onChange={(e) => onChangeTrigger(Number(e.target.value) as any)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-[12px] text-white/85 outline-none"
              >
                <option value={-4}>-4%</option>
                <option value={-6}>-6%</option>
                <option value={-8}>-8%</option>
              </select>
            </div>

            <div>
              <div className="text-[10px] tracking-widest text-white/35 mb-1">FALLBACK TRADER</div>
              <select
                value={planBTraderId ?? ""}
                onChange={(e) => onSetPlanBTrader(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3 text-[12px] text-white/85 outline-none"
              >
                <option value="">None</option>
                {traders.map(t => (
                  <option key={t.id} value={t.id}>
                    {fmtTrader(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] tracking-widest text-white/35">WHAT HAPPENS</div>
            <div className="mt-1 text-[12px] text-white/70 leading-relaxed">
              {planBTrader ? (
                <>
                  When DD ≤ <span className="text-white/90 font-semibold">{planBTrigger}%</span>, switch to{" "}
                  <span className="text-white/90 font-semibold">{planBTrader.name}</span>.
                  <span className="text-white/40"> (automatic)</span>
                </>
              ) : (
                <span className="text-white/45">
                  No fallback selected. Strategy keeps running with the primary trader.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVATE */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-[11px] text-white/55">
          {hasPrimary ? (
            <>Ready. You can activate immediately.</>
          ) : (
            <>
              Pick a <span className="text-white/85 font-semibold">Primary Trader</span> to unlock activation.
            </>
          )}
        </div>

        <button
          onClick={onActivate}
          disabled={!canActivate}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-semibold tracking-widest text-white/85 hover:bg-white/10 disabled:opacity-35"
        >
          ACTIVATE STRATEGY
        </button>
      </div>

      {/* INTEL MAP */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="text-[10px] tracking-widest text-white/45">TRADER INTELLIGENCE</div>
        <div className="mt-1 text-[11px] text-white/55">
          Explore traders + tech card. This does not assign anything.
        </div>
        <div className="mt-3">{intel}</div>
      </div>

      {/* ADVANCED */}
      {openAdvanced && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="text-[10px] tracking-widest text-white/45">ADVANCED CONFIGURATION</div>
          <div className="mt-1 text-[11px] text-white/55">
            Manual RISK / ENTRY / EXIT slots. Use only if you really need it.
          </div>
          <div className="mt-3">{advanced}</div>
        </div>
      )}
    </section>
  )
}
