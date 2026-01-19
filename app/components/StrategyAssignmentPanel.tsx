"use client"

import React, { useMemo, useState } from "react"
import type { Trader, AssignedRoles, Role } from "@/app/hooks/useTraders"

type Props = {
  traders: Trader[]
  assignedRoles?: AssignedRoles
  activeRole: Role | null
  borderClass?: string

  onSelectRole: (r: Role) => void
  onClearRole: (r: Role) => void
  onAssignRole: (role: Role, traderId: number) => void

  planBTraderId?: number | null
  onSetPlanBTrader?: (id: number | null) => void
}

/* ================= STRATEGY RULES (UI STATE) ================= */

type RuleMetric = "DRAWDOWN" | "EQUITY_DROP" | "SPREAD" | "LATENCY" | "LOSS_STREAK"
type RuleOp = ">=" | "<=" | ">" | "<"
type RuleAction =
  | "SWITCH_ENTRY_TO_PLANB"
  | "SWITCH_EXIT_TO_PLANB"
  | "REDUCE_RISK_LEVEL"
  | "DISABLE_ENTRY"
  | "CLOSE_ALL"
  | "NOTIFY"

type RiskLevel = "LOW" | "MEDIUM" | "HIGH"

type StrategyRule = {
  id: string
  enabled: boolean
  metric: RuleMetric
  op: RuleOp
  value: number
  action: RuleAction
  targetRole?: Role | "PLANB" | null
  riskLevel?: RiskLevel
  note?: string
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function StrategyAssignmentPanel({
  traders,
  assignedRoles,
  activeRole,
  borderClass = "border-white/10",
  onSelectRole,
  onClearRole,
  onAssignRole,
  planBTraderId = null,
  onSetPlanBTrader,
}: Props) {
  const roles: Role[] = ["RISK", "ENTRY", "EXIT"]
  const safeRoles = assignedRoles ?? ({} as AssignedRoles)

  const assignedCount = roles.filter(r => !!(safeRoles as any)[r]).length

  const [openSlot, setOpenSlot] = useState<Role | "PLANB" | null>(null)
  const [techTraderId, setTechTraderId] = useState<number | null>(null)

  // ✅ strategic rules (max 3)
  const [rules, setRules] = useState<StrategyRule[]>([
    {
      id: uid(),
      enabled: true,
      metric: "DRAWDOWN",
      op: "<=",
      value: -6,
      action: "SWITCH_ENTRY_TO_PLANB",
      targetRole: "ENTRY",
      note: "If DD breach → route ENTRY to backup",
    },
  ])

  const techTrader = useMemo(() => {
    const firstAssigned = Object.values(safeRoles)[0] as any
    return traders.find(t => t.id === (techTraderId ?? firstAssigned)) ?? traders[0]
  }, [traders, techTraderId, safeRoles])

  const connected = useMemo(() => traders, [traders])

  function traderLabel(t: Trader) {
    return `${t.name}${typeof t.winRate === "number" ? ` • ${Math.round(t.winRate)}%` : ""}`
  }

  function assignedRoleForTrader(id: number) {
    for (const [role, traderId] of Object.entries(safeRoles as any)) {
      if (traderId === id) return role as Role
    }
    return null
  }

  function roleDesc(r: Role) {
    return r === "RISK" ? "Limits & safety" : r === "ENTRY" ? "Opens positions" : "Closes positions"
  }

  function metricLabel(m: RuleMetric) {
    if (m === "DRAWDOWN") return "DRAWDOWN (%)"
    if (m === "EQUITY_DROP") return "EQUITY DROP (%)"
    if (m === "SPREAD") return "SPREAD (pts)"
    if (m === "LATENCY") return "LATENCY (ms)"
    return "LOSS STREAK (n)"
  }

  function actionLabel(a: RuleAction) {
    if (a === "SWITCH_ENTRY_TO_PLANB") return "Switch ENTRY → PLAN B"
    if (a === "SWITCH_EXIT_TO_PLANB") return "Switch EXIT → PLAN B"
    if (a === "REDUCE_RISK_LEVEL") return "Reduce Risk Level"
    if (a === "DISABLE_ENTRY") return "Disable ENTRY"
    if (a === "CLOSE_ALL") return "Close All Positions"
    return "Notify"
  }

  const planBTrader = useMemo(
    () => (planBTraderId ? traders.find(t => t.id === planBTraderId) ?? null : null),
    [planBTraderId, traders]
  )

  const rulesEnabledCount = rules.filter(r => r.enabled).length
  const canAddRule = rules.length < 3

  return (
    <section className={`rounded-3xl border ${borderClass} bg-black/60 p-4`}>
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-white/45">STRATEGIC ASSIGNMENT</div>
          <div className="mt-1 text-sm font-semibold text-white/85">
            Primary slots + Plan B rules. <span className="text-white/50">Tech card stays visible.</span>
          </div>
          <div className="mt-1 text-[11px] text-white/45">
            Assigned: <span className="text-white/80 font-semibold">{assignedCount}</span>{" "}
            <span className="text-white/35">(1 is enough)</span>{" "}
            <span className="mx-2 text-white/15">•</span>{" "}
            Rules: <span className="text-white/80 font-semibold">{rulesEnabledCount}</span>{" "}
            <span className="text-white/35">enabled</span>
          </div>
        </div>

        {/* ROLE CHIPS */}
        <div className="flex items-center gap-2">
          {roles.map(r => {
            const selected = activeRole === r
            return (
              <button
                key={r}
                onClick={() => onSelectRole(r)}
                className={[
                  "rounded-xl border px-3 py-2 text-[11px] tracking-widest transition",
                  selected
                    ? "border-white/30 bg-white/10 text-white/90"
                    : "border-white/10 bg-black/40 text-white/65 hover:bg-white/5",
                ].join(" ")}
              >
                {r}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-3">
          {/* PRIMARY SLOTS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {roles.map(r => {
              const assignedId = (safeRoles as any)?.[r] as number | undefined
              const assignedTrader = assignedId ? traders.find(t => t.id === assignedId) : null
              const isOpen = openSlot === r

              return (
                <div key={r} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] tracking-widest text-white/45">{r}</div>
                      <div className="mt-1 text-[12px] text-white/80 font-semibold">
                        {assignedTrader ? traderLabel(assignedTrader) : "— empty —"}
                      </div>
                      <div className="mt-1 text-[11px] text-white/45">{roleDesc(r)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {assignedId ? (
                        <button
                          onClick={() => onClearRole(r)}
                          className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] tracking-widest text-white/60 hover:bg-white/5"
                        >
                          CLEAR
                        </button>
                      ) : null}

                      <button
                        onClick={() => setOpenSlot(isOpen ? null : r)}
                        className={[
                          "rounded-lg border px-2 py-1 text-[10px] tracking-widest transition",
                          isOpen
                            ? "border-white/30 bg-white/10 text-white/85"
                            : "border-white/10 bg-black/30 text-white/60 hover:bg-white/5",
                        ].join(" ")}
                      >
                        PICK
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[10px] tracking-widest text-white/35">AVAILABLE TRADERS</div>

                      <div className="max-h-[220px] overflow-auto rounded-xl border border-white/10 bg-black/30">
                        {connected.map(t => {
                          const busy = Object.values(safeRoles as any).includes(t.id) && (safeRoles as any)[r] !== t.id
                          const currentRole = assignedRoleForTrader(t.id)
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                if (busy) return
                                onAssignRole(r, t.id)
                                setTechTraderId(t.id)
                                setOpenSlot(null)
                              }}
                              className={[
                                "w-full flex items-center justify-between px-3 py-2 text-left text-[12px] transition",
                                busy ? "opacity-35 cursor-not-allowed" : "hover:bg-white/5",
                              ].join(" ")}
                            >
                              <span className="text-white/80">{traderLabel(t)}</span>
                              <span className="text-[10px] tracking-widest text-white/35">
                                {busy ? `IN USE (${String(currentRole ?? "").toUpperCase()})` : "SELECT"}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {activeRole !== r ? (
                        <div className="text-[10px] text-white/35">
                          Tip: role chips arriba (actual:{" "}
                          <span className="text-white/70 font-semibold">{String(activeRole ?? "—")}</span>)
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* PLAN B SLOT */}
          {onSetPlanBTrader && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] tracking-widest text-white/45">PLAN B (BACKUP TRADER)</div>
                  <div className="mt-1 text-[12px] text-white/80 font-semibold">
                    {planBTrader ? traderLabel(planBTrader) : "— empty —"}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    Used by rules: switch ENTRY/EXIT to backup when conditions trigger.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {planBTraderId ? (
                    <button
                      onClick={() => onSetPlanBTrader(null)}
                      className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] tracking-widest text-white/60 hover:bg-white/5"
                    >
                      CLEAR
                    </button>
                  ) : null}

                  <button
                    onClick={() => setOpenSlot(openSlot === "PLANB" ? null : "PLANB")}
                    className={[
                      "rounded-lg border px-2 py-1 text-[10px] tracking-widest transition",
                      openSlot === "PLANB"
                        ? "border-white/30 bg-white/10 text-white/85"
                        : "border-white/10 bg-black/30 text-white/60 hover:bg-white/5",
                    ].join(" ")}
                  >
                    PICK
                  </button>
                </div>
              </div>

              {openSlot === "PLANB" && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] tracking-widest text-white/35">AVAILABLE TRADERS</div>
                  <div className="max-h-[220px] overflow-auto rounded-xl border border-white/10 bg-black/30">
                    {connected.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSetPlanBTrader(t.id)
                          setTechTraderId(t.id)
                          setOpenSlot(null)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-[12px] hover:bg-white/5 transition"
                      >
                        <span className="text-white/80">{traderLabel(t)}</span>
                        <span className="text-[10px] tracking-widest text-white/35">SELECT</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STRATEGY RULES (MAX 3) */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest text-white/45">STRATEGY RULES (MAX 3)</div>
                <div className="mt-1 text-[12px] text-white/70">
                  IF <span className="text-white/85 font-semibold">condition</span> THEN{" "}
                  <span className="text-white/85 font-semibold">action</span>.
                  <span className="ml-2 text-white/35">Rules are ordered top → down.</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!canAddRule) return
                  setRules(prev => [
                    ...prev,
                    {
                      id: uid(),
                      enabled: true,
                      metric: "LATENCY",
                      op: ">=",
                      value: 180,
                      action: "NOTIFY",
                      targetRole: null,
                      note: "",
                    },
                  ])
                }}
                disabled={!canAddRule}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] tracking-widest text-white/70 hover:bg-white/5 disabled:opacity-35"
              >
                + ADD RULE
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="mt-3 text-[11px] text-white/45">No rules. Add up to 3.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {rules.map((r, idx) => {
                  const needsPlanB =
                    r.action === "SWITCH_ENTRY_TO_PLANB" || r.action === "SWITCH_EXIT_TO_PLANB"

                  const planBMissing = needsPlanB && !planBTraderId
                  const needsRiskLevel = r.action === "REDUCE_RISK_LEVEL"

                  return (
                    <div
                      key={r.id}
                      className={[
                        "rounded-xl border px-3 py-3",
                        r.enabled ? "border-white/10 bg-black/30" : "border-white/5 bg-black/20 opacity-60",
                        planBMissing ? "shadow-[0_0_0_2px_rgba(239,68,68,0.18)]" : "",
                      ].join(" ")}
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setRules(prev => prev.map(x => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))
                            }
                            className={[
                              "rounded-lg border px-2 py-1 text-[10px] tracking-widest transition",
                              r.enabled
                                ? "border-green-400/25 bg-green-500/10 text-green-200/80 hover:bg-green-500/15"
                                : "border-white/10 bg-black/30 text-white/60 hover:bg-white/5",
                            ].join(" ")}
                          >
                            {r.enabled ? "ON" : "OFF"}
                          </button>

                          <div className="text-[10px] tracking-widest text-white/35">
                            RULE {idx + 1}
                            {planBMissing ? <span className="ml-2 text-red-300/80">PLAN B REQUIRED</span> : null}
                          </div>
                        </div>

                        <button
                          onClick={() => setRules(prev => prev.filter(x => x.id !== r.id))}
                          className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] tracking-widest text-white/55 hover:bg-white/5 self-start lg:self-auto"
                        >
                          REMOVE
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-[1.1fr_0.7fr_0.7fr_1.3fr]">
                        {/* IF metric */}
                        <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-2">
                          <div className="text-[10px] tracking-widest text-white/35 mb-1">IF</div>
                          <div className="flex items-center gap-2">
                            <select
                              value={r.metric}
                              onChange={e =>
                                setRules(prev =>
                                  prev.map(x =>
                                    x.id === r.id ? { ...x, metric: e.target.value as RuleMetric } : x
                                  )
                                )
                              }
                              className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[12px] text-white/80"
                            >
                              <option value="DRAWDOWN">{metricLabel("DRAWDOWN")}</option>
                              <option value="EQUITY_DROP">{metricLabel("EQUITY_DROP")}</option>
                              <option value="SPREAD">{metricLabel("SPREAD")}</option>
                              <option value="LATENCY">{metricLabel("LATENCY")}</option>
                              <option value="LOSS_STREAK">{metricLabel("LOSS_STREAK")}</option>
                            </select>
                          </div>
                        </div>

                        {/* op */}
                        <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-2">
                          <div className="text-[10px] tracking-widest text-white/35 mb-1">OP</div>
                          <select
                            value={r.op}
                            onChange={e =>
                              setRules(prev =>
                                prev.map(x => (x.id === r.id ? { ...x, op: e.target.value as RuleOp } : x))
                              )
                            }
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[12px] text-white/80"
                          >
                            <option value=">=">{">="}</option>
                            <option value="<=">{"<="}</option>
                            <option value=">">{">"}</option>
                            <option value="<">{"<"}</option>
                          </select>
                        </div>

                        {/* value */}
                        <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-2">
                          <div className="text-[10px] tracking-widest text-white/35 mb-1">VALUE</div>
                          <input
                            value={String(r.value)}
                            onChange={e => {
                              const n = Number(e.target.value)
                              setRules(prev => prev.map(x => (x.id === r.id ? { ...x, value: Number.isFinite(n) ? n : 0 } : x)))
                            }}
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[12px] text-white/80"
                            inputMode="numeric"
                          />
                        </div>

                        {/* THEN */}
                        <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-2">
                          <div className="text-[10px] tracking-widest text-white/35 mb-1">THEN</div>

                          <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <select
                              value={r.action}
                              onChange={e => {
                                const next = e.target.value as RuleAction
                                setRules(prev =>
                                  prev.map(x =>
                                    x.id === r.id
                                      ? {
                                          ...x,
                                          action: next,
                                          // sensible defaults
                                          targetRole:
                                            next === "SWITCH_ENTRY_TO_PLANB"
                                              ? "ENTRY"
                                              : next === "SWITCH_EXIT_TO_PLANB"
                                                ? "EXIT"
                                                : x.targetRole ?? null,
                                          riskLevel: next === "REDUCE_RISK_LEVEL" ? (x.riskLevel ?? "MEDIUM") : undefined,
                                        }
                                      : x
                                  )
                                )
                              }}
                              className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[12px] text-white/80"
                            >
                              <option value="SWITCH_ENTRY_TO_PLANB">{actionLabel("SWITCH_ENTRY_TO_PLANB")}</option>
                              <option value="SWITCH_EXIT_TO_PLANB">{actionLabel("SWITCH_EXIT_TO_PLANB")}</option>
                              <option value="REDUCE_RISK_LEVEL">{actionLabel("REDUCE_RISK_LEVEL")}</option>
                              <option value="DISABLE_ENTRY">{actionLabel("DISABLE_ENTRY")}</option>
                              <option value="CLOSE_ALL">{actionLabel("CLOSE_ALL")}</option>
                              <option value="NOTIFY">{actionLabel("NOTIFY")}</option>
                            </select>

                            {/* target role */}
                            <select
                              value={String(r.targetRole ?? "")}
                              onChange={e =>
                                setRules(prev =>
                                  prev.map(x =>
                                    x.id === r.id ? { ...x, targetRole: (e.target.value as any) || null } : x
                                  )
                                )
                              }
                              className="w-full md:w-[180px] rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[12px] text-white/80"
                            >
                              <option value="">— target —</option>
                              <option value="RISK">RISK slot</option>
                              <option value="ENTRY">ENTRY slot</option>
                              <option value="EXIT">EXIT slot</option>
                              <option value="PLANB">PLAN B</option>
                            </select>

                            {/* risk level */}
                            {needsRiskLevel ? (
                              <select
                                value={r.riskLevel ?? "MEDIUM"}
                                onChange={e =>
                                  setRules(prev =>
                                    prev.map(x =>
                                      x.id === r.id ? { ...x, riskLevel: e.target.value as RiskLevel } : x
                                    )
                                  )
                                }
                                className="w-full md:w-[150px] rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[12px] text-white/80"
                              >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                              </select>
                            ) : null}
                          </div>

                          {planBMissing ? (
                            <div className="mt-2 text-[10px] text-red-300/80">
                              This rule needs PLAN B trader selected.
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* note */}
                      <div className="mt-2">
                        <input
                          value={r.note ?? ""}
                          onChange={e =>
                            setRules(prev =>
                              prev.map(x => (x.id === r.id ? { ...x, note: e.target.value } : x))
                            )
                          }
                          placeholder="Optional note (e.g., route away from high latency broker)"
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-white/75 placeholder:text-white/25"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-3 text-[10px] text-white/35">
              Tip: keep it simple — max 3 rules. Start with DD → switch ENTRY to PLAN B.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TECH CARD */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-widest text-white/45">TRADER TECH CARD</div>
              <div className="mt-2 text-lg font-extrabold text-white/90">{techTrader?.name ?? "—"}</div>
              <div className="text-[12px] text-white/50">{techTrader?.strategy ?? "Execution profile"}</div>
            </div>

            <button
              onClick={() => setTechTraderId(null)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] tracking-widest text-white/60 hover:bg-white/5"
            >
              AUTO
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] tracking-widest text-white/35">WIN</div>
              <div className="mt-1 text-[14px] text-white/85 font-semibold">
                {typeof techTrader?.winRate === "number" ? `${Math.round(techTrader.winRate)}%` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] tracking-widest text-white/35">STATUS</div>
              <div className="mt-1 text-[14px] text-white/85 font-semibold">ONLINE</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] tracking-widest text-white/35">PRIMARY ROUTING</div>

            <div className="mt-2 space-y-2">
              {roles.map(r => {
                const id = (safeRoles as any)?.[r] as number | undefined
                const t = id ? traders.find(x => x.id === id) : null
                return (
                  <button
                    key={r}
                    onClick={() => {
                      if (t) setTechTraderId(t.id)
                    }}
                    className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-left hover:bg-white/5 transition"
                  >
                    <span className="text-[11px] tracking-widest text-white/45">{r}</span>
                    <span className="text-[12px] text-white/75">{t ? traderLabel(t) : "— empty —"}</span>
                  </button>
                )
              })}

              {onSetPlanBTrader ? (
                <button
                  onClick={() => {
                    if (planBTrader) setTechTraderId(planBTrader.id)
                  }}
                  className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-left hover:bg-white/5 transition"
                >
                  <span className="text-[11px] tracking-widest text-white/45">PLAN B</span>
                  <span className="text-[12px] text-white/75">{planBTrader ? traderLabel(planBTrader) : "— empty —"}</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-[10px] tracking-widest text-white/35">NOTES</div>
            <div className="mt-1 text-[12px] text-white/60 leading-relaxed">
              Slot selection updates routing. Rule edits define your <span className="text-white/80 font-semibold">IF → THEN</span>{" "}
              behavior (max 3). Clicking a trader anywhere updates this tech card.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
