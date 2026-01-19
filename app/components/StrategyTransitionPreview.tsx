"use client"

/* ================= TYPES ================= */

export type StrategyHealth = "stable" | "warning" | "critical"

export type PlanBTrader = {
  id: number
  name: string
  role: string
}

type Props = {
  health: StrategyHealth
  currentDrawdown: number
  triggerThreshold: number
  planBTraders: PlanBTrader[]
}

/* ================= HELPERS ================= */

function healthColor(health: StrategyHealth) {
  if (health === "stable") return "text-green-400"
  if (health === "warning") return "text-amber-400"
  return "text-red-400"
}

function curveColor(health: StrategyHealth) {
  if (health === "stable") return "#4ade80"
  if (health === "warning") return "#fbbf24"
  return "#ef4444"
}

function statusCopy(health: StrategyHealth) {
  if (health === "stable")
    return "System operating within defined risk parameters"
  if (health === "warning")
    return "Performance approaching risk threshold"
  return "Plan B execution active"
}

/* ================= COMPONENT ================= */

export default function StrategyTransitionPreview({
  health,
  currentDrawdown,
  triggerThreshold,
  planBTraders,
}: Props) {
  const isCritical = health === "critical"
  const isWarning = health === "warning"

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur">
      {/* HEADER */}
      <div className="mb-5">
        <h3 className="text-sm tracking-widest text-white/80">
          STRATEGY TRANSITION PREVIEW
        </h3>
        <p className={`mt-1 text-xs ${healthColor(health)}`}>
          {statusCopy(health)}
        </p>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-[1.3fr_0.7fr_1fr] gap-6 items-center">
        {/* === A · PERFORMANCE CURVE === */}
        <div className="relative h-40 rounded-lg border border-white/10 p-4">
          <svg
            viewBox="0 0 200 100"
            className="absolute inset-0 h-full w-full"
          >
            {/* Curve */}
            <path
              d="M0,75 C40,45 80,55 120,30 160,10 200,20"
              fill="none"
              stroke={curveColor(health)}
              strokeWidth="2"
            />

            {/* Trigger line */}
            <line
              x1="0"
              y1="55"
              x2="200"
              y2="55"
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 4"
            />

            {/* Current point */}
            <circle
              cx="120"
              cy="30"
              r="4"
              fill={curveColor(health)}
            />
          </svg>

          <div className="relative z-10 text-xs text-white/70 space-y-1">
            <div>Current DD: {currentDrawdown}%</div>
            <div>Trigger: {triggerThreshold}%</div>
          </div>
        </div>

        {/* === B · STATE === */}
        <div className="flex flex-col items-center justify-center text-center text-xs">
          {health === "stable" && (
            <span className="text-white/40">
              Backup operators on standby
            </span>
          )}

          {health === "warning" && (
            <span className="text-amber-400">
              Execution transfer armed
            </span>
          )}

          {health === "critical" && (
            <span className="text-green-400">
              Control transferred to Plan B
            </span>
          )}
        </div>

        {/* === C · PLAN B OPERATORS === */}
        <div className="space-y-2">
          {planBTraders.length === 0 && (
            <div className="text-xs text-white/30">
              No backup operators assigned
            </div>
          )}

          {planBTraders.map(trader => (
            <div
              key={trader.id}
              className={`rounded-md border px-3 py-2 text-xs transition ${
                isCritical
                  ? "border-green-500/40 text-white"
                  : isWarning
                  ? "border-amber-500/30 text-white/70"
                  : "border-white/10 text-white/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{trader.name}</div>
                  <div className="text-[10px] text-white/40">
                    {trader.role}
                  </div>
                </div>

                <span
                  className={`rounded px-2 py-0.5 text-[10px] ${
                    isCritical
                      ? "bg-green-500/20 text-green-400"
                      : isWarning
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {isCritical
                    ? "ACTIVE"
                    : isWarning
                    ? "ARMED"
                    : "STANDBY"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
