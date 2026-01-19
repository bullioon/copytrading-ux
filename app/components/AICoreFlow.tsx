"use client"

export default function AICoreFlow() {
  return (
    <section className="relative border border-green-400/40 bg-black/60 p-6 max-w-xl glow-soft">

      {/* HEADER */}
      <p className="text-[10px] tracking-widest opacity-70 mb-4">
        EXECUTION FLOW · REAL TIME
      </p>

      {/* FLOW */}
      <div className="space-y-4 text-xs">

        {/* CAPITAL */}
        <FlowRow
          label="USER CAPITAL"
          description="Allocated funds"
        />

        <FlowArrow />

        {/* AI CORE */}
        <div className="relative border border-blue-400/60 bg-blue-400/5 p-4 text-blue-400 terminal-glow animate-core">
          <p className="tracking-widest text-[11px] mb-1">
            AI CORE
          </p>
          <p className="opacity-70 text-[10px]">
            Analyzing thousands of trades · Filtering statistical edge
          </p>

          {/* pulse ring */}
          <div className="absolute inset-0 rounded border border-blue-400/40 animate-pulse" />
        </div>

        <FlowArrow color="blue" />

        {/* TRADERS */}
        <FlowRow
          label="3 PROFESSIONAL TRADERS"
          description="Signal sources · Strategy providers"
        />

        <FlowArrow />

        {/* EXECUTION */}
        <FlowRow
          label="EXECUTION ENGINE"
          description="Only validated trades reach your account"
          highlight
        />
      </div>
    </section>
  )
}

/* ===== SUB COMPONENTS ===== */

function FlowRow({
  label,
  description,
  highlight,
}: {
  label: string
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className={`
        border p-3
        ${highlight
          ? "border-green-400 bg-green-400/10"
          : "border-green-900/50"}
      `}
    >
      <p className="tracking-widest mb-1">
        {label}
      </p>
      <p className="text-[10px] opacity-60">
        {description}
      </p>
    </div>
  )
}

function FlowArrow({ color }: { color?: "blue" }) {
  return (
    <div className="flex justify-center">
      <span
        className={`text-xs ${
          color === "blue" ? "text-blue-400" : "text-green-400"
        }`}
      >
        ↓
      </span>
    </div>
  )
}
