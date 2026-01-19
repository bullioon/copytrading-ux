// app/components/TraderCardMini.tsx
"use client"

type TraderCardMiniProps = {
  name: string
  id: number
  connected: boolean
  role?: "RISK" | "ENTRY" | "EXIT" | null
  riskLabel?: "SAFE" | "AGGRO" | "HIGH"
  riskScore?: number
  pnl?: number
  winrate?: number
  onClick?: () => void
  highlighted?: boolean
}

function fmtPnl(n?: number) {
  if (n == null) return "—"
  const sign = n >= 0 ? "+" : "-"
  return `${sign}$${Math.abs(n).toFixed(0)}`
}

function roleEmoji(role?: "RISK" | "ENTRY" | "EXIT" | null) {
  if (role === "RISK") return "🧠"
  if (role === "ENTRY") return "⚡"
  if (role === "EXIT") return "🏁"
  return "—"
}

function riskEmoji(label?: "SAFE" | "AGGRO" | "HIGH") {
  if (label === "SAFE") return "🛡️"
  if (label === "AGGRO") return "⚠️"
  if (label === "HIGH") return "☠️"
  return "—"
}

export default function TraderCardMini({
  name,
  id,
  connected,
  role = null,
  riskLabel = "SAFE",
  riskScore = 30,
  pnl,
  winrate,
  onClick,
  highlighted,
}: TraderCardMiniProps) {
  const riskPct = Math.max(0, Math.min(100, riskScore))

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl border p-4 transition",
        "bg-black/55 border-white/10 hover:bg-white/5",
        highlighted ? "shadow-[0_0_0_2px_rgba(56,189,248,0.18)]" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span>{connected ? "🟢" : "⚫"}</span>
            <span className="font-semibold text-white/90">{name}</span>
          </div>
          <div className="text-[11px] text-white/40">TRADER #{id}</div>
        </div>

        <div className="text-right text-[11px] text-white/80">
          {roleEmoji(role)} {role ?? "NO ROLE"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="text-[12px] text-white/70">PnL {fmtPnl(pnl)}</div>
        <div className="text-[12px] text-white/70">WIN {winrate ? `${winrate}%` : "—"}</div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${riskPct}%`,
            background: "rgba(56,189,248,0.6)",
          }}
        />
      </div>

      <div className="mt-2 text-[10px] text-white/40">
        {highlighted ? "🎯 Click to assign role" : "Click to select"}
      </div>
    </button>
  )
}
