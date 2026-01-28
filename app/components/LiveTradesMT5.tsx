"use client"

import { useEffect, useMemo, useState } from "react"
import type { Trade, MarketPrices } from "../hooks/useTradingEngine"

type Tab = "positions" | "orders" | "deals"

/* ================= SAFE FORMATTERS ================= */

function toNum(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "")
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function fmtFixed(v: any, decimals = 2) {
  const n = toNum(v)
  return Number.isFinite(n) ? n.toFixed(decimals) : "—"
}

function safeTime(v: any) {
  const d = new Date(v)
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString() : "—"
}

function normalizePair(pair: string) {
  const p = String(pair || "")
  const noSlash = p.replace("/", "")
  const upper = p.toUpperCase()
  const upperNoSlash = noSlash.toUpperCase()
  return { p, noSlash, upper, upperNoSlash }
}

/**
 * Tries to get price from different possible market shapes:
 * - market.btc / market.eth / market.sol
 * - market["BTC/USDT"] or market["BTCUSDT"]
 * - market.prices["BTC/USDT"] etc
 * - market.BTC, market.ETH, market.SOL
 */
function getMarketPrice(pair: string, market: MarketPrices | null): number {
  if (!market) return NaN

  const m: any = market
  const { upper, upperNoSlash } = normalizePair(pair)

  // 1) common simple fields (btc/eth/sol)
  if (upper.includes("BTC")) {
    const v =
      toNum(m?.btc) ??
      toNum(m?.BTC) ??
      toNum(m?.btcUsd) ??
      toNum(m?.BTCUSD)
    if (Number.isFinite(v)) return v
  }

  if (upper.includes("ETH")) {
    const v =
      toNum(m?.eth) ??
      toNum(m?.ETH) ??
      toNum(m?.ethUsd) ??
      toNum(m?.ETHUSD)
    if (Number.isFinite(v)) return v
  }

  if (upper.includes("SOL")) {
    const v =
      toNum(m?.sol) ??
      toNum(m?.SOL) ??
      toNum(m?.solUsd) ??
      toNum(m?.SOLUSD)
    if (Number.isFinite(v)) return v
  }

  // 2) record-like access: market["BTC/USDT"] or market["BTCUSDT"]
  const direct1 = toNum(m?.[upper])
  if (Number.isFinite(direct1)) return direct1

  const direct2 = toNum(m?.[upperNoSlash])
  if (Number.isFinite(direct2)) return direct2

  // 3) nested shapes: market.prices["BTC/USDT"] / market.prices["BTCUSDT"]
  const nested1 = toNum(m?.prices?.[upper])
  if (Number.isFinite(nested1)) return nested1

  const nested2 = toNum(m?.prices?.[upperNoSlash])
  if (Number.isFinite(nested2)) return nested2

  // 4) nested bid/ask/last objects: market["BTC/USDT"].last etc
  const obj1 = m?.[upper] ?? m?.[upperNoSlash]
  const last = toNum(obj1?.last ?? obj1?.price ?? obj1?.mid ?? obj1?.bid)
  if (Number.isFinite(last)) return last

  return NaN
}

export default function LiveTradesMT5({
  trades,
  market,
}: {
  trades: Trade[]
  market: MarketPrices | null
}) {
  const [tab, setTab] = useState<Tab>("positions")

  const openTrades = useMemo(() => trades.filter(t => t.status === "open"), [trades])
  const closedTrades = useMemo(() => trades.filter(t => t.status === "closed"), [trades])

  /**
   * IMPORTANT:
   * - POSITIONS: only show trades that actually have a real entryPrice (>0)
   *   (otherwise you get phantom rows)
   */
  const openTradesReady = useMemo(() => {
    return openTrades.filter(t => {
      const entry = toNum((t as any).entryPrice)
      return Number.isFinite(entry) && entry > 0
    })
  }, [openTrades])

  const visibleTrades =
    tab === "positions"
      ? openTradesReady
      : tab === "deals"
        ? closedTrades
        : []

  const hasOpenButNoneReady =
    tab === "positions" && openTrades.length > 0 && openTradesReady.length === 0

  // ✅ Debug opcional: confirma data real que llega al terminal
  useEffect(() => {
    const t = trades.find(x => x.status === "open")
    if (!t) return
    console.log("[TERMINAL DEBUG]", {
      pair: t.pair,
      entry: (t as any).entryPrice,
      exit: (t as any).exitPrice,
      synthMarket: market,
      marketPx: getMarketPrice(t.pair, market),
      unreal: (t as any).unrealizedPnlUsd,
      realized: (t as any).pnlUsd,
    })
  }, [trades, market])

  return (
    <section className="relative border border-green-900/60 bg-black/80 rounded-md font-mono scanlines">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-green-900/50">
        <span className="text-xs tracking-widest text-green-400">EXECUTION TERMINAL</span>

        <div className="flex gap-2">
          <TabButton label="POSITIONS" active={tab === "positions"} onClick={() => setTab("positions")} />
          <TabButton label="ORDERS" active={tab === "orders"} onClick={() => setTab("orders")} />
          <TabButton label="DEALS" active={tab === "deals"} onClick={() => setTab("deals")} />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto px-3 py-2">
        <table className="w-full text-xs border-collapse">
          <thead className="border-b border-green-900/40 text-green-400/70">
            <tr>
              <th className="text-left py-1">TIME</th>
              <th className="text-left">SYMBOL</th>
              <th className="text-left">TRADER</th>
              <th className="text-right">ENTRY</th>
              <th className="text-right">PRICE</th>
              <th className="text-right">PnL</th>
            </tr>
          </thead>

          <tbody>
            {tab === "orders" && <EmptyRow label="NO PENDING ORDERS" />}

            {hasOpenButNoneReady && <EmptyRow label="WAITING FOR FIRST FILL / PRICE FEED" />}

            {!hasOpenButNoneReady && visibleTrades.length === 0 && tab !== "orders" && (
              <EmptyRow label="NO ACTIVE TRADES" />
            )}

            {visibleTrades.map(t => {
              const entry = toNum((t as any).entryPrice)
              const exit = toNum((t as any).exitPrice)

              // ✅ PRICE displayed in terminal comes from REAL market feed (UI layer)
              const mpx = getMarketPrice(t.pair, market)
              const currentPrice = Number.isFinite(mpx) && mpx > 0 ? mpx : NaN

              const time =
                t.status === "open"
                  ? (t as any).openedAt
                  : ((t as any).closedAt ?? (t as any).openedAt)

              // PRICE:
              // - open: show current market
              // - closed: show exit (or entry fallback)
              const price =
                t.status === "open"
                  ? currentPrice
                  : (Number.isFinite(exit) && exit > 0 ? exit : entry)

              // ✅ PnL SOLO desde el engine (NO calculamos con market)
              // OPEN  -> unrealizedPnlUsd
              // CLOSED -> pnlUsd (realized)
              const realized = toNum((t as any).pnlUsd)
              const unreal = toNum((t as any).unrealizedPnlUsd)

              const pnlToShow =
                t.status === "open"
                  ? (Number.isFinite(unreal) ? unreal : NaN)
                  : (Number.isFinite(realized) ? realized : NaN)

              const positive = Number.isFinite(pnlToShow) ? pnlToShow >= 0 : true

              return (
                <tr
                  key={`${t.id}-${t.status}-${t.pair}-${(t as any).openedAt}-${(t as any).closedAt ?? ""}`}
                  className="border-b border-green-900/30 hover:bg-green-900/10 transition"
                >
                  <td className="py-1 opacity-80">{safeTime(time)}</td>

                  <td className="text-green-300">{t.pair}</td>

                  <td className="opacity-70">{(t as any).traderName ?? "—"}</td>

                  <td className="text-right opacity-80">
                    {Number.isFinite(entry) && entry > 0 ? fmtFixed(entry, 2) : "PENDING"}
                  </td>

                  <td className="text-right">
                    {Number.isFinite(price) && price > 0 ? fmtFixed(price, 2) : "—"}
                  </td>

                  <td className={`text-right ${positive ? "text-green-400" : "text-red-400"}`}>
                    {Number.isFinite(pnlToShow) ? (
                      <>
                        {pnlToShow >= 0 ? "+" : ""}
                        {fmtFixed(pnlToShow, 2)}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ===== SYSTEM GLOW ===== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.12),_transparent_70%)]" />
    </section>
  )
}

/* ================= HELPERS ================= */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[10px] tracking-widest border transition
        ${
          active
            ? "border-green-400 text-green-400 bg-green-400/10"
            : "border-green-900/40 text-green-500/60 hover:text-green-400"
        }`}
    >
      {label}
    </button>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={6} className="py-6 text-center text-[10px] tracking-widest opacity-40">
        {label}
      </td>
    </tr>
  )
}