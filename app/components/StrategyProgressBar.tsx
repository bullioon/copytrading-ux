"use client"

type Props = {
  progress: number
}

export default function StrategyProgressBar({ progress }: Props) {
  return (
    <section className="space-y-2">
      <div className="flex justify-between text-xs tracking-widest opacity-60">
        <span>STRATEGY PROGRESSION</span>
        <span>{progress}%</span>
      </div>

      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-green-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {progress === 100 && (
        <div className="text-[10px] text-green-400 tracking-widest">
          OBJECTIVE COMPLETE — BONUS UNLOCKED
        </div>
      )}
    </section>
  )
}
