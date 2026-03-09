"use client"

const rows = [
  { name: "Atlas", pnl: 1240, dd: 2.1 },
  { name: "Nika", pnl: 980, dd: 1.6 },
  { name: "Orion", pnl: 610, dd: 1.9 },
  { name: "Vega", pnl: 420, dd: 2.7 },
]

function fmtUsd(n: number) {
  return Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

export default function LeaderboardTable() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/45 p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-white/55">LEADERBOARD</div>
        <div className="text-[10px] tracking-widest text-white/35">{rows.length}</div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white/5 text-white/55">
            <tr>
              <th className="px-3 py-2 font-medium">Trader</th>
              <th className="px-3 py-2 font-medium">PnL</th>
              <th className="px-3 py-2 font-medium">DD%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-white/10 text-white/75">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{fmtUsd(r.pnl)}</td>
                <td className="px-3 py-2">{r.dd.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}