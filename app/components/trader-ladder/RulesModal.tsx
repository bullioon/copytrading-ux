"use client"

export default function RulesModal({
  open,
  onClose,
  title,
  bullets,
}: {
  open: boolean
  onClose: () => void
  title: string
  bullets: string[]
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[420px] rounded-2xl border border-white/10 bg-black p-6">
        <div className="text-sm font-semibold text-white/90">{title}</div>

        <ul className="mt-4 space-y-2 text-xs text-white/70">
          {bullets.map((b, i) => (
            <li key={i}>• {b}</li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/10 py-2 text-xs text-white/80 hover:bg-white/15"
        >
          Close
        </button>
      </div>
    </div>
  )
}