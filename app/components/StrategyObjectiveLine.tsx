"use client"

type Props = {
  label: string
  progress?: number
  danger?: boolean
}

export default function StrategyObjectiveLine({
  label,
  progress,
  danger,
}: Props) {
  return (
    <section
      className={`
        border rounded px-4 py-3 text-xs
        ${danger ? "border-red-900 text-red-400" : "border-green-900 text-green-400"}
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="tracking-wide">
          {label}
        </span>

        {typeof progress === "number" && (
          <span className="opacity-60">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-2 h-1 w-full bg-neutral-800 rounded overflow-hidden">
          <div
            className={`h-full ${
              danger ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </section>
  )
}
