"use client"

import type { Tier } from "@/app/components/AICoreFlow"

export default function PhantomWalletMock({ tier }: { tier: Tier }) {
  const tone =
    tier === "BULLION"
      ? { ring: "ring-emerald-400/30", dot: "bg-emerald-400", pill: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100" }
      : tier === "HELLION"
      ? { ring: "ring-red-400/30", dot: "bg-red-400", pill: "border-red-300/20 bg-red-400/[0.08] text-red-100" } // ✅ rojo
      : { ring: "ring-purple-400/30", dot: "bg-purple-400", pill: "border-purple-300/20 bg-purple-500/[0.10] text-purple-100" }

  const assets =
    tier === "TORION"
      ? [
          { sym: "USDC", name: "USD Coin", amt: "2,430.10" },
          { sym: "SOL", name: "Solana", amt: "12.48" },
          { sym: "BTC", name: "Bitcoin", amt: "0.012" },
        ]
      : tier === "HELLION"
      ? [
          { sym: "USDC", name: "USD Coin", amt: "740.00" },
          { sym: "SOL", name: "Solana", amt: "4.90" },
          { sym: "ETH", name: "Ethereum", amt: "0.21" },
        ]
      : [
          { sym: "USDC", name: "USD Coin", amt: "120.00" },
          { sym: "SOL", name: "Solana", amt: "1.40" },
          { sym: "BONK", name: "Bonk", amt: "1,200,000" },
        ]

  return (
    <div className="rounded-3xl border border-white/10 bg-black/55 p-6 md:p-7">
      <div className="text-[10px] tracking-[0.26em] text-white/45">WALLET</div>

      {/* header row */}
      <div className="mt-4 flex items-center gap-3">
        <div className={["h-10 w-10 rounded-2xl bg-black/60 ring-1", tone.ring, "flex items-center justify-center"].join(" ")}>
          <span className={["h-3.5 w-3.5 rounded-full", tone.dot].join(" ")} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[12px] tracking-widest text-white/85 font-semibold">Wallet</div>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] tracking-widest text-white/70">
            7xK2…Qp9a <span className="text-white/30">•</span> SOLANA
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[11px] tracking-widest text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition"
        >
          Receive
        </button>
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[11px] tracking-widest text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition"
        >
          Send
        </button>
      </div>

      {/* assets */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="text-[10px] tracking-[0.26em] text-white/55">ASSETS</div>

        <div className="mt-4 grid gap-3">
          {assets.map((a) => (
            <div key={a.sym} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-4 py-3">
              <div className="min-w-0">
                <div className="text-[12px] tracking-widest text-white/85 font-semibold">{a.sym}</div>
                <div className="mt-1 text-[10px] tracking-widest text-white/50">{a.name}</div>
              </div>
              <div className="text-[12px] tracking-widest text-white/80">{a.amt}</div>
            </div>
          ))}
        </div>

        {/* tier pill */}
        <div className="mt-5">
          <span className={["inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-widest", tone.pill].join(" ")}>
            <span className={["h-2 w-2 rounded-full", tone.dot].join(" ")} />
            {tier === "BULLION" ? "BULLION MODE" : tier === "HELLION" ? "HELLION MODE" : "TORION MODE"}
          </span>
        </div>
      </div>
    </div>
  )
}