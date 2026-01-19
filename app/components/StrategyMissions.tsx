"use client"

export type Mission = {
  id: string
  label: string
  progress: number
  completed: boolean
}

export default function StrategyMissions({
  missions,
}: {
  missions: Mission[]
}) {
  return (
    <section className="space-y-2">
      <div className="text-[10px] tracking-widest opacity-50">
        STRATEGY OBJECTIVES
      </div>

      {missions.map(m => (
        <div
          key={m.id}
          className="flex items-center gap-3 text-xs"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              m.completed
                ? "bg-green-400"
                : m.progress > 0
                ? "bg-yellow-400"
                : "bg-neutral-600"
            }`}
          />

          <span className="flex-1 opacity-70">
            {m.label}
          </span>

          <div className="flex gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-1 rounded-sm ${
                  i < Math.round(m.progress / 17)
                    ? "bg-green-500"
                    : "bg-neutral-700"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
