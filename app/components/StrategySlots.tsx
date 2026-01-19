"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, type Transition } from "framer-motion"


import type {
  Trader,
  AssignedRoles,
  Role,
  RiskProfile,
} from "@/app/hooks/useTraders"

/* ================= PROPS ================= */

type Props = {
  traders: Trader[]
  assignedRoles?: AssignedRoles
  activeRole: Role | null
  onSelectRole: (role: Role) => void
  onClearRole: (role: Role) => void
  getRiskProfile: (trader: Trader) => RiskProfile

  // ✅ NEW: signals from engine (optional)
  signals?: {
    drawdownPct: number
    lossStreak: number
    equityFlatMs: number
  }
}

/* ================= ROLE ORDER ================= */

const ROLE_ORDER: Role[] = ["RISK", "ENTRY", "EXIT"]

/* ================= ROLE META ================= */

const ROLE_META: Record<Role, { label: string; hint: string }> = {
  RISK: {
    label: "Risk Officer",
    hint: "Controls exposure, drawdown and emergency shutdowns",
  },
  ENTRY: {
    label: "Entry Executor",
    hint: "Determines timing and conditions for trade entry",
  },
  EXIT: {
    label: "Exit Executor",
    hint: "Manages exits, profit taking and loss protection",
  },
}

/* ================= HELPERS ================= */

function isLocked(role: Role, assignedRoles?: AssignedRoles) {
  if (role === "RISK") return false
  if (role === "ENTRY") return !assignedRoles?.RISK
  if (role === "EXIT") return !assignedRoles?.ENTRY
  return true
}

type StrategyTier = "CORE" | "OPPORTUNITY" | "SPECIAL"

function inferTier(strategyName?: string, risk?: RiskProfile): StrategyTier {
  const s = (strategyName || "").toLowerCase()
  if (s.includes("special") || s.includes("recovery") || s.includes("window")) return "SPECIAL"
  if (s.includes("breakout") || s.includes("momentum") || s.includes("scalp")) return "OPPORTUNITY"

  const r = String(risk || "").toUpperCase()
  if (r.includes("HIGH") || r.includes("AGGRO")) return "SPECIAL"
  if (r.includes("MED")) return "OPPORTUNITY"
  return "CORE"
}

/* ================= TELEMETRY (LOCAL) ================= */

const TELEMETRY_KEY = "strategy_ui_events_v1"
const TELEMETRY_MAX = 500

function track(event: string, payload: Record<string, any>) {
  try {
    const row = { event, ts: Date.now(), ...payload }
    const raw = localStorage.getItem(TELEMETRY_KEY)
    const arr = raw ? (JSON.parse(raw) as any[]) : []
    arr.push(row)
    const trimmed = arr.length > TELEMETRY_MAX ? arr.slice(-TELEMETRY_MAX) : arr
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore
  }
}

/* ================= ANIMATION ================= */

const baseTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.22,
}

function pulseClassForTier(tier: StrategyTier, hot: boolean) {
  if (!hot) return ""
  if (tier === "SPECIAL") return "animate-[pulse_2.8s_ease-in-out_infinite]"
  if (tier === "OPPORTUNITY") return "animate-[pulse_2.2s_ease-in-out_infinite]"
  return ""
}

function badgeForTier(tier: StrategyTier) {
  if (tier === "SPECIAL") return { text: "RECOVERY ACCESS", tone: "SPECIAL" as const }
  if (tier === "OPPORTUNITY") return { text: "OPEN WINDOW", tone: "OPPORTUNITY" as const }
  return { text: "BASELINE", tone: "CORE" as const }
}

function badgeClass(tone: "CORE" | "OPPORTUNITY" | "SPECIAL") {
  if (tone === "SPECIAL") return "bg-white/10 border-white/25 text-white/90 shadow-[0_0_18px_rgba(124,124,255,0.25)]"
  if (tone === "OPPORTUNITY") return "bg-white/5 border-white/15 text-white/70"
  return "bg-white/5 border-white/10 text-white/55"
}

/* ================= SPECIAL WINDOW LOGIC =================
   - Appears when: DD deep + loss streak OR long flat
   - Expires after a short window
   - Cooldown prevents spam
========================================================= */

const SPECIAL_WINDOW_MS = 18_000
const SPECIAL_COOLDOWN_MS = 45_000

export default function StrategySlots({
  traders,
  assignedRoles,
  activeRole,
  onSelectRole,
  onClearRole,
  getRiskProfile,
  signals,
}: Props) {
  // NEW flash when trader assigned
  const prevAssignedRef = useRef<AssignedRoles | undefined>(assignedRoles)
  const [newRolePulse, setNewRolePulse] = useState<Role | null>(null)

  // Ghost stub when cleared
  const [ghost, setGhost] = useState<{ role: Role; label: string } | null>(null)

  // ✅ Special window state
  const [specialWindow, setSpecialWindow] = useState<{ role: Role; expiresAt: number } | null>(null)
  const lastSpecialAtRef = useRef<number>(0)

  // One-time exposed telemetry
  useEffect(() => {
    track("strategy_slots_exposed", { roles: ROLE_ORDER })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // detect assignment changes
  useEffect(() => {
    const prev = prevAssignedRef.current
    const next = assignedRoles
    prevAssignedRef.current = assignedRoles

    for (const role of ROLE_ORDER) {
      const prevId = prev?.[role]
      const nextId = next?.[role]

      if (!prevId && nextId) {
        setNewRolePulse(role)
        window.setTimeout(() => setNewRolePulse(r => (r === role ? null : r)), 1200)
      }

      if (prevId && !nextId) {
        const prevTrader = traders.find(t => t.id === prevId)
        setGhost({ role, label: prevTrader?.strategy || "WINDOW CLOSED" })
        window.setTimeout(() => setGhost(g => (g?.role === role ? null : g)), 2000)
      }
    }
  }, [assignedRoles, traders])

  // ✅ Decide when to open a SPECIAL window (psych triggers)
  const psych = signals || { drawdownPct: 0, lossStreak: 0, equityFlatMs: 0 }

  useEffect(() => {
    const now = Date.now()

    // Don’t open if already open
    if (specialWindow && now < specialWindow.expiresAt) return

    // Cooldown
    if (now - (lastSpecialAtRef.current || 0) < SPECIAL_COOLDOWN_MS) return

    // choose target role: ENTRY first (push action), else EXIT if ENTRY already assigned
    const entryLocked = isLocked("ENTRY", assignedRoles)
    const exitLocked = isLocked("EXIT", assignedRoles)
    const entryHas = !!assignedRoles?.ENTRY
    const exitHas = !!assignedRoles?.EXIT

    // Triggers (2-of style)
    const deepDD = psych.drawdownPct <= -8
    const lossStreak = psych.lossStreak >= 2
    const flatLong = psych.equityFlatMs >= 22_000

    const shouldOpen =
      (deepDD && lossStreak) ||
      (deepDD && flatLong) ||
      (lossStreak && flatLong)

    if (!shouldOpen) return

    // pick role to spotlight
    let role: Role | null = null
    if (!entryLocked && !entryHas) role = "ENTRY"
    else if (!exitLocked && !exitHas) role = "EXIT"
    else if (!isLocked("RISK", assignedRoles)) role = "RISK"

    if (!role) return

    // open window
    const expiresAt = now + SPECIAL_WINDOW_MS
    setSpecialWindow({ role, expiresAt })
    lastSpecialAtRef.current = now
    setNewRolePulse(role) // use same “NEW” flash theater
    window.setTimeout(() => setNewRolePulse(r => (r === role ? null : r)), 1200)

    track("special_window_opened", {
      role,
      drawdownPct: psych.drawdownPct,
      lossStreak: psych.lossStreak,
      equityFlatMs: psych.equityFlatMs,
      windowMs: SPECIAL_WINDOW_MS,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psych.drawdownPct, psych.lossStreak, psych.equityFlatMs, assignedRoles])

  // expire window
  useEffect(() => {
    if (!specialWindow) return
    const t = window.setInterval(() => {
      const now = Date.now()
      if (specialWindow && now >= specialWindow.expiresAt) {
        track("special_window_expired", {
          role: specialWindow.role,
          drawdownPct: psych.drawdownPct,
          lossStreak: psych.lossStreak,
          equityFlatMs: psych.equityFlatMs,
        })
        setSpecialWindow(null)
      }
    }, 250)
    return () => window.clearInterval(t)
  }, [specialWindow, psych.drawdownPct, psych.lossStreak, psych.equityFlatMs])

  // helper: special spotlight on a role (even if empty)
  const roleSpotlightTier = (role: Role, locked: boolean, traderExists: boolean): StrategyTier | null => {
    if (locked) return null
    if (!specialWindow) return null
    if (Date.now() >= specialWindow.expiresAt) return null
    if (specialWindow.role !== role) return null
    if (traderExists) return null // if already assigned, no need to spotlight
    return "SPECIAL"
  }

  return (
    <section className="space-y-4">
      {/* HEADER + banner when special window open */}
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-widest opacity-60">
          STRATEGY CORE — ASSIGN EXECUTION ROLES
        </div>

        <AnimatePresence>
          {specialWindow && Date.now() < specialWindow.expiresAt && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={baseTransition}
              className="text-[10px] tracking-widest uppercase border border-white/20 bg-white/5 px-3 py-1 rounded-full"
            >
              recovery window detected
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SLOTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLE_ORDER.map(role => {
          const traderId = assignedRoles?.[role]
          const trader = traders.find(t => t.id === traderId)
          const active = activeRole === role
          const locked = isLocked(role, assignedRoles)

          const risk = trader ? getRiskProfile(trader) : null

          // Normal tier (if a trader is assigned)
          const normalTier: StrategyTier = trader ? inferTier(trader.strategy, risk || undefined) : "CORE"

          // Spotlight tier (SPECIAL window) if empty slot and chosen role
          const spotlightTier = roleSpotlightTier(role, locked, !!trader)
          const tier: StrategyTier = spotlightTier || normalTier

          const hot =
            !!active ||
            (!!trader && tier === "SPECIAL") ||
            (!!spotlightTier && tier === "SPECIAL")

          const isNew = newRolePulse === role && (!!trader || !!spotlightTier)
          const badge = !locked ? badgeForTier(tier) : null

          const shell =
            locked
              ? "border-white/5 opacity-40 cursor-not-allowed"
              : active
              ? "border-green-400 shadow-[0_0_25px_rgba(34,197,94,0.45)]"
              : trader || spotlightTier
              ? tier === "SPECIAL"
                ? "border-white/25 shadow-[0_0_30px_rgba(124,124,255,0.20)]"
                : tier === "OPPORTUNITY"
                ? "border-white/20 shadow-[0_0_22px_rgba(255,255,255,0.06)]"
                : "border-green-700/60"
              : "border-white/10 hover:border-white/30"

          return (
            <motion.div
              key={role}
              onClick={() => {
                if (locked) return
                track("role_slot_clicked", {
                  role,
                  hasTrader: !!trader,
                  tier,
                  drawdownPct: psych.drawdownPct,
                  lossStreak: psych.lossStreak,
                  equityFlatMs: psych.equityFlatMs,
                })
                onSelectRole(role)
              }}
              onMouseEnter={() => {
                if (locked) return
                track("role_slot_hovered", {
                  role,
                  hasTrader: !!trader,
                  tier,
                  drawdownPct: psych.drawdownPct,
                  lossStreak: psych.lossStreak,
                  equityFlatMs: psych.equityFlatMs,
                })
              }}
              initial={false}
              animate={{ scale: active ? 1.01 : 1, y: active ? -2 : 0 }}
              transition={baseTransition}
              className={`
                relative rounded-xl border p-4 bg-black/60 backdrop-blur
                transition-all cursor-pointer overflow-hidden
                ${shell}
                ${pulseClassForTier(tier, hot)}
              `}
            >
              {/* NEW flash overlay */}
              <AnimatePresence>
                {isNew && (
                  <motion.div
                    key="newflash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none absolute inset-0"
                  >
                    <div
                      className={`
                        absolute inset-0
                        ${
                          tier === "SPECIAL"
                            ? "shadow-[inset_0_0_0_1px_rgba(124,124,255,0.45)]"
                            : tier === "OPPORTUNITY"
                            ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
                            : "shadow-[inset_0_0_0_1px_rgba(34,197,94,0.25)]"
                        }
                      `}
                    />
                    <motion.div
                      initial={{ opacity: 0.0 }}
                      animate={{ opacity: [0, 0.75, 0.15] }}
                      transition={{ duration: 0.35, times: [0, 0.25, 1] }}
                      className={`
                        absolute inset-0
                        ${
                          tier === "SPECIAL"
                            ? "bg-white/5"
                            : tier === "OPPORTUNITY"
                            ? "bg-white/3"
                            : "bg-green-500/5"
                        }
                      `}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Badge */}
              {badge && !locked && (trader || spotlightTier) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...baseTransition, delay: tier === "SPECIAL" ? 0.12 : 0.06 }}
                  className="absolute top-3 right-3"
                >
                  <div
                    className={`
                      text-[9px] tracking-widest uppercase
                      px-2 py-1 rounded-full border
                      ${badgeClass(badge.tone)}
                    `}
                  >
                    {badge.text}
                  </div>
                </motion.div>
              )}

              {/* HEADER */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-semibold">
                    {ROLE_META[role].label}
                  </div>
                  <div className="text-[10px] opacity-60">
                    {ROLE_META[role].hint}
                  </div>
                </div>

                {trader && !locked && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      track("role_slot_cleared", {
                        role,
                        traderId: trader.id,
                        tier,
                        strategy: trader.strategy,
                        drawdownPct: psych.drawdownPct,
                        lossStreak: psych.lossStreak,
                        equityFlatMs: psych.equityFlatMs,
                      })
                      onClearRole(role)
                    }}
                    className="text-[10px] text-red-400 opacity-70 hover:opacity-100"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* BODY */}
              {locked && (
                <div className="text-xs opacity-50 h-14 flex items-center">
                  Complete previous role to unlock
                </div>
              )}

              {!locked && !trader && !spotlightTier && (
                <div className="text-xs opacity-50 h-14 flex items-center">
                  {active ? "Awaiting operator selection…" : "No operator assigned"}
                </div>
              )}

              {/* SPECIAL window body (empty slot) */}
              {!locked && !trader && spotlightTier && (
                <div className="space-y-2">
                  <div className="text-xs text-white/85">
                    Recovery window detected.
                  </div>
                  <div className="text-[10px] opacity-70">
                    High pressure context: DD {psych.drawdownPct}% · streak {psych.lossStreak} · flat {(psych.equityFlatMs / 1000).toFixed(0)}s
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/15 bg-white/8 text-white/80">
                      SPECIAL
                    </span>
                    <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/55">
                      LAST CHANCE
                    </span>
                  </div>
                </div>
              )}

              {trader && (
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{trader.name}</div>
                  <div className={`text-[10px] opacity-70 ${tier === "SPECIAL" ? "text-white/90" : tier === "OPPORTUNITY" ? "text-white/80" : "text-white/70"}`}>
                    {trader.strategy}
                  </div>
                  <div className="flex gap-2 flex-wrap pt-1">
                    <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/55">
                      {tier}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/55">
                      {String(risk)}
                    </span>
                    {tier === "SPECIAL" && (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/15 bg-white/8 text-white/75">
                        LAST CHANCE
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Ghost stub on clear */}
              <AnimatePresence>
                {ghost?.role === role && (
                  <motion.div
                    key="ghost"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.65, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.24 }}
                    className="absolute left-4 right-4 bottom-3"
                  >
                    <div className="text-[10px] tracking-widest uppercase opacity-70">
                      WINDOW CLOSED
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Locked scan */}
              {locked && (
                <motion.div
                  aria-hidden
                  initial={{ x: "-120%" }}
                  animate={{ x: "120%" }}
                  transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 6.0 }}
                  className="pointer-events-none absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
