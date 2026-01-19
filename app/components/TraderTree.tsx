"use client"

import { useEffect, useMemo, useState } from "react"
import type { Tier } from "@/app/types/account"
import type { Trader, AssignedRoles, Role } from "@/app/hooks/useTraders"

type ShadowUnlockAt = "HELLION" | "TORION"

type Mode = "assign" | "intel"

type TraderNode = {
  id: number
  name: string
  subtitle: string
  kind: "REAL" | "SHADOW"
  locked?: boolean
  unlockAt?: ShadowUnlockAt
  winRate?: number
  strategy?: string
}

type Props = {
  tier: Tier
  traders: Trader[]
  assignedRoles?: AssignedRoles
  activeRole: Role | null
  onAssignRole: (role: Role, traderId: number) => void
  onUpgrade?: (target?: ShadowUnlockAt) => void

  /** ✅ NEW */
  mode?: Mode
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

function eventFor(id: number, tick: number) {
  const idx =
    (seededPick(`evt:${id}`, MICRO_EVENTS.length) + tick) % MICRO_EVENTS.length
  return MICRO_EVENTS[idx]
}

function canUnlock(tier: Tier, unlockAt?: ShadowUnlockAt) {
  if (!unlockAt) return true
  const t = String(tier).toUpperCase()
  if (unlockAt === "HELLION") return t.includes("HELLION") || t.includes("TORION")
  return t.includes("TORION")
}

function roleLabel(r: Role | null) {
  if (!r) return "—"
  if (String(r) === "RISK") return "RISK"
  if (String(r) === "ENTRY") return "ENTRY"
  if (String(r) === "EXIT") return "EXIT"
  return String(r)
}

function roleEmoji(r: Role | null) {
  if (!r) return "—"
  if (String(r) === "RISK") return "🛡️"
  if (String(r) === "ENTRY") return "🎯"
  if (String(r) === "EXIT") return "🚪"
  return "🧩"
}

function nodeEmoji(n: TraderNode) {
  if (n.kind === "SHADOW") return "🛸"
  const pick = seededPick(`emo:${n.id}`, 4)
  return pick === 0 ? "✈️" : pick === 1 ? "🚀" : pick === 2 ? "🛰️" : "🛩️"
}

function fmtPct(n?: number) {
  if (typeof n !== "number") return "—"
  return `${Math.round(n)}%`
}

function statBars(seed: string) {
  const stats = ["SPEED", "MOBILITY", "STABILITY", "AIR-TO-AIR", "DEFENSE"] as const
  return stats.map((k, i) => ({
    key: k,
    v: 28 + seededPick(`${seed}:${i}`, 73),
  }))
}

export default function TraderTree({
  tier,
  traders,
  assignedRoles,
  activeRole,
  onAssignRole,
  onUpgrade,
  mode = "assign",
}: Props) {
  const isIntel = mode === "intel"
  const safeRoles = assignedRoles ?? {}

  // micro tick
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 2200)
    return () => clearInterval(i)
  }, [])

  const nodes: TraderNode[] = useMemo(() => {
    const real: TraderNode[] = traders.map(t => ({
      id: t.id,
      name: t.name,
      subtitle: t.strategy ?? "Execution profile",
      kind: "REAL",
      winRate: t.winRate,
      strategy: t.strategy,
    }))

    const shadow: TraderNode[] = [
      { id: 901, name: "SIGMA", subtitle: "Shadow candidate", kind: "SHADOW", locked: true, unlockAt: "HELLION" },
      { id: 902, name: "NOVA", subtitle: "Shadow candidate", kind: "SHADOW", locked: true, unlockAt: "HELLION" },
      { id: 903, name: "KAPPA", subtitle: "Shadow candidate", kind: "SHADOW", locked: true, unlockAt: "HELLION" },
      { id: 904, name: "VECTOR", subtitle: "Institutional pool", kind: "SHADOW", locked: true, unlockAt: "TORION" },
      { id: 905, name: "ORBIT", subtitle: "Institutional pool", kind: "SHADOW", locked: true, unlockAt: "TORION" },
    ]

    return [...real, ...shadow].map(n => {
      if (n.kind === "SHADOW") {
        const ok = canUnlock(tier, n.unlockAt)
        return { ...n, locked: !ok }
      }
      return n
    })
  }, [traders, tier])

  // === layout (anti-amontonado) ===
  // Card width is 190px. Use larger spacing to avoid overlap.
  const CARD_W = 190
  const COL_STEP = 220
  const ROW_STEP = 130
  const START_X = 140
  const START_Y_REAL = 130
  const START_Y_SHADOW = 360

  const layout = useMemo(() => {
    const map = new Map<number, { x: number; y: number }>()
    const real = nodes.filter(n => n.kind === "REAL")
    const shadow = nodes.filter(n => n.kind === "SHADOW")

    const cols = 4 // fixed “clean” grid; tree panel is scrollable horizontally if needed

    real.forEach((n, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = START_X + col * COL_STEP
      const y = START_Y_REAL + row * ROW_STEP
      map.set(n.id, { x, y })
    })

    shadow.forEach((n, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = START_X + col * COL_STEP
      const y = START_Y_SHADOW + row * ROW_STEP
      map.set(n.id, { x, y })
    })

    return { map, realRows: Math.max(1, Math.ceil(real.length / cols)), shadowRows: Math.max(1, Math.ceil(shadow.length / cols)) }
  }, [nodes])

  const panelHeight = useMemo(() => {
    // enough height for rows + padding + shadow section
    const base = 520
    const extraReal = Math.max(0, layout.realRows - 1) * ROW_STEP
    const extraShadow = Math.max(0, layout.shadowRows - 1) * ROW_STEP
    return base + extraReal + extraShadow
  }, [layout.realRows, layout.shadowRows])

  const [selectedId, setSelectedId] = useState<number>(() => nodes[0]?.id ?? 0)
  useEffect(() => {
    if (!nodes.some(n => n.id === selectedId)) setSelectedId(nodes[0]?.id ?? 0)
  }, [nodes, selectedId])

  const selected = nodes.find(n => n.id === selectedId) ?? nodes[0]
  const selectedLocked = !!selected?.locked
  const selectedUnlockAt = selected?.unlockAt

  // edges
  const edges = useMemo(() => {
    const real = nodes.filter(n => n.kind === "REAL")
    const shadow = nodes.filter(n => n.kind === "SHADOW")
    const out: Array<{ a: number; b: number }> = []
    real.forEach(r => {
      shadow.forEach(s => {
        if (seededPick(`${r.id}:${s.id}`, 3) === 1) out.push({ a: r.id, b: s.id })
      })
    })
    return out
  }, [nodes])

  // assigned role for selected
  const assignedForSelected = useMemo(() => {
    if (!selected || selected.kind !== "REAL") return null
    for (const [role, id] of Object.entries(safeRoles)) {
      if (id === selected.id) return role as Role
    }
    return null
  }, [selected, safeRoles])

  // ======= toast =======
  type Toast =
    | null
    | { kind: "info"; title: string; sub?: string }
    | { kind: "upgrade"; title: string; sub?: string; unlockAt?: ShadowUnlockAt }
    | { kind: "ok"; title: string; sub?: string }

  const [toast, setToast] = useState<Toast>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.kind === "upgrade" ? 4200 : 1700)
    return () => clearTimeout(t)
  }, [toast])

  // ======= panel transitions =======
  const [scanKey, setScanKey] = useState(0)
  const [panelPhase, setPanelPhase] = useState<"in" | "out">("in")
  const [prevId, setPrevId] = useState<number>(selectedId)

  useEffect(() => {
    if (selectedId === prevId) return
    setPanelPhase("out")
    const t = setTimeout(() => {
      setPrevId(selectedId)
      setScanKey(k => k + 1)
      setPanelPhase("in")
    }, 130)
    return () => clearTimeout(t)
  }, [selectedId, prevId])

  const bars = useMemo(() => statBars(`stat:${selected?.id ?? 0}`), [selected?.id])
  const [fillOn, setFillOn] = useState(false)
  useEffect(() => {
    setFillOn(false)
    const t = setTimeout(() => setFillOn(true), 60)
    return () => clearTimeout(t)
  }, [scanKey])

  const [feedPulse, setFeedPulse] = useState(false)
  useEffect(() => {
    setFeedPulse(true)
    const t = setTimeout(() => setFeedPulse(false), 220)
    return () => clearTimeout(t)
  }, [scanKey])

  const stepRoleOk = !!activeRole
  const stepTraderOk = !!selected && selected.kind === "REAL"
  const stepReady = stepRoleOk && stepTraderOk

  function upgradeLine(unlockAt?: ShadowUnlockAt) {
    if (unlockAt === "HELLION") return "Unlock shadow pool + more routing options"
    if (unlockAt === "TORION") return "Unlock institutional pool + funded orchestration"
    return "Unlock expanded execution pool"
  }

  function assignedRoleForNode(id: number) {
    for (const [role, traderId] of Object.entries(safeRoles)) {
      if (traderId === id) return role as Role
    }
    return null
  }

  const ctaLabel = useMemo(() => {
    if (isIntel) return "VIEW ONLY"
    if (!selected) return "—"
    if (selected.kind === "SHADOW" && selectedLocked) return `🔒 UPGRADE → ${selectedUnlockAt}`
    if (!activeRole) return "SELECT ROLE FIRST"
    if (selected.kind === "SHADOW") return "POOL NODE (NO ASSIGN)"
    return `✅ ASSIGN ${roleLabel(activeRole)}`
  }, [isIntel, selected, selectedLocked, selectedUnlockAt, activeRole])

  return (
    <section className="space-y-4">
      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] rounded-2xl border border-white/10 bg-black/85 px-4 py-3 backdrop-blur">
          <div className="text-sm font-semibold text-white/85">{toast.title}</div>
          {toast.sub && <div className="text-xs text-white/55 mt-1">{toast.sub}</div>}

          {toast.kind === "upgrade" && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onUpgrade?.(toast.unlockAt)}
                className="flex-1 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-[11px] font-semibold tracking-widest text-purple-200 hover:bg-purple-500/20 transition-all"
              >
                UPGRADE → {toast.unlockAt ?? ""}
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
      )}

      {/* ASSIGN MODE: mission bar */}
      {!isIntel && (
        <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
          <div className="text-[10px] tracking-widest text-white/40">WHAT TO DO</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StepChip
              n="1"
              title="SELECT ROLE"
              ok={stepRoleOk}
              hint={stepRoleOk ? `active: ${roleLabel(activeRole)}` : "pick RISK / ENTRY / EXIT"}
            />
            <StepChip
              n="2"
              title="CHOOSE TRADER"
              ok={stepTraderOk}
              hint={stepTraderOk ? `selected: ${selected?.name}` : "click a green node"}
            />
            <StepChip
              n="3"
              title="ASSIGN"
              ok={stepReady && selected?.kind === "REAL"}
              hint={stepReady ? "press ASSIGN in spec panel" : "complete steps 1–2"}
            />
          </div>

          <div className="mt-3 text-[11px] text-white/55">
            {stepRoleOk ? (
              <span>
                Now click a <span className="text-white/80 font-semibold">VERIFIED</span> node (green) to assign{" "}
                <span className="text-white/80 font-semibold">{roleLabel(activeRole)}</span>.
              </span>
            ) : (
              <span>
                Select a role in your <span className="text-white/80 font-semibold">StrategySlots</span> panel first.
                Then come back here.
              </span>
            )}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6">
        {/* TREE PANEL */}
        <div className="rounded-2xl border border-white/10 bg-black/60 overflow-hidden relative">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-[10px] tracking-widest text-white/50">
              {isIntel ? "TRADER INTEL MAP" : "AIRCRAFT TREE ▸ PICK TRADER"}
            </div>
            <div className="text-[10px] tracking-widest text-white/35">
              {isIntel ? (
                <span className="text-white/60">mode: intel</span>
              ) : (
                <>
                  role: <span className="text-white/70">{roleLabel(activeRole)}</span>
                </>
              )}
            </div>
          </div>

          <div className="relative" style={{ height: panelHeight, overflowX: "auto" }}>
            {/* overlay when no role (assign only) */}
            {!isIntel && !activeRole && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="rounded-2xl border border-white/10 bg-black/85 px-5 py-4 backdrop-blur">
                  <div className="text-[10px] tracking-widest text-white/45">SELECT ROLE FIRST</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    Pick <span className="text-white">RISK / ENTRY / EXIT</span> in Slots
                  </div>
                  <div className="mt-1 text-[11px] text-white/55">Then return here and click ONE green trader.</div>
                </div>
              </div>
            )}

            {/* grid */}
            <div className="pointer-events-none absolute inset-0 opacity-25">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:120px_120px]" />
            </div>

            {/* legend */}
            <div className="absolute z-10 left-4 top-4 flex items-center gap-2 text-[10px] tracking-widest">
              <span className="rounded-full border border-green-400/25 bg-green-500/10 px-3 py-1 text-green-200/80">
                ✅ VERIFIED
              </span>
              <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1 text-purple-200/80">
                🛸 SHADOW
              </span>
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-white/45">
                click card → see specs
              </span>
            </div>

            <svg className="absolute inset-0 w-full h-full">
              {edges.map((e, i) => {
                const a = layout.map.get(e.a)
                const b = layout.map.get(e.b)
                if (!a || !b) return null
                const hot = selectedId === e.a || selectedId === e.b
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={hot ? 2 : 1}
                  />
                )
              })}

              <circle
                cx={(layout.map.get(selectedId)?.x ?? 0) + 0}
                cy={(layout.map.get(selectedId)?.y ?? 0) + 0}
                r={42}
                fill="none"
                stroke="rgba(34,197,94,0.22)"
                strokeWidth="2"
                className="animate-[pulseRing_1.4s_ease-out_infinite]"
              />
            </svg>

            {nodes.map(n => {
              const p = layout.map.get(n.id)
              if (!p) return null

              const isSel = n.id === selectedId
              const isLocked = !!n.locked
              const assignedRole = n.kind === "REAL" ? assignedRoleForNode(n.id) : null

              // highlight real only when assigning and role selected
              const highlightReal = !isIntel && !!activeRole && n.kind === "REAL" && !isLocked

              const cardBorder =
                n.kind === "SHADOW"
                  ? isLocked
                    ? "border-purple-400/20"
                    : "border-purple-400/30"
                  : "border-green-400/20"

              const cardBg =
                n.kind === "SHADOW"
                  ? "bg-purple-500/10"
                  : highlightReal
                    ? "bg-green-500/10"
                    : "bg-black/55"

              const selectedBorder = isSel ? "border-white/35" : cardBorder

              const glow =
                n.kind === "SHADOW"
                  ? "shadow-[0_0_26px_rgba(168,85,247,0.10)]"
                  : highlightReal
                    ? "shadow-[0_0_34px_rgba(34,197,94,0.18)]"
                    : "shadow-[0_0_22px_rgba(34,197,94,0.10)]"

              const statusChip =
                n.kind === "SHADOW"
                  ? isLocked
                    ? { text: "LOCKED", cls: "border-purple-400/25 bg-purple-500/10 text-purple-200/70" }
                    : { text: "POOL", cls: "border-purple-400/25 bg-purple-500/10 text-purple-200/70" }
                  : { text: "ONLINE", cls: "border-green-400/25 bg-green-500/10 text-green-200/70" }

              return (
                <button
                  key={n.id}
                  onClick={() => {
                    // locked shadow => upgrade toast (intel AND assign)
                    if (n.kind === "SHADOW" && n.locked) {
                      setSelectedId(n.id)
                      setToast({
                        kind: "upgrade",
                        title: `🔒 Locked node — upgrade to ${n.unlockAt}`,
                        sub: upgradeLine(n.unlockAt),
                        unlockAt: n.unlockAt,
                      })
                      return
                    }

                    setSelectedId(n.id)

                    // assign-only hint when no role
                    if (!isIntel && !activeRole) {
                      setToast({
                        kind: "info",
                        title: "Step 1: pick a role first",
                        sub: "Use Slots ▸ RISK / ENTRY / EXIT",
                      })
                    }
                  }}
                  className={[
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border text-left px-3 py-3 w-[190px] transition-all",
                    selectedBorder,
                    cardBg,
                    glow,
                    isSel ? "scale-[1.02]" : "",
                    highlightReal && !isSel ? "hover:scale-[1.02]" : "hover:border-white/20",
                  ].join(" ")}
                  style={{ left: p.x, top: p.y }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl leading-none">{nodeEmoji(n)}</div>
                      <div>
                        <div className="text-sm font-extrabold text-white/90 tracking-wide">
                          {n.kind === "SHADOW" ? `TRADER ${n.name}` : n.name}
                        </div>
                        <div className="text-[11px] text-white/45 line-clamp-1">
                          {n.kind === "SHADOW" ? n.subtitle : (n.strategy ?? "Execution profile")}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={["rounded-full border px-2 py-0.5 text-[9px] tracking-widest", statusChip.cls].join(" ")}>
                        {statusChip.text}
                      </span>

                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          n.kind === "SHADOW"
                            ? "bg-purple-300/70"
                            : "bg-green-400 animate-pulse",
                        ].join(" ")}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/60">
                      WIN {fmtPct(n.winRate)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/60">
                      {n.kind === "SHADOW" ? (n.unlockAt ? `UNLOCK ${n.unlockAt}` : "SHADOW") : "VERIFIED"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
                    <span>
                      {assignedRole ? (
                        <span className="text-white/80 font-semibold">
                          {roleEmoji(assignedRole)} {roleLabel(assignedRole)}
                        </span>
                      ) : (
                        <span className="text-white/35">{n.kind === "REAL" ? "no role yet" : ""}</span>
                      )}
                    </span>

                    <span className="text-white/35">{isLocked ? "🔒" : isSel ? "🎯" : ""}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/40 flex items-center justify-between">
            <span>{isIntel ? "tip: click a node → see tech card" : "tip: click a trader card → press ASSIGN"}</span>
            <span className="text-white/25">tick {tick}</span>
          </div>
        </div>

        {/* SPEC PANEL */}
        <div
          className={[
            "rounded-2xl border border-white/10 bg-black/60 overflow-hidden transition-all duration-200 will-change-transform",
            panelPhase === "out" ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0",
          ].join(" ")}
        >
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-[10px] tracking-widest text-white/50">SPEC PANEL</div>
            <div className="mt-1 text-sm font-semibold text-white/85">
              {selected ? `${nodeEmoji(selected)} ${selected.kind === "SHADOW" ? `TRADER ${selected.name}` : selected.name}` : "—"}
            </div>
            <div className="text-[11px] text-white/45">
              {selectedLocked
                ? `🔒 Locked ▸ requires ${selectedUnlockAt}`
                : selected?.kind === "REAL"
                  ? "✅ Verified execution node"
                  : "🛸 Shadow pool node"}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* LIVE FEED */}
            <div
              className={[
                "rounded-xl border border-white/10 bg-black/40 px-3 py-2 transition-all duration-200",
                feedPulse ? "border-green-400/25 shadow-[0_0_28px_rgba(34,197,94,0.10)]" : "",
              ].join(" ")}
            >
              <div className="text-[10px] tracking-widest text-white/35">LIVE FEED</div>
              <div className="mt-1 font-mono text-[12px] text-white/65">▸ {eventFor(selected?.id ?? 0, tick)}</div>
            </div>

            {/* ROLE READ */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] tracking-widest text-white/35">ROLE</div>

              {isIntel ? (
                <div className="mt-2 text-[12px] text-white/65">
                  Intel mode: <span className="text-white/90 font-semibold">view only</span>
                </div>
              ) : (
                <>
                  <div className="mt-2 text-[12px] text-white/70">
                    Active:{" "}
                    <span className="text-white/90 font-semibold">
                      {roleEmoji(activeRole)} {roleLabel(activeRole)}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    {selected?.kind === "REAL"
                      ? assignedForSelected
                        ? `Assigned here: ${roleEmoji(assignedForSelected)} ${roleLabel(assignedForSelected)}`
                        : "Not assigned yet"
                      : "Shadow nodes are not assignable"}
                  </div>
                </>
              )}
            </div>

            {/* STATS */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] tracking-widest text-white/35 mb-2">
                AIRCRAFT STATS <span className="text-white/25">▸ scan</span>
              </div>

              <div key={scanKey} className="space-y-2">
                {bars.map((b, idx) => (
                  <div key={b.key} className="flex items-center gap-3">
                    <div className="w-[92px] text-[10px] tracking-widest text-white/45">{b.key}</div>

                    <div className="flex-1 h-2 rounded bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-white/55 transition-[width] duration-[650ms] ease-out"
                        style={{
                          width: fillOn ? `${b.v}%` : "0%",
                          transitionDelay: `${idx * 80}ms`,
                        }}
                      />
                    </div>

                    <div className="w-9 text-right text-[10px] text-white/45">{b.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 h-[1px] w-full bg-white/10 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-24 bg-white/25 animate-[scan_1.1s_linear_infinite]" />
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                if (isIntel) return
                if (!selected) return

                if (selected.kind === "SHADOW" && selectedLocked) {
                  setToast({
                    kind: "upgrade",
                    title: `🔒 Upgrade to ${selectedUnlockAt} to unlock`,
                    sub: upgradeLine(selectedUnlockAt),
                    unlockAt: selectedUnlockAt,
                  })
                  return
                }

                if (!activeRole) {
                  setToast({
                    kind: "info",
                    title: "Pick a role first",
                    sub: "Slots ▸ RISK / ENTRY / EXIT",
                  })
                  return
                }

                if (selected.kind !== "REAL") {
                  setToast({
                    kind: "info",
                    title: "Pool node",
                    sub: "Pick a VERIFIED trader to assign roles",
                  })
                  return
                }

                onAssignRole(activeRole, selected.id)
                setToast({
                  kind: "ok",
                  title: `${roleEmoji(activeRole)} ${roleLabel(activeRole)} assigned ✅`,
                  sub: `${selected.name} locked in`,
                })
              }}
              disabled={isIntel}
              className={[
                "w-full rounded-xl border px-4 py-3 text-[11px] font-semibold tracking-widest transition-all",
                isIntel
                  ? "border-white/10 bg-black/30 text-white/35 cursor-not-allowed"
                  : selected?.kind === "SHADOW" && selectedLocked
                    ? "border-purple-400/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
                    : !activeRole || selected?.kind !== "REAL"
                      ? "border-white/10 bg-black/30 text-white/35 cursor-not-allowed"
                      : "border-green-400/30 bg-green-500/10 text-green-200 hover:bg-green-500/20",
              ].join(" ")}
            >
              {ctaLabel}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pulseRing {
            0% { opacity: 0.0; transform: scale(0.92); }
            30% { opacity: 1; }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @keyframes scan {
            0% { transform: translateX(-120px); opacity: 0.0; }
            10% { opacity: 1; }
            100% { transform: translateX(520px); opacity: 0.0; }
          }
        `}</style>
      </section>
    </section>
  )
}

function StepChip({
  n,
  title,
  ok,
  hint,
}: {
  n: string
  title: string
  ok: boolean
  hint: string
}) {
  return (
    <div
      className={[
        "rounded-xl border px-3 py-3",
        ok ? "border-green-400/25 bg-green-500/10" : "border-white/10 bg-black/35",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-white/55">STEP {n}</div>
        <div
          className={[
            "text-[10px] tracking-widest",
            ok ? "text-green-200/80" : "text-white/30",
          ].join(" ")}
        >
          {ok ? "DONE" : "PENDING"}
        </div>
      </div>

      <div className="mt-1 text-sm font-semibold text-white/85">{title}</div>
      <div className="mt-1 text-[11px] text-white/55">{hint}</div>
    </div>
  )
}
