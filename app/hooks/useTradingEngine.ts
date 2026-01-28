import { useEffect, useMemo, useRef, useState } from "react"
import type { Trader } from "./useTraders"
import type { EnginePolicy } from "./useEnginePolicy"

/* ================= CONFIG ================= */

const STORAGE_KEY = "sim_engine_v1"
const MTM_TICK_MS = 450
const OPEN_DECISION_INTERVAL_MS = 3200
const MIN_TRADE_NOTIONAL_USD = 80
const SLIPPAGE_BPS = 6
const FEE_USD = 0.08
const MIN_BALANCE_USD = 0

const DAILY_RISK_PCT = 0.10
const RISK_PCT_PER_TRADE = 0.06

const PRICE_DECIMALS = 4
const UNREAL_DECIMALS = 4



// ==== UX: "always moving" equity (display layer) ====
const DISPLAY_SMOOTHING = 0.18          // qué tan rápido converge al core por tick
const DISPLAY_FLAT_AFTER_MS = 9000      // si core no se mueve en 9s, metemos wiggle
const DISPLAY_DRIFT_MAX_PCT = 0.004     // display no puede alejarse >0.4% del balance
const DISPLAY_WIGGLE_STEP_MIN = 0.03    // mínimo 3 centavos por tick de wiggle
const DISPLAY_WIGGLE_STEP_PCT = 0.00006 // o 0.006% del balance por tick

const FLAT_EPS = 0.005
const FLAT_TICKS_TO_NUDGE = 18
const NUDGE_ABS = 0.01

const MARKET_FROZEN_MS = 60_000
const EQUITY_MAX_POINTS = 160

const FORCE_ENTRY_AFTER_MS = 35_000

// después (spec real)
const FORCE_ENTRY_PROB = 0.72
const FIRST_TRADE_PROB = 0.75
const NORMAL_OPEN_PROB = 0.28

// Cola: evento raro de pérdida grande
const TAIL_EVENT_PROB = 0.035
const TAIL_LOSS_MULT_MIN = 2.0
const TAIL_LOSS_MULT_MAX = 3.5

/* ================= HELPERS (tier) ================= */


function maxOpenByBalance(baseBalance: number) {
  if (baseBalance >= 20000) return 3
  if (baseBalance >= 800) return 2
  return 1
}

function riskCapsByBalance(balance: number) {
  if (balance < 2_000) return { min: 5, max: 40 }
  if (balance < 10_000) return { min: 15, max: 180 }
  if (balance < 20_000) return { min: 30, max: 260 }
  if (balance < 50_000) return { min: 50, max: 500 }
  return { min: 60, max: 700 }
}

/* ================= TYPES ================= */
type RegimeName = "RANGE" | "UPTREND" | "DOWNTREND" | "VOLATILE"
export type Trade = {
  id: number
  traderId: number
  traderName: string

  pair: "BTC/USDT" | "ETH/USDT" | "SOL/USDT"
  direction: "LONG" | "SHORT"

  entryPrice: number
  exitPrice?: number

  size: number
  riskUsd: number

  stopPrice: number
  takeProfitPrice: number

  openedAt: number
  closedAt: number
  expiresAt: number

  status: "open" | "closed"
  closeReason?: "TP" | "SL" | "EXPIRY" | "POLICY" | "MANUAL" | "TAIL"

  pnlUsd: number
  unrealizedPnlUsd: number

  meta?: {
    tailEvent?: boolean
    tailMult?: number
  }
}

export type MarketPrices = {
  btc: number
  eth: number
  sol: number
}

type MarketRegimeName = "RANGE" | "UPTREND" | "DOWNTREND" | "VOLATILE"

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

function pickOne<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const nowMs = () => Date.now()

const roundN = (x: number, d: number) => {
  const p = 10 ** d
  return Math.round(x * p) / p
}

function choosePair(rng: () => number): Trade["pair"] {
  const r = rng()
  if (r < 0.45) return "BTC/USDT"
  if (r < 0.75) return "ETH/USDT"
  return "SOL/USDT"
}

function pxForPair(pair: Trade["pair"], synth: MarketPrices) {
  if (pair === "BTC/USDT") return synth.btc
  if (pair === "ETH/USDT") return synth.eth
  return synth.sol
}

function normalizeMarket(market: MarketPrices | null) {
  if (!market) return null
  const btc = Number(market.btc)
  const eth = Number(market.eth)
  const sol = Number(market.sol)

  const ok =
    Number.isFinite(btc) && btc > 0 &&
    Number.isFinite(eth) && eth > 0 &&
    Number.isFinite(sol) && sol > 0

  if (!ok) return null
  return { btc, eth, sol }
}

function normalizeSynth(p: any) {
  const btc = Number(p?.btc)
  const eth = Number(p?.eth)
  const sol = Number(p?.sol)

  const ok =
    Number.isFinite(btc) && btc > 0 &&
    Number.isFinite(eth) && eth > 0 &&
    Number.isFinite(sol) && sol > 0

  if (!ok) return null
  return { btc, eth, sol }
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


// ✅ base balance real del engine
const baseBalanceRef = useRef<number>(Number(account?.baseBalance) || 0)
useEffect(() => {
baseBalanceRef.current = Number(account?.baseBalance) || 0
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
  
  // ================= CONSISTENCY REFS =================

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
  const flatTicksRef = useRef<{ btc: number; eth: number; sol: number }>({
    btc: 0,
    eth: 0,
    sol: 0,
  })

  const lastTradeOpenedMsRef = useRef<number>(0)

  // ===== EQUITY CORE =====
  const lastEquityRef = useRef<number>(roundN(Number(account?.baseBalance) || 0, 2))
  const lastEquityMoveMsRef = useRef<number>(nowMs())

   // ✅ EQUITY series (para chart)
  const [equitySeries, setEquitySeries] = useState<number[]>(() => [
    roundN(Number(account?.baseBalance) || 0, 2),
  ])

  // ✅ Equity visible (always moving) + marcador de último movimiento real
  const displayEquityRef = useRef<number>(roundN(Number(account?.baseBalance) || 0, 2))
  const lastCoreEquityMoveMsRef = useRef<number>(nowMs()) // movimiento del core (no display)

  useEffect(() => {
    const snap = roundN(Number(account?.baseBalance) || 0, 2)

    // reset chart baseline
    setEquitySeries([snap])

    // reset core trackers
    lastEquityRef.current = snap
    lastEquityMoveMsRef.current = nowMs()

    // ✅ reset display trackers también (importante)
    displayEquityRef.current = snap
    lastCoreEquityMoveMsRef.current = nowMs()
  }, [account?.baseBalance])



  /* ================= OVERRIDE: DESBLOQUEA RISK BRAKE ================= */
  useEffect(() => {
    if (!disableRiskBrake) return

    // 🔓 override ON: quita frenos duros
    riskBrakeRef.current = false
    dailyLossRef.current = 0
    lastDailyCapRef.current = 0

    console.log("[OVERRIDE] risk brake disabled + daily loss reset")
  }, [disableRiskBrake])
/* ===== LOAD ===== */
useEffect(() => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  try {
    const data = JSON.parse(raw)

    const savedTrades = Array.isArray(data.trades) ? (data.trades as any[]) : []
    const normalized: Trade[] = savedTrades.map((t: any) => ({
      ...t,
      id: Number(t?.id) || 0,
      entryPrice: Number(t?.entryPrice) || 0,
      exitPrice: Number(t?.exitPrice) || Number(t?.entryPrice) || 0,
      riskUsd: Number(t?.riskUsd) || 0,
      size: Number(t?.size) || 0,
      stopPrice: Number(t?.stopPrice) || 0,
      takeProfitPrice: Number(t?.takeProfitPrice) || 0,
      pnlUsd: Number(t?.pnlUsd) || 0,
      unrealizedPnlUsd: Number(t?.unrealizedPnlUsd) || 0,
      openedAt: Number(t?.openedAt) || 0,
      closedAt: Number(t?.closedAt) || 0,
      expiresAt: Number(t?.expiresAt) || 0,
      traderId: Number(t?.traderId) || 0,
      traderName: String(t?.traderName ?? ""),
      pair: (t?.pair as any) ?? "BTC/USDT",
      direction: (t?.direction as any) ?? "LONG",
      status: (t?.status as any) ?? "closed",
      closeReason: t?.closeReason,
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

    const sp = normalizeSynth(data?.synthPrices)
    const ap = normalizeSynth(data?.anchorPrices)

    synthRef.current = sp
      ? {
          btc: roundN(sp.btc, PRICE_DECIMALS),
          eth: roundN(sp.eth, PRICE_DECIMALS),
          sol: roundN(sp.sol, PRICE_DECIMALS),
        }
      : { btc: 0, eth: 0, sol: 0 }

    anchorRef.current = ap
      ? {
          btc: roundN(ap.btc, PRICE_DECIMALS),
          eth: roundN(ap.eth, PRICE_DECIMALS),
          sol: roundN(ap.sol, PRICE_DECIMALS),
        }
      : { btc: 0, eth: 0, sol: 0 }

    lastAnchorRef.current = { ...anchorRef.current }

    const rg = data.regime
    const until = Number(data.regimeUntilMs) || 0
    if (rg) {
      const found = REGIMES.find((x) => x.name === rg)
      if (found) regimeRef.current = found
    }
    regimeUntilRef.current = until

    const maxId = normalized.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0)
    idRef.current = Math.max(1, maxId + 1)

    // ===== EQUITY SERIES LOAD (FIXED BRACES) =====
    if (Array.isArray(data.equitySeries) && data.equitySeries.length) {
      const cleaned = (data.equitySeries as any[])
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n))
        .slice(-EQUITY_MAX_POINTS)

      if (cleaned.length) {
        setEquitySeries(cleaned)

        const last = cleaned[cleaned.length - 1]
        if (Number.isFinite(last)) {
          lastEquityRef.current = Number(last)
          lastEquityMoveMsRef.current = nowMs()

          displayEquityRef.current = Number(last)
          lastCoreEquityMoveMsRef.current = nowMs()
        }
      } else {
        const snap = equitySnapshot(baseBalanceRef.current, normalized, realizedPnlRef.current)
        setEquitySeries([snap])
        lastEquityRef.current = snap
        lastEquityMoveMsRef.current = nowMs()

        displayEquityRef.current = snap
        lastCoreEquityMoveMsRef.current = nowMs()
      }
    } else {
      const snap = equitySnapshot(baseBalanceRef.current, normalized, realizedPnlRef.current)
      setEquitySeries([snap])
      lastEquityRef.current = snap
      lastEquityMoveMsRef.current = nowMs()

      displayEquityRef.current = snap
      lastCoreEquityMoveMsRef.current = nowMs()
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
    const m = normalizeMarket(market)
    if (!m) return

    const s = normalizeSynth(synthRef.current)
    if (!s) {
      synthRef.current = {
        btc: roundN(m.btc, PRICE_DECIMALS),
        eth: roundN(m.eth, PRICE_DECIMALS),
        sol: roundN(m.sol, PRICE_DECIMALS),
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
      runActiveRef.current &&
      effectiveAllow &&
      !effectivePaused &&
      baseBalanceRef.current > 0

    setStatus(canTrade ? "copying" : "idle")
  }, [account.active, market, traders.length, runActive, policy?.allowTrading, paused, disableRiskBrake])


  // ===== HERO ARC CONTROLS =====
  const peakEquityRef = useRef<number>(roundN(Number(account?.baseBalance) || 0, 2))
  const recoveryBoostRef = useRef<number>(0) // trades restantes con ayuda post-DD


function calcFeeUsd(risk: number) {
  const r = Math.max(0, Number(risk) || 0)
  return r < 20
    ? Math.max(0.01, r * 0.005)
    : Math.min(FEE_USD, Math.max(0.05, r * 0.02))
}

function applyRealized(amount: number) {
  const a = Number(amount) || 0
  realizedPnlRef.current = roundN(realizedPnlRef.current + a, 2)
  if (a < 0) dailyLossRef.current += Math.abs(a)
}

function closeTradeCore(t: Trade, pxRaw: number, reason: Trade["closeReason"]): Trade {
  const px = Number(pxRaw) > 0 ? Number(pxRaw) : (t.exitPrice || t.entryPrice)

  // slippage solo al cierre (no MTM)
  const uSlip = rngRef.current()
  const side = t.direction === "LONG" ? "sell" : "buy"
  const slipBpsBase = reason === "SL" ? SLIPPAGE_BPS * 1.4 : SLIPPAGE_BPS * 0.35
  const slipBps = recoveryBoostRef.current > 0 ? slipBpsBase * 0.6 : slipBpsBase
  const exitPx = applySlippage(px, side, slipBps, uSlip)

  // realized
  const move = t.direction === "LONG" ? exitPx - t.entryPrice : t.entryPrice - exitPx
  let realized = roundN(move * t.size, 2)

  // tail event (si existe meta)
  const meta = (t as any).meta
  const isTail = Boolean(meta?.tailEvent)
  const tailMult = Number(meta?.tailMult ?? 1)
  if (reason === "SL" && isTail) {
    realized = -roundN(Math.abs(t.riskUsd) * tailMult, 2)
  }

  // fee dinámica
  const feeUsd = calcFeeUsd(t.riskUsd)
  realized = roundN(realized - feeUsd, 2)

  // ✅ ledger único
  applyRealized(realized)

  return {
    ...t,
    status: "closed",
    closedAt: nowMs(),
    exitPrice: roundN(exitPx, PRICE_DECIMALS),
    pnlUsd: realized,
    unrealizedPnlUsd: 0,
    closeReason: reason,
  }
}

/* ================= PRICE + MTM LOOP (SINGLE SOURCE OF TRUTH) ================= */
useEffect(() => {
  if (!market) return

  const tickId = window.setInterval(() => {
    const now = nowMs()

    // update anchor + market heartbeat
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

    // regime selection
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

    const pxFor = (pair: Trade["pair"]) => pxForPair(pair, synthRef.current)

    setTrades((prev: Trade[]): Trade[] => {
      const now2 = nowMs()

      const effectiveAllow = disableRiskBrakeRef.current ? true : allowTradingRef.current
      const effectivePaused = disableRiskBrakeRef.current ? false : paused
      const canKeepOpen = effectiveAllow && runActiveRef.current && account.active && !effectivePaused

      let changed = false

      const nextTrades = prev.map((tr: Trade): Trade => {
        if (tr.status !== "open") return tr

        const px = pxFor(tr.pair)
        const move = tr.direction === "LONG" ? px - tr.entryPrice : tr.entryPrice - px
        const unreal = roundN(move * tr.size, UNREAL_DECIMALS)

        const hitTP = tr.direction === "LONG" ? px >= tr.takeProfitPrice : px <= tr.takeProfitPrice
        const hitSL = tr.direction === "LONG" ? px <= tr.stopPrice : px >= tr.stopPrice
        const expired = now2 >= tr.expiresAt
        const policyClose = !canKeepOpen

        const shouldClose =
          hitTP ||
          hitSL ||
          (expired && unreal <= 0) ||
          (policyClose && unreal <= 0)

        if (!shouldClose) {
          if (unreal !== tr.unrealizedPnlUsd) changed = true
          return { ...tr, exitPrice: px, unrealizedPnlUsd: unreal }
        }

        const reason: Trade["closeReason"] =
          hitTP ? "TP" :
          hitSL ? "SL" :
          expired ? "EXPIRY" :
          "POLICY"

        changed = true
        return closeTradeCore(tr, px, reason)
      })

      tradesRef.current = nextTrades
      lastDailyCapRef.current = roundN(baseBalanceRef.current * DAILY_RISK_PCT, 2)

      const coreSnap = equitySnapshot(baseBalanceRef.current, nextTrades, realizedPnlRef.current)

      peakEquityRef.current = Math.max(peakEquityRef.current, coreSnap)
      const ddPct = peakEquityRef.current > 0 ? (coreSnap - peakEquityRef.current) / peakEquityRef.current : 0
      if (ddPct <= -0.06 && recoveryBoostRef.current <= 0) {
        recoveryBoostRef.current = 22
      }

      if (Math.abs(coreSnap - lastEquityRef.current) >= 0.01) {
        lastCoreEquityMoveMsRef.current = now2
      }

      const bal = Math.max(1, baseBalanceRef.current)
      const maxDrift = Math.max(0.8, bal * DISPLAY_DRIFT_MAX_PCT)

      let disp = displayEquityRef.current
      disp = disp + (coreSnap - disp) * DISPLAY_SMOOTHING

      const coreFlatMs = now2 - (lastCoreEquityMoveMsRef.current || now2)
      if (coreFlatMs >= DISPLAY_FLAT_AFTER_MS) {
        const step = Math.max(DISPLAY_WIGGLE_STEP_MIN, bal * DISPLAY_WIGGLE_STEP_PCT)
        const wiggle = (rngRef.current() - 0.5) * 2 * step
        disp += wiggle
      }

      disp = clamp(disp, coreSnap - maxDrift, coreSnap + maxDrift)

      const displaySnap = roundN(disp, 2)
      displayEquityRef.current = displaySnap

      setEquitySeries((prevEq) => {
        const next = [...prevEq, displaySnap]
        return next.length > EQUITY_MAX_POINTS ? next.slice(-EQUITY_MAX_POINTS) : next
      })

      if (Math.abs(displaySnap - lastEquityRef.current) >= 0.01) {
        lastEquityRef.current = displaySnap
        lastEquityMoveMsRef.current = now2
      }

      return changed ? nextTrades : prev
    })
  }, MTM_TICK_MS)

  return () => window.clearInterval(tickId)
}, [account.active, paused, market])

  /* ================= OPEN NEW TRADES LOOP ================= */

  const marketOk =
    !!market &&
    Number.isFinite(market.btc) && market.btc > 0 &&
    Number.isFinite(market.eth) && market.eth > 0 &&
    Number.isFinite(market.sol) && market.sol > 0

  useEffect(() => {
    if (!marketOk) return

    const cadence = policy?.cadenceMultiplier ?? 1
    const safeCadence = Number.isFinite(cadence) ? cadence : 1

    const computedInterval =
      safeCadence > 0
        ? Math.max(1200, Math.round(OPEN_DECISION_INTERVAL_MS / safeCadence))
        : OPEN_DECISION_INTERVAL_MS

    // ✅ debug fijo (puedes volver a computedInterval cuando ya esté estable)
const effectiveInterval = computedInterval

    const interval = setInterval(() => {
      ;(window as any).__openTick = ((window as any).__openTick ?? 0) + 1
      const tick = (window as any).__openTick as number

      const hb = (code: string, extra?: any) => {
        console.log("[OPEN]", code, {
          tick,
          runActive: runActiveRef.current,
          accountActive: account.active,
          allow: disableRiskBrakeRef.current ? true : (policyAllowRef.current ?? true),
          paused,
          traders: traders.length,
          baseBal: baseBalanceRef.current,
          synth: synthRef.current,
          interval: effectiveInterval,
          computedInterval,
          ...extra,
        })
      }

      // heartbeat
      hb("HB")

      if (!runActiveRef.current) return hb("RUN_INACTIVE")
      if (!account.active) return hb("ACCOUNT_INACTIVE")

      const effectiveAllow = disableRiskBrakeRef.current ? true : (policyAllowRef.current ?? true)
      const effectivePaused = disableRiskBrakeRef.current ? false : paused

      if (!effectiveAllow) return hb("POLICY_BLOCK_ALLOWTRADING_FALSE")
      if (effectivePaused) return hb("PAUSED")
      if (traders.length <= 0) return hb("NO_TRADERS")
      if (baseBalanceRef.current <= 0) return hb("BASE_BALANCE_ZERO_OR_NO_ALLOCATION")

      const s = normalizeSynth(synthRef.current)
      if (!s) return hb("SYNTH_NOT_READY", { synth: synthRef.current })

      const current = tradesRef.current

      // ✅ daily cap based on baseBalance (NOT clamped equity)
      const dailyCapUsd = roundN(baseBalanceRef.current * DAILY_RISK_PCT, 2)
      lastDailyCapRef.current = dailyCapUsd

      const hitDailyCap = dailyLossRef.current >= dailyCapUsd
      if (hitDailyCap && !disableRiskBrakeRef.current) {
        riskBrakeRef.current = true
        return hb("RISK_BRAKE_DAILY_CAP", { dailyLoss: dailyLossRef.current, dailyCapUsd })
      }
      riskBrakeRef.current = false

      const eqForMaxOpen = equitySnapshot(baseBalanceRef.current, current, realizedPnlRef.current)
      const maxOpen = maxOpenByBalance(eqForMaxOpen)
      const openCount = current.filter(t => t.status === "open").length
      if (openCount >= maxOpen) return hb("MAX_OPEN_REACHED", { openCount, maxOpen })

      const now = nowMs()
      const timeSinceOpen = now - (lastTradeOpenedMsRef.current || 0)
      const shouldForce = timeSinceOpen > FORCE_ENTRY_AFTER_MS && openCount === 0

      const openProb = shouldForce ? FORCE_ENTRY_PROB : openCount === 0 ? FIRST_TRADE_PROB : NORMAL_OPEN_PROB
      const roll = rngRef.current()
      if (roll > openProb) return hb("RNG_SKIP", { roll, openProb, shouldForce, timeSinceOpen, openCount })

      hb("OPENING_ATTEMPT", { openProb, roll })

// ===== CREATE TRADE =====

const picked = traders.length ? pickOne(traders, rngRef.current) : null
if (!picked) return hb("NO_TRADER_PICK")

const pair = choosePair(rngRef.current)

const entry0 = pxForPair(pair, s)
if (!Number.isFinite(entry0) || entry0 <= 0) return hb("BAD_ENTRY_PX", { pair, entry0, s })

const regime = regimeRef.current.name as RegimeName
const baseLong =
  regime === "UPTREND" ? 0.72 :
  regime === "DOWNTREND" ? 0.28 :
  0.58

const wr = clamp01(Number((picked as any).winRate))
const adj = (wr - 0.55) * 0.10

// ✅ boost narrativo cuando estás en recovery (después de drawdown)
const boost = recoveryBoostRef.current > 0 ? 0.04 : 0

const pLong = clamp01(baseLong + adj + boost)
if (recoveryBoostRef.current > 0) recoveryBoostRef.current -= 1

const direction: Trade["direction"] =
  rngRef.current() < pLong ? "LONG" : "SHORT"

const eqNow = equitySnapshot(baseBalanceRef.current, tradesRef.current, realizedPnlRef.current)
peakEquityRef.current = Math.max(peakEquityRef.current, eqNow)

// ================= RISK (DEPENDE DEL BALANCE) =================
const perTradeBudget = Math.max(1, eqNow * RISK_PCT_PER_TRADE)
const caps = riskCapsByBalance(eqNow)

const traitAgg = ((picked as any).traits ?? []).includes("AGGRESSIVE")
const traderMult = traitAgg ? 1.25 : 1.0

let riskUsd = perTradeBudget * traderMult
riskUsd = clamp(riskUsd, caps.min, caps.max)

// 🛑 hard cap absoluto (seguridad: evita trades absurdos)
const hardCapRisk = eqNow * 0.06 // riesgo máx 6% equity
riskUsd = Math.min(riskUsd, hardCapRisk)
riskUsd = roundN(riskUsd, 2)

// ================= TP/SL (tu setup) =================
// WIN-RATE ALTO: TP cerca, SL más lejos
const tpDist = entry0 * 0.0040   // +0.40%
const stopDist = entry0 * 0.0120 // -1.20%

const stopPrice =
  direction === "LONG"
    ? roundN(entry0 - stopDist, PRICE_DECIMALS)
    : roundN(entry0 + stopDist, PRICE_DECIMALS)

const takeProfitPrice =
  direction === "LONG"
    ? roundN(entry0 + tpDist, PRICE_DECIMALS)
    : roundN(entry0 - tpDist, PRICE_DECIMALS)

// ================= SIZE (NO MÁS CENTAVOS) =================
// idea: riskUsd = notionalUsd * slPct   => notionalUsd = riskUsd / slPct
// slPct real según stopPrice
const slPct = Math.max(0.0001, Math.abs((entry0 - stopPrice) / entry0))

// notional recomendado por tu riesgo y tu stop real
let notionalUsd = riskUsd / slPct

// clamps de notional (acción + seguridad)
const MIN_NOTIONAL = MIN_TRADE_NOTIONAL_USD           // ej 80
const MAX_NOTIONAL = Math.max(MIN_NOTIONAL, eqNow * 0.35) // máx 35% equity
notionalUsd = clamp(notionalUsd, MIN_NOTIONAL, MAX_NOTIONAL)

// size en coins
let size = roundN(Math.max(0.0001, notionalUsd / entry0), 6)

// ================= TIMING / META =================
const nowOpen = nowMs()

// 🔥 más acción (menos eterno). Si quieres dejarlo como estaba, vuelve a 12–55.
// 2 a 10 minutos:
const ttlMs = 2 * 60_000 + Math.floor(rngRef.current() * (8 * 60_000))

const canTail = eqNow > peakEquityRef.current * 1.05
const tailEvent = canTail && rngRef.current() < TAIL_EVENT_PROB
const tailMult = tailEvent
  ? (TAIL_LOSS_MULT_MIN + rngRef.current() * (TAIL_LOSS_MULT_MAX - TAIL_LOSS_MULT_MIN))
  : 1

const tr: Trade = {
  id: idRef.current++,
  pair,
  traderId: Number((picked as any).id ?? 0),
  traderName: String((picked as any).name ?? "Trader"),
  direction,
  entryPrice: roundN(entry0, PRICE_DECIMALS),
  exitPrice: roundN(entry0, PRICE_DECIMALS),
  riskUsd,
  size,
  stopPrice,
  takeProfitPrice,
  pnlUsd: 0,
  unrealizedPnlUsd: 0,
  openedAt: nowOpen,
  closedAt: 0,
  expiresAt: nowOpen + ttlMs,
  status: "open",
  // @ts-ignore
  meta: { tailEvent, tailMult },
}
      lastTradeOpenedMsRef.current = nowOpen

      setTrades((prev: Trade[]): Trade[] => {
        const next = [tr, ...prev]
        tradesRef.current = next
        return next
      })

      hb("OPENED", { id: tr.id, pair: tr.pair, dir: tr.direction, riskUsd: tr.riskUsd })
    }, effectiveInterval)

    console.log("[OPEN] interval started", { effectiveInterval, computedInterval, cadence: policy?.cadenceMultiplier })

    return () => clearInterval(interval)
  }, [marketOk, traders.length, account.active, paused, disableRiskBrake, policy?.cadenceMultiplier])

/* ================= ACTIONS ================= */

const actions: TradingEngineActions = useMemo(() => {
  return {
    setPaused: (v: boolean) => setPaused(!!v),

    closeTrade: (id: number) => {
      setTrades((prev: Trade[]): Trade[] => {
        const s = normalizeSynth(synthRef.current)
        const next = prev.map((t: Trade): Trade => {
          if (t.id !== id || t.status !== "open") return t
          const px = s ? pxForPair(t.pair, s) : t.exitPrice || t.entryPrice
          return closeTradeCore(t, px, "MANUAL")
        })
        tradesRef.current = next
        return next
      })
    },

    closeAll: () => {
      setTrades((prev: Trade[]): Trade[] => {
        const s = normalizeSynth(synthRef.current)
        const next = prev.map((t: Trade): Trade => {
          if (t.status !== "open") return t
          const px = s ? pxForPair(t.pair, s) : t.exitPrice || t.entryPrice
          return closeTradeCore(t, px, "MANUAL")
        })
        tradesRef.current = next
        return next
      })
    },

    reset: (opts?: { seed?: number }) => {
      const newSeed = Number.isFinite(opts?.seed) ? (opts!.seed as number) : Date.now()
      seedRef.current = newSeed
      rngRef.current = mulberry32(newSeed)

      setPaused(false)

      realizedPnlRef.current = 0
      dailyLossRef.current = 0
      riskBrakeRef.current = false
      lastDailyCapRef.current = 0
      dayRef.current = new Date().toDateString()

      idRef.current = 1
      lastTradeOpenedMsRef.current = 0

      setTrades([])
      tradesRef.current = []

      const snap = roundN(Number(account?.baseBalance) || 0, 2)
      setEquitySeries([snap])
      lastEquityRef.current = snap
      lastEquityMoveMsRef.current = nowMs()

      displayEquityRef.current = snap
      lastCoreEquityMoveMsRef.current = nowMs()

      synthRef.current = { btc: 0, eth: 0, sol: 0 }
      anchorRef.current = { btc: 0, eth: 0, sol: 0 }
      lastAnchorRef.current = { ...anchorRef.current }
      regimeRef.current = REGIMES[0]
      regimeUntilRef.current = 0

      localStorage.removeItem(STORAGE_KEY)
    },
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [account?.baseBalance]);

/* ================= METRICS ================= */

const metrics: TradingEngineMetrics = useMemo(() => {
  const open = trades.filter((t) => t.status === "open")
  const closed = trades.filter((t) => t.status === "closed")

  const pnlRealized = roundN(realizedPnlRef.current, 2)
  const pnlUnrealized = roundN(open.reduce((s, t) => s + (t.unrealizedPnlUsd || 0), 0), 2)

  const equityNow = equitySnapshot(baseBalanceRef.current, trades, realizedPnlRef.current)
  const peak = Math.max(...equitySeries, equityNow)
  const dd = peak > 0 ? ((equityNow - peak) / peak) * 100 : 0
  const flatMs = nowMs() - (lastEquityMoveMsRef.current || nowMs())

  const dailyCapUsd = roundN(baseBalanceRef.current * DAILY_RISK_PCT, 2)

  return {
    balance: equityNow,
    pnl: roundN(pnlRealized + pnlUnrealized, 2),
    closedTrades: closed.length,
    openTrades: open.length,
    pnlRealized,
    pnlUnrealized,
    synthPrices: synthRef.current,
    regime: regimeRef.current.name,
    paused,
    seed: seedRef.current,

    equityNow,
    equityPeak: roundN(peak, 2),
    drawdownPct: roundN(dd, 4),
    lossStreak: 0,
    equityFlatMs: flatMs,

    dailyLossUsd: roundN(dailyLossRef.current, 2),
    dailyCapUsd,
    riskBrakeActive: !!riskBrakeRef.current,

    disableRiskBrake: !!disableRiskBrakeRef.current,
  }
}, [trades, equitySeries, paused]);

return {
  status,
  trades,
  equity: equitySeries,
  metrics,
  actions,
};
}