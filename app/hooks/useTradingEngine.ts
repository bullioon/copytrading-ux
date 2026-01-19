"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Trader } from "./useTraders"
import type { EnginePolicy } from "./useEnginePolicy"

/* ================= CONFIG ================= */

const STORAGE_KEY = "sim_engine_v1"
const MTM_TICK_MS = 1200
const OPEN_DECISION_INTERVAL_MS = 9000
const SLIPPAGE_BPS = 6
const FEE_USD = 0.08
const MIN_BALANCE_USD = 0

const DAILY_RISK_PCT = 0.08
const RISK_PCT_PER_TRADE = 0.02

const PRICE_DECIMALS = 4
const UNREAL_DECIMALS = 4

const FLAT_EPS = 0.005
const FLAT_TICKS_TO_NUDGE = 18
const NUDGE_ABS = 0.01

const MARKET_FROZEN_MS = 60_000
const EQUITY_MAX_POINTS = 160

const FORCE_ENTRY_AFTER_MS = 35_000
const FORCE_ENTRY_PROB = 1

const FIRST_TRADE_PROB = 1
const NORMAL_OPEN_PROB = 1

/* ================= HELPERS (tier) ================= */

function maxOpenByBalance(baseBalance: number) {
  if (baseBalance >= 20000) return 3
  if (baseBalance >= 800) return 2
  return 1
}

function riskCapsByBalance(baseBalance: number) {
  if (baseBalance >= 20000) return { min: 20, max: 2000 }
  if (baseBalance >= 800) return { min: 5, max: 250 }
  return { min: 1, max: 35 }
}

/* ================= TYPES ================= */

export type Trade = {
  id: number
  pair: "BTC/USDT" | "ETH/USDT" | "SOL/USDT"
  traderId: number
  traderName: string

  direction: "LONG" | "SHORT"
  entryPrice: number
  exitPrice: number

  riskUsd: number
  size: number
  stopPrice: number
  takeProfitPrice: number

  pnlUsd: number
  unrealizedPnlUsd: number

  openedAt: number
  closedAt: number
  expiresAt: number

  status: "open" | "closed"
  closeReason?: "TP" | "SL" | "EXPIRY" | "POLICY" | "MANUAL"
}

export type MarketPrices = {
  btc: number
  eth: number
  sol: number
}

export type TradingEngineMetrics = {
  balance: number
  pnl: number
  closedTrades: number
  openTrades: number
  pnlRealized: number
  pnlUnrealized: number
  synthPrices: MarketPrices
  regime: MarketRegimeName
  paused: boolean
  seed: number

  equityNow: number
  equityPeak: number
  drawdownPct: number
  lossStreak: number
  equityFlatMs: number

  dailyLossUsd: number
  dailyCapUsd: number
  riskBrakeActive: boolean

  disableRiskBrake: boolean
}

export type TradingEngineActions = {
  setPaused: (v: boolean) => void
  closeTrade: (id: number) => void
  closeAll: () => void
  reset: (opts?: { seed?: number }) => void
}

export type TradingEngineReturn = {
  status: "idle" | "copying"
  trades: Trade[]
  equity: number[]
  metrics: TradingEngineMetrics
  actions: TradingEngineActions
}

type EngineProps = {
  account: { baseBalance: number; active: boolean }
  traders: Trader[]
  market: MarketPrices | null
  policy?: EnginePolicy
  runActive?: boolean
  seed?: number
  disableRiskBrake?: boolean
}

/* ================= UTILS ================= */

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const nowMs = () => Date.now()

const roundN = (x: number, d: number) => {
  const p = 10 ** d
  return Math.round(x * p) / p
}

/** PRNG determinista (mulberry32) */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function applySlippage(px: number, side: "buy" | "sell", bps: number, u: number) {
  const slip = px * (bps / 10_000) * u
  return side === "buy" ? px + slip : px - slip
}

function equitySnapshot(baseBalance: number, trades: Trade[], realizedPnl: number) {
  const unreal = trades.reduce((s, t) => (t.status === "open" ? s + (t.unrealizedPnlUsd || 0) : s), 0)
  const eq = baseBalance + realizedPnl + unreal
  return Math.max(MIN_BALANCE_USD, roundN(eq, 2))
}

/* ================= MARKET REGIMES (SIM) ================= */

type MarketRegimeName = "RANGE" | "UPTREND" | "DOWNTREND" | "VOLATILE"

type RegimeSpec = {
  name: MarketRegimeName
  drift: number
  vol: number
  minMs: number
  maxMs: number
  meanRev: number
}

const REGIMES: RegimeSpec[] = [
  { name: "RANGE", drift: 0.0, vol: 0.0018, minMs: 2 * 60_000, maxMs: 10 * 60_000, meanRev: 0.08 },
  { name: "UPTREND", drift: 0.00022, vol: 0.0016, minMs: 3 * 60_000, maxMs: 14 * 60_000, meanRev: 0.06 },
  { name: "DOWNTREND", drift: -0.00022, vol: 0.0016, minMs: 3 * 60_000, maxMs: 14 * 60_000, meanRev: 0.06 },
  { name: "VOLATILE", drift: 0.0, vol: 0.0032, minMs: 60_000, maxMs: 6 * 60_000, meanRev: 0.04 },
]

function pickRegime(rng: () => number): RegimeSpec {
  const r = rng()
  if (r < 0.42) return REGIMES[0]
  if (r < 0.64) return REGIMES[1]
  if (r < 0.86) return REGIMES[2]
  return REGIMES[3]
}

function stepPrice(px: number, anchor: number, spec: RegimeSpec, rng: () => number, meanRevOverride?: number) {
  const shock = (rng() - 0.5) * 2 // [-1,1]
  const target = px + px * (spec.drift + spec.vol * shock)
  const mr = typeof meanRevOverride === "number" ? meanRevOverride : spec.meanRev
  const blended = target * (1 - mr) + anchor * mr
  return Math.max(0.0001, roundN(blended, PRICE_DECIMALS))
}

function nudgeIfFlat(next: number, prev: number, rng: () => number) {
  if (Math.abs(next - prev) >= FLAT_EPS) return next
  const dir = rng() < 0.5 ? -1 : 1
  return roundN(next + dir * NUDGE_ABS, PRICE_DECIMALS)
}

/* ================= ENGINE ================= */

export function useTradingEngine({
  account,
  traders,
  market,
  policy,
  runActive,
  seed,
  disableRiskBrake,
}: EngineProps): TradingEngineReturn {
  const [trades, setTrades] = useState<Trade[]>([])
  const [status, setStatus] = useState<"idle" | "copying">("idle")
  const [paused, setPaused] = useState(false)

  // ===== DEBUG ENGINE INPUT =====
useEffect(() => {
  console.log(
    "[ENGINE INPUT]",
    "baseBalance =", account?.baseBalance,
    "active =", account?.active,
    "runActive =", runActive
  )
}, [account?.baseBalance, account?.active, runActive])

  // ✅ base balance real del engine = account.baseBalance (capital asignado)
const baseBalanceRef = useRef<number>(Number(account?.baseBalance) || 0)

useEffect(() => {
  baseBalanceRef.current = Number(account?.baseBalance) || 0
  console.log("ENGINE BASE", baseBalanceRef.current)
}, [account?.baseBalance])

  // ✅ override live
  const disableRiskBrakeRef = useRef<boolean>(!!disableRiskBrake)
  useEffect(() => {
    disableRiskBrakeRef.current = !!disableRiskBrake
  }, [disableRiskBrake])

  // ✅ policy allowTrading (pero override lo puede anular)
  const allowTradingRef = useRef<boolean>(policy?.allowTrading ?? true)
  const policyAllowRef = useRef<boolean>(policy?.allowTrading ?? true)
  useEffect(() => {
    policyAllowRef.current = policy?.allowTrading ?? true
    allowTradingRef.current = disableRiskBrakeRef.current ? true : (policy?.allowTrading ?? true)
  }, [policy?.allowTrading, disableRiskBrake])

  // ✅ si activas override, “despierta” el engine si estaba pausado
  useEffect(() => {
    if (disableRiskBrakeRef.current && paused) setPaused(false)
  }, [disableRiskBrake, paused])

  // ✅ EQUITY “always alive”
  const [equitySeries, setEquitySeries] = useState<number[]>(() => [roundN(Number(account?.baseBalance) || 0, 2)])
  useEffect(() => {
    setEquitySeries([roundN(Number(account?.baseBalance) || 0, 2)])
  }, [account?.baseBalance])

  // refs de consistencia
  const tradesRef = useRef<Trade[]>([])
  useEffect(() => {
    tradesRef.current = trades
  }, [trades])

  const realizedPnlRef = useRef<number>(0)
  const dailyLossRef = useRef<number>(0)
  const dayRef = useRef<string>("")

  const seedRef = useRef<number>(Number.isFinite(seed) ? (seed as number) : Date.now())
  const rngRef = useRef<() => number>(mulberry32(seedRef.current))

  const idRef = useRef<number>(1)

  const synthRef = useRef<MarketPrices>({ btc: 0, eth: 0, sol: 0 })
  const anchorRef = useRef<MarketPrices>({ btc: 0, eth: 0, sol: 0 })

  const regimeRef = useRef<RegimeSpec>(REGIMES[0])
  const regimeUntilRef = useRef<number>(0)

  const runActiveRef = useRef<boolean>(runActive ?? true)
  useEffect(() => {
    runActiveRef.current = runActive ?? true
  }, [runActive])

  const riskBrakeRef = useRef<boolean>(false)
  const lastDailyCapRef = useRef<number>(0)

  const lastMarketMsRef = useRef<number>(0)
  const lastAnchorRef = useRef<MarketPrices>({ btc: 0, eth: 0, sol: 0 })

  const flatTicksRef = useRef<{ btc: number; eth: number; sol: number }>({ btc: 0, eth: 0, sol: 0 })
  const lastTradeOpenedMsRef = useRef<number>(0)

  const lastEquityRef = useRef<number>(roundN(Number(account?.baseBalance) || 0, 2))
  const lastEquityMoveMsRef = useRef<number>(nowMs())

  /* ===== LOAD ===== */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)

      const savedTrades = Array.isArray(data.trades) ? (data.trades as Trade[]) : []
      const normalized: Trade[] = savedTrades.map(t => ({
        ...t,
        id: Number((t as any).id) || 0,
        entryPrice: Number((t as any).entryPrice) || 0,
        exitPrice: Number((t as any).exitPrice) || Number((t as any).entryPrice) || 0,
        riskUsd: Number((t as any).riskUsd) || 0,
        size: Number((t as any).size) || 0,
        stopPrice: Number((t as any).stopPrice) || 0,
        takeProfitPrice: Number((t as any).takeProfitPrice) || 0,
        pnlUsd: Number((t as any).pnlUsd) || 0,
        unrealizedPnlUsd: Number((t as any).unrealizedPnlUsd) || 0,
        openedAt: Number((t as any).openedAt) || 0,
        closedAt: Number((t as any).closedAt) || 0,
        expiresAt: Number((t as any).expiresAt) || 0,
        traderId: Number((t as any).traderId) || 0,
        traderName: String((t as any).traderName ?? ""),
        pair: ((t as any).pair as any) ?? "BTC/USDT",
        direction: ((t as any).direction as any) ?? "LONG",
        status: ((t as any).status as any) ?? "closed",
        closeReason: (t as any).closeReason,
      }))

      setTrades(normalized)
      tradesRef.current = normalized

      realizedPnlRef.current = Number(data.realizedPnl) || 0
      dailyLossRef.current = Number(data.dailyLoss) || 0
      dayRef.current = data.day || ""

      if (Number.isFinite(data.seed)) {
        seedRef.current = data.seed
        rngRef.current = mulberry32(seedRef.current)
      }

      const sp = data.synthPrices
      const ap = data.anchorPrices
      if (sp && typeof sp === "object") {
        synthRef.current = {
          btc: Number(sp.btc) || 0,
          eth: Number(sp.eth) || 0,
          sol: Number(sp.sol) || 0,
        }
      }
      if (ap && typeof ap === "object") {
        anchorRef.current = {
          btc: Number(ap.btc) || 0,
          eth: Number(ap.eth) || 0,
          sol: Number(ap.sol) || 0,
        }
        lastAnchorRef.current = { ...anchorRef.current }
      }

      const rg = data.regime
      const until = Number(data.regimeUntilMs) || 0
      if (rg) {
        const found = REGIMES.find(x => x.name === rg)
        if (found) regimeRef.current = found
      }
      regimeUntilRef.current = until

      const maxId = normalized.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0)
      idRef.current = Math.max(1, maxId + 1)

      if (Array.isArray(data.equitySeries) && data.equitySeries.length) {
        const cleaned = (data.equitySeries as any[])
          .map(n => Number(n))
          .filter(n => Number.isFinite(n))
          .slice(-EQUITY_MAX_POINTS)
        if (cleaned.length) {
          setEquitySeries(cleaned)
          const last = cleaned[cleaned.length - 1]
          if (Number.isFinite(last)) {
            lastEquityRef.current = Number(last)
            lastEquityMoveMsRef.current = nowMs()
          }
        }
      } else {
        const snap = equitySnapshot(baseBalanceRef.current, normalized, realizedPnlRef.current)
        setEquitySeries([snap])
        lastEquityRef.current = snap
        lastEquityMoveMsRef.current = nowMs()
      }

      lastTradeOpenedMsRef.current = Number(data.lastTradeOpenedMs) || 0
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ===== SAVE ===== */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        trades,
        realizedPnl: realizedPnlRef.current,
        dailyLoss: dailyLossRef.current,
        day: dayRef.current,
        seed: seedRef.current,
        synthPrices: synthRef.current,
        anchorPrices: anchorRef.current,
        regime: regimeRef.current.name,
        regimeUntilMs: regimeUntilRef.current,
        equitySeries,
        lastTradeOpenedMs: lastTradeOpenedMsRef.current,
      })
    )
  }, [trades, equitySeries])

  /* ===== DAILY RESET ===== */
  useEffect(() => {
    const today = new Date().toDateString()
    if (dayRef.current !== today) {
      dayRef.current = today
      dailyLossRef.current = 0
      riskBrakeRef.current = false
      lastDailyCapRef.current = 0
    }
  }, [])

  /* ===== INIT SYNTH PRICES ===== */
  useEffect(() => {
    if (!market) return
    if (synthRef.current.btc <= 0 || synthRef.current.eth <= 0 || synthRef.current.sol <= 0) {
      synthRef.current = {
        btc: roundN(market.btc, PRICE_DECIMALS),
        eth: roundN(market.eth, PRICE_DECIMALS),
        sol: roundN(market.sol, PRICE_DECIMALS),
      }
      anchorRef.current = { ...synthRef.current }
      lastAnchorRef.current = { ...anchorRef.current }
      lastMarketMsRef.current = nowMs()

      const snap = equitySnapshot(baseBalanceRef.current, tradesRef.current, realizedPnlRef.current)
      setEquitySeries([snap])
      lastEquityRef.current = snap
      lastEquityMoveMsRef.current = nowMs()
    }
  }, [market])

  /* ===== STATUS ===== */
  useEffect(() => {
    const effectiveAllow = disableRiskBrakeRef.current ? true : (policy?.allowTrading ?? true)
    const effectivePaused = disableRiskBrakeRef.current ? false : paused

    const canTrade =
      !!account.active &&
      !!market &&
      traders.length > 0 &&
      (runActive ?? true) &&
      effectiveAllow &&
      !effectivePaused &&
      baseBalanceRef.current > 0 // ✅ si allocation es 0, no trade

    setStatus(canTrade ? "copying" : "idle")
  }, [account.active, market, traders.length, runActive, policy?.allowTrading, paused, disableRiskBrake])

  /* ================= PRICE + MTM LOOP ================= */

  
  useEffect(() => {
    if (!market) return

    const tick = setInterval(() => {
      const now = nowMs()

      const prevAnchor = lastAnchorRef.current
      const newAnchor: MarketPrices = { btc: market.btc, eth: market.eth, sol: market.sol }
      const anchorChanged =
        Math.abs(newAnchor.btc - prevAnchor.btc) > 0.000001 ||
        Math.abs(newAnchor.eth - prevAnchor.eth) > 0.000001 ||
        Math.abs(newAnchor.sol - prevAnchor.sol) > 0.000001

      if (anchorChanged) {
        lastMarketMsRef.current = now
        lastAnchorRef.current = { ...newAnchor }
      }

      anchorRef.current = {
        btc: roundN(newAnchor.btc, PRICE_DECIMALS),
        eth: roundN(newAnchor.eth, PRICE_DECIMALS),
        sol: roundN(newAnchor.sol, PRICE_DECIMALS),
      }

      if (!regimeUntilRef.current || now >= regimeUntilRef.current) {
        const next = pickRegime(rngRef.current)
        regimeRef.current = next
        const ttl = next.minMs + Math.floor(rngRef.current() * (next.maxMs - next.minMs))
        regimeUntilRef.current = now + ttl
      }

      const marketFrozen = now - (lastMarketMsRef.current || 0) > MARKET_FROZEN_MS
      const meanRevOverride = marketFrozen ? 0.0 : undefined

      const spec = regimeRef.current
      const prevSynth = synthRef.current

      const nextBtc0 = stepPrice(prevSynth.btc, anchorRef.current.btc, spec, rngRef.current, meanRevOverride)
      const nextEth0 = stepPrice(prevSynth.eth, anchorRef.current.eth, spec, rngRef.current, meanRevOverride)
      const nextSol0 = stepPrice(prevSynth.sol, anchorRef.current.sol, spec, rngRef.current, meanRevOverride)

      const flat = flatTicksRef.current
      flat.btc = Math.abs(nextBtc0 - prevSynth.btc) < FLAT_EPS ? flat.btc + 1 : 0
      flat.eth = Math.abs(nextEth0 - prevSynth.eth) < FLAT_EPS ? flat.eth + 1 : 0
      flat.sol = Math.abs(nextSol0 - prevSynth.sol) < FLAT_EPS ? flat.sol + 1 : 0

      const nextBtc = flat.btc >= FLAT_TICKS_TO_NUDGE ? nudgeIfFlat(nextBtc0, prevSynth.btc, rngRef.current) : nextBtc0
      const nextEth = flat.eth >= FLAT_TICKS_TO_NUDGE ? nudgeIfFlat(nextEth0, prevSynth.eth, rngRef.current) : nextEth0
      const nextSol = flat.sol >= FLAT_TICKS_TO_NUDGE ? nudgeIfFlat(nextSol0, prevSynth.sol, rngRef.current) : nextSol0

      if (flat.btc >= FLAT_TICKS_TO_NUDGE) flat.btc = 0
      if (flat.eth >= FLAT_TICKS_TO_NUDGE) flat.eth = 0
      if (flat.sol >= FLAT_TICKS_TO_NUDGE) flat.sol = 0

      synthRef.current = { btc: nextBtc, eth: nextEth, sol: nextSol }

      const pxFor = (pair: Trade["pair"]) => {
        if (pair === "BTC/USDT") return synthRef.current.btc
        if (pair === "ETH/USDT") return synthRef.current.eth
        return synthRef.current.sol
      }

      setTrades(prev => {
        const now2 = nowMs()

        const effectiveAllow = disableRiskBrakeRef.current ? true : allowTradingRef.current
        const effectivePaused = disableRiskBrakeRef.current ? false : paused
        const canKeepOpen = effectiveAllow && runActiveRef.current && account.active && !effectivePaused

        let changed = false

        const nextTrades = prev.map(tr => {
          if (tr.status !== "open") return tr

          const px = pxFor(tr.pair)
          const move = tr.direction === "LONG" ? px - tr.entryPrice : tr.entryPrice - px
          const unreal = roundN(move * tr.size, UNREAL_DECIMALS)

          const hitTP = tr.direction === "LONG" ? px >= tr.takeProfitPrice : px <= tr.takeProfitPrice
          const hitSL = tr.direction === "LONG" ? px <= tr.stopPrice : px >= tr.stopPrice
          const expired = now2 >= tr.expiresAt
          const policyClose = !canKeepOpen

          if (hitTP || hitSL || expired || policyClose) {
            changed = true
            const reason: Trade["closeReason"] = hitTP ? "TP" : hitSL ? "SL" : expired ? "EXPIRY" : "POLICY"

            const uSlip = rngRef.current()
            const side = tr.direction === "LONG" ? "sell" : "buy"
            const exitPx = applySlippage(px, side, SLIPPAGE_BPS, uSlip)

            const move2 = tr.direction === "LONG" ? exitPx - tr.entryPrice : tr.entryPrice - exitPx
            let realized = roundN(move2 * tr.size, 2)
            realized = roundN(realized - FEE_USD, 2)

            if (realized < 0) dailyLossRef.current += Math.abs(realized)
            realizedPnlRef.current = roundN(realizedPnlRef.current + realized, 2)

            return {
              ...tr,
              exitPrice: roundN(exitPx, PRICE_DECIMALS),
              pnlUsd: realized,
              unrealizedPnlUsd: 0,
              closedAt: now2,
              status: "closed",
              closeReason: reason,
            } satisfies Trade
          }

          if (unreal !== tr.unrealizedPnlUsd) changed = true
          return { ...tr, unrealizedPnlUsd: unreal, exitPrice: px } satisfies Trade
        })

        tradesRef.current = nextTrades

        const snap = equitySnapshot(baseBalanceRef.current, nextTrades, realizedPnlRef.current)
        lastDailyCapRef.current = snap * DAILY_RISK_PCT

        const prevEq = lastEquityRef.current
        if (Math.abs(snap - prevEq) >= 0.01) {
          lastEquityRef.current = snap
          lastEquityMoveMsRef.current = now2
        }

        setEquitySeries(prevEqSeries => {
          const nextEq = [...prevEqSeries, snap]
          return nextEq.length > EQUITY_MAX_POINTS ? nextEq.slice(-EQUITY_MAX_POINTS) : nextEq
        })

        if (!prev.length) return prev
        return changed ? nextTrades : prev
      })
    }, MTM_TICK_MS)

    return () => clearInterval(tick)
  }, [account.active, paused, market])

/* ================= OPEN NEW TRADES LOOP ================= */

useEffect(() => {
  if (!market) return

  const cadence = policy?.cadenceMultiplier ?? 1
  const safeCadence = Number.isFinite(cadence) ? cadence : 1
  const effectiveInterval =
    safeCadence > 0
      ? Math.max(1200, Math.round(OPEN_DECISION_INTERVAL_MS / safeCadence))
      : OPEN_DECISION_INTERVAL_MS

  console.log("[OPEN INTERVAL]", { effectiveInterval, cadence: policy?.cadenceMultiplier })

  const interval = setInterval(() => {
    // 🔥 HEARTBEAT cada ~10 ticks para no spamear
    // (con interval ~9s, 10 ticks ~90s)
    ;(window as any).__openTick = ((window as any).__openTick ?? 0) + 1
    const tick = (window as any).__openTick as number

    const hb = (code: string, extra?: any) => {
      if (tick % 10 !== 0 && code === "HB") return // solo HB cada 10
      console.log("[OPEN]", code, {
        tick,
        runActive: runActiveRef.current,
        accountActive: account.active,
        allow: disableRiskBrakeRef.current ? true : (policyAllowRef.current ?? true),
        paused,
        traders: traders.length,
        baseBal: baseBalanceRef.current,
        synth: synthRef.current,
        cadence: policy?.cadenceMultiplier,
        ...extra,
      })
    }

    hb("HB")

    if (!runActiveRef.current) return hb("RUN_INACTIVE")
    if (!account.active) return hb("ACCOUNT_INACTIVE")

    const effectiveAllow = disableRiskBrakeRef.current ? true : (policyAllowRef.current ?? true)
    const effectivePaused = disableRiskBrakeRef.current ? false : paused

    if (!effectiveAllow) return hb("POLICY_BLOCK_ALLOWTRADING_FALSE")
    if (effectivePaused) return hb("PAUSED")
    if (traders.length <= 0) return hb("NO_TRADERS")

    if (baseBalanceRef.current <= 0) return hb("BASE_BALANCE_ZERO_OR_NO_ALLOCATION")

    if (synthRef.current.btc <= 0 || synthRef.current.eth <= 0 || synthRef.current.sol <= 0)
      return hb("SYNTH_NOT_READY")

    const current = tradesRef.current
    const eq = equitySnapshot(baseBalanceRef.current, current, realizedPnlRef.current)

    const dailyCapUsd = eq * DAILY_RISK_PCT
    lastDailyCapRef.current = dailyCapUsd

    const hitDailyCap = dailyLossRef.current >= dailyCapUsd
    if (hitDailyCap && !disableRiskBrakeRef.current) {
      riskBrakeRef.current = true
      return hb("RISK_BRAKE_DAILY_CAP", { eq, dailyLoss: dailyLossRef.current, dailyCapUsd })
    }
    riskBrakeRef.current = false

    const maxOpen = maxOpenByBalance(baseBalanceRef.current)
    const openCount = current.filter(t => t.status === "open").length
    if (openCount >= maxOpen) return hb("MAX_OPEN_REACHED", { openCount, maxOpen })

    const now = nowMs()
    const timeSinceOpen = now - (lastTradeOpenedMsRef.current || 0)
    const shouldForce = timeSinceOpen > FORCE_ENTRY_AFTER_MS && openCount === 0

    const openProb = shouldForce ? FORCE_ENTRY_PROB : openCount === 0 ? FIRST_TRADE_PROB : NORMAL_OPEN_PROB
    const roll = rngRef.current()
    if (roll > openProb) return hb("RNG_SKIP", { roll, openProb, shouldForce, timeSinceOpen, openCount })

    // ✅ si llegó aquí, DEBERÍA abrir
    hb("OPENING_ATTEMPT", { openProb, roll })

    // ... tu lógica de pairs / entry / risk / size ...
    // justo antes de setTrades:
    // hb("OPENING_TRADE", { pair: chosen.pair, entry, dir, riskUsd, size })

    // (dejas tu código igual)
  }, effectiveInterval)

  return () => clearInterval(interval)
}, [
  market,
  traders,
  paused,
  account.active,
  policy?.cadenceMultiplier,
  policy?.riskMultiplier,
  disableRiskBrake,
])

  /* ================= ACTIONS ================= */

  const closeTrade = (id: number) => {
    setTrades(prev => {
      const now = nowMs()
      let changed = false

      const pxFor = (pair: Trade["pair"]) => {
        if (pair === "BTC/USDT") return synthRef.current.btc
        if (pair === "ETH/USDT") return synthRef.current.eth
        return synthRef.current.sol
      }

      const next = prev.map(t => {
        if (t.id !== id || t.status !== "open") return t
        changed = true

        const px = pxFor(t.pair)
        const side = t.direction === "LONG" ? "sell" : "buy"
        const exitPx = applySlippage(px, side, SLIPPAGE_BPS, rngRef.current())

        const move = t.direction === "LONG" ? exitPx - t.entryPrice : t.entryPrice - exitPx
        let realized = roundN(move * t.size, 2)
        realized = roundN(realized - FEE_USD, 2)

        if (realized < 0) dailyLossRef.current += Math.abs(realized)
        realizedPnlRef.current = roundN(realizedPnlRef.current + realized, 2)

        return {
          ...t,
          exitPrice: roundN(exitPx, PRICE_DECIMALS),
          pnlUsd: realized,
          unrealizedPnlUsd: 0,
          closedAt: now,
          status: "closed",
          closeReason: "MANUAL",
        } satisfies Trade
      })

      if (changed) tradesRef.current = next
      return changed ? next : prev
    })
  }

  const closeAll = () => {
    const ids = tradesRef.current.filter(t => t.status === "open").map(t => t.id)
    for (const id of ids) closeTrade(id)
  }

  const reset = (opts?: { seed?: number }) => {
    localStorage.removeItem(STORAGE_KEY)

    const nextSeed = Number.isFinite(opts?.seed) ? (opts!.seed as number) : Date.now()
    seedRef.current = nextSeed
    rngRef.current = mulberry32(nextSeed)

    idRef.current = 1
    realizedPnlRef.current = 0
    dailyLossRef.current = 0
    lastTradeOpenedMsRef.current = 0

    riskBrakeRef.current = false
    lastDailyCapRef.current = 0

    setTrades([])
    tradesRef.current = []

    const base = roundN(baseBalanceRef.current, 2)
    setEquitySeries([base])
    lastEquityRef.current = base
    lastEquityMoveMsRef.current = nowMs()

    if (market) {
      synthRef.current = {
        btc: roundN(market.btc, PRICE_DECIMALS),
        eth: roundN(market.eth, PRICE_DECIMALS),
        sol: roundN(market.sol, PRICE_DECIMALS),
      }
      anchorRef.current = { ...synthRef.current }
      lastAnchorRef.current = { ...anchorRef.current }
      lastMarketMsRef.current = nowMs()
    } else {
      synthRef.current = { btc: 0, eth: 0, sol: 0 }
      anchorRef.current = { btc: 0, eth: 0, sol: 0 }
      lastAnchorRef.current = { btc: 0, eth: 0, sol: 0 }
      lastMarketMsRef.current = 0
    }

    regimeRef.current = REGIMES[0]
    regimeUntilRef.current = 0
    flatTicksRef.current = { btc: 0, eth: 0, sol: 0 }
  }

  /* ================= DERIVED ================= */

  const closedTrades = useMemo(() => trades.filter(t => t.status === "closed"), [trades])
  const openTrades = useMemo(() => trades.filter(t => t.status === "open"), [trades])

  const equity = useMemo(() => equitySeries, [equitySeries])

  const metrics: TradingEngineMetrics = useMemo(() => {
    const pnlRealized = closedTrades.reduce((s, t) => s + t.pnlUsd, 0)
    const pnlUnrealized = openTrades.reduce((s, t) => s + t.unrealizedPnlUsd, 0)
    const pnl = roundN(pnlRealized + pnlUnrealized, 2)

    const balance = Math.max(0, roundN(baseBalanceRef.current + pnl, 2))

    const equityNow = equitySeries.length ? Number(equitySeries[equitySeries.length - 1]) : roundN(baseBalanceRef.current, 2)
    const equityPeak = equitySeries.length ? Math.max(...equitySeries) : equityNow
    const drawdownPct = equityPeak > 0 ? roundN(((equityNow - equityPeak) / equityPeak) * 100, 2) : 0

    let lossStreak = 0
    for (let i = closedTrades.length - 1; i >= 0; i--) {
      const t = closedTrades[i]
      if (t.pnlUsd < 0) lossStreak++
      else break
    }

    const equityFlatMs = Math.max(0, nowMs() - (lastEquityMoveMsRef.current || nowMs()))

    const dailyLossUsd = roundN(dailyLossRef.current, 2)
    const dailyCapUsd = roundN(lastDailyCapRef.current || equityNow * DAILY_RISK_PCT, 2)

    const riskBrakeActive = !!riskBrakeRef.current && !disableRiskBrakeRef.current

    return {
      balance,
      pnl,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      pnlRealized: roundN(pnlRealized, 2),
      pnlUnrealized: roundN(pnlUnrealized, 2),
      synthPrices: synthRef.current,
      regime: regimeRef.current.name,
      paused,
      seed: seedRef.current,

      equityNow,
      equityPeak,
      drawdownPct,
      lossStreak,
      equityFlatMs,

      dailyLossUsd,
      dailyCapUsd,
      riskBrakeActive,

      disableRiskBrake: !!disableRiskBrakeRef.current,
    }
  }, [closedTrades, openTrades, paused, equitySeries])

  return {
    status,
    trades,
    equity,
    metrics,
    actions: {
      setPaused,
      closeTrade,
      closeAll,
      reset,
    },
  }
}
