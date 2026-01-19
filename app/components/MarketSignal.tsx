"use client"

export default function MarketSignal() {
  return (
    <div className="relative border border-green-400/40 bg-black/60 p-4 glow-soft max-w-md">

      <p className="text-[10px] tracking-widest opacity-60 mb-2">
        MARKET SIGNAL · LIVE FEED
      </p>

      <svg
        viewBox="0 0 100 40"
        className="w-full h-24"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="signalGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* AREA */}
        <polyline
          points="0,30 10,26 20,28 30,22 40,24 50,18 60,20 70,14 80,16 90,12 100,14"
          fill="url(#signalGlow)"
          stroke="none"
        />

        {/* LINE */}
        <polyline
          points="0,30 10,26 20,28 30,22 40,24 50,18 60,20 70,14 80,16 90,12 100,14"
          fill="none"
          stroke="#22c55e"
          strokeWidth="0.8"
          className="drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]"
        />
      </svg>

      <p className="text-[10px] tracking-widest opacity-40 mt-2">
        AI FILTERING PRICE ACTION
      </p>
    </div>
  )
}

