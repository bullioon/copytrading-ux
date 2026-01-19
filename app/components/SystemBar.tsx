"use client"

export default function SystemBar() {
  return (
    <header
      className="
        relative
        z-50
        w-full
        h-[72px]
        bg-[#050505]
        flex items-center justify-between
        px-8
      "
    >
      {/* LEFT — LOGO */}
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div
          className="
            w-9 h-9
            rounded-md
            bg-gradient-to-br
            from-green-400
            to-emerald-600
            shadow-[0_0_28px_rgba(16,185,129,0.55)]
          "
        />
        <span className="text-sm font-semibold tracking-wide text-white">
          Bullions
        </span>
      </div>

      {/* RIGHT — SOLANA */}
      <button
        className="
          px-5 py-2
          rounded-md
          text-sm font-medium
          text-purple-200
          border border-purple-500/60
          bg-purple-500/10
          shadow-[0_0_30px_rgba(168,85,247,0.55)]
          hover:bg-purple-500/20
          hover:text-purple-100
          transition
        "
      >
        Connect Solana
      </button>

      {/* BOTTOM SYSTEM LINE */}
      <div
        className="
          absolute
          bottom-0 left-0
          w-full h-px
          bg-gradient-to-r
          from-green-400
          via-yellow-400
          to-orange-500
          opacity-80
        "
      />
    </header>
  )
}
