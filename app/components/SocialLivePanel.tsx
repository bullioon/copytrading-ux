"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Citizenship =
  | "MX"
  | "CO"
  | "US"
  | "ES"
  | "RU"
  | "BR"
  | "AR"
  | "DE"
  | "FR"
  | "OTHER"

type CommentItem = {
  id: string
  username: string
  stars: number
  text: string
  citizenship: Citizenship
  createdAt: number // ms epoch (client)
  isSim?: boolean
}

const CITIZENSHIPS: { code: Citizenship; label: string }[] = [
  { code: "MX", label: "Mexico" },
  { code: "CO", label: "Colombia" },
  { code: "US", label: "USA" },
  { code: "ES", label: "Spain" },
  { code: "RU", label: "Russia" },
  { code: "BR", label: "Brazil" },
  { code: "AR", label: "Argentina" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "OTHER", label: "Other" },
]

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function nowId(prefix = "c") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function timeAgo(msEpoch: number) {
  const d = Date.now() - msEpoch
  const s = Math.max(1, Math.floor(d / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

function countryLabel(code: Citizenship) {
  return CITIZENSHIPS.find((c) => c.code === code)?.label ?? "Other"
}

/**
 * Avatar bunker/terminal (NO rainbow):
 * - seed por username
 * - gradiente graphite + micro noise
 * - ring suave emerald (premium)
 * - sin banderas aquí (para no duplicar)
 */
function SeedAvatar({ seed }: { seed: string }) {
  const svg = useMemo(() => {
    const s = (seed || "user").trim().toLowerCase()
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    const n = Math.abs(h) % 1000

    // tonos graphite con tiny variación
    const g1 = 10 + (n % 10) // 10-19
    const g2 = 18 + ((n >> 3) % 12) // 18-29
    const ring = "rgba(34,197,94,0.22)"

    const initials = (seed || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase() ?? "")
      .join("")

    const svgStr = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="rgb(${g1},${g1},${g1})"/>
            <stop offset="100%" stop-color="rgb(${g2},${g2},${g2})"/>
          </linearGradient>
          <filter id="noise" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.12"/>
            </feComponentTransfer>
          </filter>
        </defs>

        <rect x="0" y="0" width="48" height="48" rx="14" fill="url(#bg)"/>
        <rect x="0" y="0" width="48" height="48" rx="14" filter="url(#noise)"/>

        <!-- inner sheen -->
        <path d="M6 10 C 20 6, 28 6, 42 10" stroke="rgba(255,255,255,0.08)" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- ring -->
        <rect x="1.25" y="1.25" width="45.5" height="45.5" rx="13" fill="none" stroke="${ring}" stroke-width="1.2" />

        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          font-family="ui-sans-serif, system-ui" font-size="14" font-weight="800" fill="rgba(255,255,255,0.72)">
          ${initials || "U"}
        </text>
      </svg>
    `
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`
  }, [seed])

  return (
    <img
      src={svg}
      alt="avatar"
      className="h-11 w-11 rounded-[14px] border border-white/10 bg-black/40 shrink-0"
      draggable={false}
    />
  )
}

function CitizenshipPill({ code }: { code: Citizenship }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] tracking-widest text-white/70">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
      {code}
    </span>
  )
}

function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number
  onChange: (n: number) => void
  size?: number
}) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="inline-flex items-center gap-1 pointer-events-auto">
      {stars.map((s) => {
        const active = s <= value
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={[
              "rounded-lg p-1 transition border",
              active
                ? "border-white/15 bg-white/[0.06]"
                : "border-transparent bg-transparent hover:bg-white/[0.05] hover:border-white/10",
            ].join(" ")}
            aria-label={`Set rating ${s}`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              className={active ? "opacity-95" : "opacity-55"}
            >
              <path
                d="M12 2.6l2.8 6.1 6.7.6-5 4.4 1.5 6.6L12 16.9 6 20.3 7.5 13.7 2.5 9.3l6.7-.6L12 2.6z"
                fill={active ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0)"}
                stroke={active ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.40)"}
                strokeWidth="1.5"
              />
            </svg>
          </button>
        )
      })}
      <span className="ml-2 text-[10px] tracking-widest text-white/55">{value}/5</span>
    </div>
  )
}

const SIM_USERS = [
  { u: "niko", c: "RU" as Citizenship },
  { u: "marco_ion", c: "MX" as Citizenship },
  { u: "helio", c: "CO" as Citizenship },
  { u: "torion_ops", c: "US" as Citizenship },
  { u: "bunker_girl", c: "ES" as Citizenship },
]

const SIM_TEXTS = [
  "UI feels like an actual terminal wallet. Clean.",
  "Hellion routing looks insane. MT5 path is clear.",
  "This is the first onboarding that doesn’t feel scammy.",
  "Love the bunker vibe. Feels institutional.",
  "The wallet panel is 🔥 and the tier lock makes sense.",
  "Ok this is actually pretty premium for web.",
]

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * ✅ Dedupe hard:
 * - por id (React keys / server IDs)
 * - por firma (username+text+citizenship+stars) dentro de una ventana corta
 * Esto evita que "se repitan al mismo tiempo" cuando:
 * - haces optimistic post y luego llega el mismo del server con otro id
 * - fetchFeed + sim entran casi juntos
 */
function signature(x: CommentItem) {
  return `${(x.username || "").trim().toLowerCase()}|${(x.text || "").trim().toLowerCase()}|${
    x.citizenship
  }|${clamp(x.stars, 1, 5)}`
}

function mergeDedupe(next: CommentItem[], keep = 3) {
  const byId = new Map<string, CommentItem>()
  const seenSig = new Map<string, number>() // sig -> createdAt (ms)
  const WINDOW_MS = 25_000 // si llega igual dentro de 25s lo tratamos como duplicado "same time"

  // ordena primero para que "más nuevo gana"
  const sorted = [...next].sort((a, b) => b.createdAt - a.createdAt)

  for (const item of sorted) {
    // 1) id dedupe
    if (byId.has(item.id)) continue

    // 2) signature dedupe
    const sig = signature(item)
    const prevAt = seenSig.get(sig)
    if (prevAt != null && Math.abs(prevAt - item.createdAt) <= WINDOW_MS) {
      continue
    }

    byId.set(item.id, item)
    seenSig.set(sig, item.createdAt)
  }

  return Array.from(byId.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, keep)
}

export default function SocialLivePanel() {
  const [items, setItems] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  // form
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [citizenship, setCitizenship] = useState<Citizenship>("MX")
  const [stars, setStars] = useState(5)
  const [text, setText] = useState("")

  // bonus gating
  const [openedIg, setOpenedIg] = useState(false)
  const [openedDiscord, setOpenedDiscord] = useState(false)
  const [confirmIg, setConfirmIg] = useState(false)
  const [confirmDiscord, setConfirmDiscord] = useState(false)
  const bonusUnlocked = confirmIg && confirmDiscord

  // simulation
  const [simOn, setSimOn] = useState(true)
  const simTimer = useRef<number | null>(null)
  const lastSimSig = useRef<string>("") // ✅ evita repetir el mismo texto/usuario back-to-back

  const ratingOfMonth = useMemo(() => {
    const real = items.filter((x) => !x.isSim)
    if (!real.length) return 4.8
    const avg = real.reduce((a, b) => a + clamp(b.stars, 1, 5), 0) / real.length
    return Math.round(avg * 10) / 10
  }, [items])

  const bonusProgress = useMemo(() => {
    const v = (confirmIg ? 0.5 : 0) + (confirmDiscord ? 0.5 : 0)
    return Math.round(v * 100)
  }, [confirmIg, confirmDiscord])

  async function fetchFeed() {
    setLoading(true)
    try {
      const r = await fetch("/api/social/feed?limit=3", { cache: "no-store" })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "Failed to load feed")

      const serverItems: CommentItem[] = (j?.items || []).map((x: any) => ({
        id: String(x.id),
        username: String(x.username || "user"),
        stars: Number(x.stars || 5),
        text: String(x.text || ""),
        citizenship: (x.citizenship || "OTHER") as Citizenship,

        // si el server te manda epoch ms úsalo; si manda seconds, conviértelo
        createdAt:
          typeof x.createdAt === "number"
            ? x.createdAt > 10_000_000_000
              ? x.createdAt
              : x.createdAt * 1000
            : Date.now(),

        isSim: false,
      }))

      setItems((prev) => {
        // conserva sims ya puestos
        const sims = prev.filter((p) => p.isSim)

        // mezcla server + sims + prev-real (por si coincide fetch con optimistic)
        const prevReal = prev.filter((p) => !p.isSim)

        return mergeDedupe([...serverItems, ...prevReal, ...sims], 3)
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
    const t = window.setInterval(fetchFeed, 14000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (!simOn) {
      if (simTimer.current) window.clearTimeout(simTimer.current)
      simTimer.current = null
      return
    }

    const schedule = () => {
      const delay = 8000 + Math.floor(Math.random() * 9000)
      simTimer.current = window.setTimeout(() => {
        // intenta evitar repetir lo mismo "al mismo tiempo"
        let tries = 0
        let newItem: CommentItem | null = null

        while (tries < 10 && !newItem) {
          const who = pick(SIM_USERS)
          const txt = pick(SIM_TEXTS)
          const candidate: CommentItem = {
            id: nowId("sim"),
            username: who.u,
            citizenship: who.c,
            stars: pick([4, 5, 5, 5]),
            text: txt,
            createdAt: Date.now(),
            isSim: true,
          }

          const sig = signature(candidate)
          if (sig !== lastSimSig.current) {
            newItem = candidate
            lastSimSig.current = sig
            break
          }

          tries++
        }

        if (newItem) {
          setItems((prev) => mergeDedupe([newItem!, ...prev], 3))
        }

        schedule()
      }, delay)
    }

    schedule()
    return () => {
      if (simTimer.current) window.clearTimeout(simTimer.current)
      simTimer.current = null
    }
  }, [simOn])

  async function post() {
    const cleanUser = username.trim()
    const cleanEmail = email.trim()
    const cleanText = text.trim()
    const safeStars = clamp(stars, 1, 5)

    if (cleanUser.length < 2) return alert("Username too short")
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return alert("Enter a valid email")
    if (cleanText.length < 2) return alert("Comment too short")
    if (!bonusUnlocked) return alert("Unlock the $80 bonus: follow IG + Discord first.")

    setPosting(true)
    try {
      // ✅ optimistic item (para que se sienta instantáneo)
      const optimisticId = nowId("real")
      const optimistic: CommentItem = {
        id: optimisticId,
        username: cleanUser,
        citizenship,
        stars: safeStars,
        text: cleanText,
        createdAt: Date.now(),
        isSim: false,
      }
      setItems((prev) => mergeDedupe([optimistic, ...prev], 3))

      const r = await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUser,
          email: cleanEmail,
          text: cleanText,
          stars: safeStars,
          citizenship,
          bonusIntent: "bonus80",
          followed: { instagram: true, discord: true },
          // ✅ si tu API lo soporta, manda clientId para dedupe server-side también
          clientId: optimisticId,
        }),
      })

      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || "Failed to post")

      // ✅ reemplaza optimistic por el server id si viene
      const serverId = String(j?.id || optimisticId)
      const serverCreatedAt =
        typeof j?.createdAt === "number"
          ? j.createdAt > 10_000_000_000
            ? j.createdAt
            : j.createdAt * 1000
          : Date.now()

      const confirmed: CommentItem = {
        id: serverId,
        username: cleanUser,
        citizenship,
        stars: safeStars,
        text: cleanText,
        createdAt: serverCreatedAt,
        isSim: false,
      }

      setItems((prev) => {
        // quita optimisticId y mete confirmed
        const withoutOptimistic = prev.filter((x) => x.id !== optimisticId)
        return mergeDedupe([confirmed, ...withoutOptimistic], 3)
      })

      setText("")
      fetchFeed()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Post failed")
      // si falla, podrías quitar optimistic (opcional)
      // setItems((prev) => prev.filter((x) => x.id !== optimisticId))
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className="rounded-[32px] border border-white/10 bg-black/55 p-6 md:p-7"
      style={{
        boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 160px rgba(0,0,0,0.55)",
      }}
    >
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.26em] text-white/45">SOCIAL LIVE</div>
          <div className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white/90">
            Live comments · <span className="text-white/70">community pulse</span>
          </div>
          <div className="mt-2 text-[12px] tracking-widest text-white/60">
            Showing <span className="text-white/85 font-semibold">3</span> most recent.
            <span className="ml-2 text-white/40">Auto-refresh</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/70">
            Rating of the month
            <span className="ml-2 text-white/90 font-semibold">{ratingOfMonth.toFixed(1)}</span>
          </div>

          <button
            type="button"
            onClick={() => setSimOn((v) => !v)}
            className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/80 hover:bg-white/[0.06] transition"
            title="Simulated comments (for vibe). Real comments still work."
          >
            live sim: <span className="font-semibold">{simOn ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* BONUS AD banner (más visual) */}
      <div className="mt-6 relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-black/55">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-300/[0.16] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-300/[0.10] via-transparent to-transparent" />

        <div className="p-5 md:p-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.10] px-3 py-1 text-[10px] tracking-[0.26em] text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                GET $80 USDC BONUS
              </div>

              <div className="mt-3 text-[18px] md:text-[20px] font-semibold tracking-tight text-white/90">
                Follow us on Instagram + Discord to unlock.
              </div>
              <div className="mt-2 text-[12px] tracking-widest text-white/65">
                Unlock bonus → then post your review. Email gets stored server-side.
              </div>

              {/* progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] tracking-widest text-white/55">
                  <span>Unlock progress</span>
                  <span className={bonusUnlocked ? "text-emerald-200" : ""}>{bonusProgress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  <div className="h-full bg-emerald-300/60" style={{ width: `${bonusProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="https://www.instagram.com/bullions_project/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpenedIg(true)}
                className="rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-[12px] tracking-widest text-white/85 hover:bg-white/[0.06] hover:border-white/25 transition"
              >
                OPEN INSTAGRAM
              </a>
              <a
                href="https://discord.gg/2Nsf5zk4ZS"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpenedDiscord(true)}
                className="rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-[12px] tracking-widest text-white/85 hover:bg-white/[0.06] hover:border-white/25 transition"
              >
                OPEN DISCORD
              </a>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[11px] tracking-widest text-white/80">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirmIg}
                  onChange={(e) => setConfirmIg(e.target.checked)}
                  disabled={!openedIg}
                />
                Followed Instagram
              </span>
              <span className="text-white/40">{openedIg ? "ready" : "open first"}</span>
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[11px] tracking-widest text-white/80">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirmDiscord}
                  onChange={(e) => setConfirmDiscord(e.target.checked)}
                  disabled={!openedDiscord}
                />
                Joined Discord
              </span>
              <span className="text-white/40">{openedDiscord ? "ready" : "open first"}</span>
            </label>
          </div>

          <div className="mt-3 text-[10px] tracking-widest text-white/45">
            Bonus is locked until both are confirmed. (Server verification can be added later.)
          </div>
        </div>
      </div>

      {/* feed */}
      <div className="mt-6 grid gap-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-3xl border border-white/10 bg-black/55 p-4 flex items-start gap-3">
            <SeedAvatar seed={c.username} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[12px] tracking-widest text-white/85 font-semibold truncate">
                      @{c.username}
                      {c.isSim ? (
                        <span className="ml-2 text-[10px] text-white/45 tracking-widest">(live)</span>
                      ) : null}
                    </div>
                    <CitizenshipPill code={c.citizenship} />
                  </div>

                  <div className="mt-1 text-[10px] tracking-widest text-white/45">
                    {timeAgo(c.createdAt)} · {countryLabel(c.citizenship)}
                  </div>
                </div>

                <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/75">
                  ★ {clamp(c.stars, 1, 5)}
                </div>
              </div>

              <div className="mt-3 text-[13px] text-white/75 leading-relaxed">{c.text}</div>
            </div>
          </div>
        ))}

        <div className="text-[10px] tracking-widest text-white/40">
          {loading ? "Updating…" : "Live feed ready."}
        </div>
      </div>

      {/* post form */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-black/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-[0.26em] text-white/45">POST A COMMENT</div>
            <div className="mt-1 text-[12px] tracking-widest text-white/70">
              Username is public. Email is required and stored server-side.
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] tracking-widest text-white/70">
            {bonusUnlocked ? (
              <span className="text-emerald-200">BONUS UNLOCKED 🔥</span>
            ) : (
              <span className="text-white/55">BONUS LOCKED</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (public)"
            className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-[12px] tracking-widest text-white/85 placeholder:text-white/30 outline-none focus:border-white/25"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (required)"
            className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-[12px] tracking-widest text-white/85 placeholder:text-white/30 outline-none focus:border-white/25"
          />

          <select
            value={citizenship}
            onChange={(e) => setCitizenship(e.target.value as Citizenship)}
            className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-[12px] tracking-widest text-white/85 outline-none focus:border-white/25"
          >
            {CITIZENSHIPS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <StarRating value={stars} onChange={setStars} />
          <div className="text-[10px] tracking-widest text-white/45">Max 240 chars · no financial advice</div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your comment…"
          maxLength={240}
          className="mt-3 w-full min-h-[92px] rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-[13px] text-white/80 placeholder:text-white/30 outline-none focus:border-white/25"
        />

        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={post}
            disabled={posting}
            className={[
              "rounded-2xl border px-5 py-3 text-[12px] font-semibold tracking-widest transition",
              bonusUnlocked
                ? "border-emerald-300/25 bg-emerald-300/[0.10] text-emerald-100 hover:bg-emerald-300/[0.14]"
                : "border-white/10 bg-white/[0.04] text-white/55 cursor-not-allowed",
            ].join(" ")}
          >
            {posting ? "POSTING…" : "POST COMMENT ▸"}
          </button>

          <div className="text-[10px] tracking-widest text-white/45">
            By posting you accept Terms · Email stored server-side.
          </div>
        </div>
      </div>
    </div>
  )
}