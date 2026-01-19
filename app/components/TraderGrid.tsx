"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { Tier } from "@/app/types/account"
import type {
  Trader,
  RiskProfile,
  AssignedRoles,
  Role,
  TraderTrait,
} from "@/app/hooks/useTraders"

/* ================= PROPS ================= */

type Props = {
  tier: Tier
  traders: Trader[]
  assignedRoles?: AssignedRoles
  activeRole: Role | null
  onAssignRole: (role: Role, traderId: number) => void
  getRiskProfile: (trader: Trader) => RiskProfile
}

/* ================= CONFIG ================= */

const UPGRADE_ROUTE = "/onboarding"

/* ================= UI MAP ================= */

const TRAIT_LABEL: Record<TraderTrait, string> = {
  LOW_DRAWDOWN: "Low drawdown",
  HIGH_LOT_ENTRY: "High lot entries",
  CONSISTENT: "Highly consistent",
  AGGRESSIVE: "Aggressive execution",
  TIGHT_STOPS: "Tight stop losses",
  LOW_WINRATE_HIGH_RR: "Low WR · High RR",
}

/* ================= MICRO EVENTS + SHADOW POOL ================= */

type ShadowUnlockAt = "HELLION" | "TORION"
type RankBadge = "RECOMMENDED" | "RISKY" | "BLOCKED"

type TraderLite = {
  id: number
  name: string
  strategy?: string
  winRate?: number
  traits?: TraderTrait[]
  verified?: boolean
  locked?: boolean
  unlockAt?: ShadowUnlockAt
  __shadow?: boolean
}

const MICRO_EVENTS = [
  "last action: reduced risk 12m ago",
  "latency spike detected",
  "position closed +0.8R",
  "spread widened, route adjusted",
  "risk cap hit, size reduced",
  "entry queued — waiting confirmation",
  "stop updated — tighter by 0.2R",
  "execution rerouted — faster path",
]

function seededPick(seed: string, n: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % n
}

function eventForTrader(traderId: number, tick: number) {
  const idx =
    (seededPick(String(traderId), MICRO_EVENTS.length) + tick) %
    MICRO_EVENTS.length
  return MICRO_EVENTS[idx]
}

function makeShadowCandidates(): TraderLite[] {
  return [
    { id: 901, name: "TRADER SIGMA", locked: true, unlockAt: "HELLION", __shadow: true },
    { id: 902, name: "TRADER NOVA", locked: true, unlockAt: "HELLION", __shadow: true },
    { id: 903, name: "TRADER KAPPA", locked: true, unlockAt: "HELLION", __shadow: true },
    { id: 904, name: "TRADER VECTOR", locked: true, unlockAt: "TORION", __shadow: true },
    { id: 905, name: "TRADER ORBIT", locked: true, unlockAt: "TORION", __shadow: true },
    { id: 906, name: "TRADER DELTA", locked: true, unlockAt: "TORION", __shadow: true },
  ]
}

function canUnlock(tier: Tier, unlockAt?: ShadowUnlockAt) {
  if (!unlockAt) return true
  const t = String(tier).toUpperCase()
  if (unlockAt === "HELLION") return t.includes("HELLION") || t.includes("TORION")
  return t.includes("TORION")
}

/* ================= DECISION ENGINE (NO BACKEND) ================= */

function scoreForRole(role: Role, trader: TraderLite) {
  const base = seededPick(`${role}:${trader.id}`, 100)
  const win = Math.round((trader.winRate ?? 0.5) * 100)
  return Math.floor(base * 0.6 + win * 0.4)
}

function badgeFromScore(s: number): RankBadge {
  if (s >= 72) return "RECOMMENDED"
  if (s >= 45) return "RISKY"
  return "BLOCKED"
}

function badgeStyles(b: RankBadge) {
  switch (b) {
    case "RECOMMENDED":
      return "border-green-400/40 text-green-300 bg-green-400/10"
    case "RISKY":
      return "border-yellow-400/40 text-yellow-200 bg-yellow-400/10"
    default:
      return "border-red-400/40 text-red-300 bg-red-400/10"
  }
}

function roleLabel(r: Role) {
  if (String(r) === "RISK") return "RISK"
  if (String(r) === "ENTRY") return "ENTRY"
  if (String(r) === "EXIT") return "EXIT"
  return String(r)
}

function requiredRoleOrderMissing(assignedRoles?: AssignedRoles) {
  const r = assignedRoles ?? {}
  if (!r.RISK) return "RISK"
  if (!r.ENTRY) return "ENTRY"
  if (!r.EXIT) return "EXIT"
  return null
}

function upgradeValueLine(unlockAt?: ShadowUnlockAt) {
  if (unlockAt === "HELLION") return "Unlock 3 shadow candidates + dynamic routing"
  if (unlockAt === "TORION") return "Unlock institutional pool + funded orchestration"
  return "Unlock expanded execution pool"
}

/* ================= ICONS (INLINE SVG) ================= */

function IconBolt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
      <path
        fill="currentColor"
        d="M13 2L3 14h7l-1 8 10-12h-7z"
      />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
      <path
        fill="currentColor"
        d="M9.0 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
      />
    </svg>
  )
}

/* ================= COMPONENT ================= */

export default function TraderGrid({
  tier,
  traders,
  assignedRoles,
  activeRole,
  onAssignRole,
  getRiskProfile,
}: Props) {
  const router = useRouter()
  const safeRoles = assignedRoles ?? {}

  // micro-events tick
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 2600)
    return () => clearInterval(i)
  }, [])

  // verified + shadow pool
  const candidates: TraderLite[] = useMemo(() => {
    const verified: TraderLite[] = traders.map(t => ({
      id: t.id,
      name: t.name,
      strategy: t.strategy,
      winRate: t.winRate,
      traits: t.traits ?? [],
      verified: true,
      locked: false,
      __shadow: false,
    }))
    return [...verified, ...makeShadowCandidates()]
  }, [traders])

  // Decision bar status
  const missing = requiredRoleOrderMissing(assignedRoles)

  // Rank + sort based on activeRole (only for real traders)
  const ranked = useMemo(() => {
    if (!activeRole) return candidates

    const r = [...candidates]
    r.sort((a, b) => {
      const aShadow = !!a.__shadow
      const bShadow = !!b.__shadow

      if (aShadow !== bShadow) return aShadow ? 1 : -1
      if (aShadow && bShadow) return a.id - b.id

      return scoreForRole(activeRole, b) - scoreForRole(activeRole, a)
    })

    return r
  }, [candidates, activeRole])

  const roleSelectedHint = activeRole
    ? `Assigning: ${roleLabel(activeRole)}`
    : "Select a role to assign"

  const nextHint = !activeRole
    ? `Next: ${missing ?? "RISK"}`
    : `Pick a trader for ${roleLabel(activeRole)} (top options highlighted)`

  /* ================= TOAST + FLASH + CTA ================= */

  type ToastState =
    | null
    | { kind: "info"; title: string; sub?: string }
    | { kind: "upgrade"; title: string; sub?: string; unlockAt?: ShadowUnlockAt }

  const [toast, setToast] = useState<ToastState>(null)
  const [flashId, setFlashId] = useState<number | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.kind === "upgrade" ? 5200 : 1800)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (flashId == null) return
    const t = setTimeout(() => setFlashId(null), 700)
    return () => clearTimeout(t)
  }, [flashId])

  return (
    <section className="space-y-4">
      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px]">
          <div className="relative">
            {/* pulse ring (only for upgrade toast) */}
            {toast.kind === "upgrade" && (
              <div className="pointer-events-none absolute -inset-6">
                <div className="absolute inset-0 rounded-[28px] bg-purple-500/10 blur-2xl" />
                <div className="absolute inset-0 rounded-[28px] border border-purple-400/10 animate-pulse" />
              </div>
            )}

            <div className="relative rounded-2xl border border-white/10 bg-black/85 px-4 py-3 backdrop-blur transition-all duration-200 animate-[toastIn_.18s_ease-out]">
              <div className="flex items-start gap-3">
                {/* icon */}
                <div
                  className={[
                    "mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border",
                    toast.kind === "upgrade"
                      ? "border-purple-400/25 bg-purple-500/10 text-purple-200"
                      : "border-green-400/20 bg-green-400/10 text-green-200",
                  ].join(" ")}
                >
                  {toast.kind === "upgrade" ? <IconBolt /> : <IconCheck />}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/85">
                    {toast.title}
                  </div>
                  {toast.sub && (
                    <div className="text-xs text-white/55 mt-1">{toast.sub}</div>
                  )}

                  {/* chip */}
                  {toast.kind === "upgrade" && (
                    <div className="mt-2 inline-flex items-center rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-1 text-[10px] tracking-widest text-purple-200">
                      UNLOCK {toast.unlockAt ?? ""}
                    </div>
                  )}

                  {/* CTA */}
                  {toast.kind === "upgrade" && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(`${UPGRADE_ROUTE}?target=${toast.unlockAt ?? ""}`)
                        }
                        className="flex-1 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-[11px] font-semibold tracking-widest text-purple-200 hover:bg-purple-500/20 transition-all"
                      >
                        UPGRADE NOW →
                      </button>
                      <button
                        onClick={() => setToast(null)}
                        className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] tracking-widest text-white/60 hover:bg-white/5 transition-all"
                      >
                        NOT NOW
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* tiny helper (only for upgrade toast) */}
            {toast.kind === "upgrade" && (
              <div className="mt-2 text-[10px] text-white/35">
                Tip: upgrading increases pool size & improves routing stability.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DECISION BAR */}
      <div className="rounded-xl border border-white/10 bg-black/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] tracking-widest text-white/40">
              TRADER ASSIGNMENT
            </div>
            <div className="mt-1 text-sm font-semibold text-white/80">
              {roleSelectedHint}
              <span className="text-white/40"> ▸ </span>
              <span className="text-white/60">{nextHint}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {(["RISK", "ENTRY", "EXIT"] as const).map(r => {
              const assignedId = (safeRoles as any)[r] as number | undefined
              const ok = !!assignedId
              return (
                <div
                  key={r}
                  className={[
                    "rounded-lg border px-3 py-2 text-[10px] tracking-widest",
                    ok
                      ? "border-green-400/30 bg-green-400/10 text-green-300"
                      : "border-white/10 bg-black/40 text-white/50",
                  ].join(" ")}
                >
                  {r}: {ok ? `#${assignedId}` : "—"}
                </div>
              )
            })}
          </div>
        </div>

        {!activeRole && (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/55">
            <span className="text-white/75 font-semibold">Do this now:</span>{" "}
            Select a role (RISK / ENTRY / EXIT) in the slots panel, then come back and pick a
            trader.
          </div>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ranked.map(trader => {
          const isShadow = !!trader.__shadow
          const unlockOk = isShadow ? canUnlock(tier, trader.unlockAt) : true
          const showLocked = isShadow && !unlockOk

          let assignedRole: Role | undefined
          if (!isShadow) {
            for (const [role, id] of Object.entries(safeRoles)) {
              if (id === trader.id) assignedRole = role as Role
            }
          }

          const risk = !isShadow ? getRiskProfile(trader as unknown as Trader) : null

          const traits = !isShadow ? ((trader.traits ?? []) as TraderTrait[]) : []
          const trait =
            !isShadow && traits.length > 0
              ? traits[(trader.id ?? 0) % traits.length]
              : null

          const score = activeRole ? scoreForRole(activeRole, trader) : null
          const badge: RankBadge | null =
            activeRole && !isShadow ? badgeFromScore(score!) : null

          const highlight = !!activeRole && !isShadow && badge === "RECOMMENDED"
          const flash = flashId === trader.id

          return (
            <button
              key={trader.id}
              onClick={() => {
                if (showLocked) {
                  setToast({
                    kind: "upgrade",
                    title: `Upgrade to ${trader.unlockAt} to unlock ${trader.name}`,
                    sub: upgradeValueLine(trader.unlockAt),
                    unlockAt: trader.unlockAt,
                  })
                  return
                }

                if (!activeRole || isShadow) {
                  setToast({
                    kind: "info",
                    title: "Select a role first",
                    sub: "Pick RISK, ENTRY or EXIT to continue",
                  })
                  return
                }

                setFlashId(trader.id)
                setToast({
                  kind: "info",
                  title: `${roleLabel(activeRole)} assigned ✅`,
                  sub: `${trader.name} — ${trader.strategy ?? "live route"}`,
                })
                onAssignRole(activeRole, trader.id)
              }}
              title={
                showLocked
                  ? `Locked — upgrade to ${trader.unlockAt}`
                  : activeRole
                  ? "Click to assign"
                  : "Select a role first"
              }
              className={[
                "relative rounded-xl border p-5 text-left transition-all",
                showLocked
                  ? "border-white/10 bg-black/35 opacity-60 cursor-pointer hover:border-purple-400/30 hover:bg-purple-500/5"
                  : highlight
                  ? "border-green-400/30 bg-black/75 shadow-[0_0_26px_rgba(34,197,94,0.15)]"
                  : "border-white/10 bg-black/60 hover:border-white/20 hover:bg-black/70",
                activeRole && !isShadow && !highlight ? "opacity-70 hover:opacity-100" : "",
                flash
                  ? "border-green-400/60 shadow-[0_0_38px_rgba(34,197,94,0.25)] scale-[1.01]"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{trader.name}</div>
                  <div className="text-xs opacity-60">
                    {isShadow ? "Shadow candidate" : trader.strategy ?? "—"}
                  </div>
                </div>

                <span
                  className={[
                    "mt-1 h-2.5 w-2.5 rounded-full",
                    showLocked ? "bg-white/20" : "bg-green-400 animate-pulse",
                  ].join(" ")}
                />
              </div>

              {badge && (
                <div
                  className={[
                    "mt-3 inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[10px] tracking-widest",
                    badgeStyles(badge),
                  ].join(" ")}
                >
                  {badge}
                  <span className="text-white/40">▸</span>
                  <span className="text-white/60">score {score}</span>
                </div>
              )}

              <div className="mt-3 font-mono text-[12px] text-white/55">
                {showLocked ? (
                  <span className="text-white/40">
                    locked ▸ unlock at{" "}
                    <span className="text-white/60">{trader.unlockAt}</span>
                  </span>
                ) : (
                  <span>▸ {eventForTrader(trader.id, tick)}</span>
                )}
              </div>

              {trait && (
                <div className="mt-3 inline-flex text-[10px] border border-white/10 px-2 py-1 rounded">
                  {TRAIT_LABEL[trait]}
                </div>
              )}

              <div className="mt-3 text-xs opacity-70">
                {isShadow ? (
                  <span className="text-white/45">Unlocking improves capacity & routing</span>
                ) : (
                  <span>
                    Win rate {(((trader.winRate ?? 0) as number) * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {!isShadow && assignedRole && (
                <div className="mt-3 text-[10px] tracking-widest text-white/60">
                  ASSIGNED ▸{" "}
                  <span className="text-white/85">{roleLabel(assignedRole)}</span>
                </div>
              )}

              {!isShadow && risk && (
                <div className="mt-2 text-[10px] text-white/40">
                  risk ▸ {String((risk as any).label ?? (risk as any).name ?? "profile")}
                </div>
              )}

              {showLocked && (
                <div className="absolute top-3 right-3 rounded-md border border-white/15 bg-black/70 px-2 py-1 text-[10px] tracking-widest text-white/60">
                  LOCKED
                </div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
