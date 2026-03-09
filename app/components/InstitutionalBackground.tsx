"use client"

export default function InstitutionalBackground({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020207] text-white">
      
      {/* BLUE GLOW */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px circle at 50% -20%, rgba(99,102,241,0.18), transparent 70%)",
        }}
      />

      {/* PURPLE GLOW */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px circle at 80% 20%, rgba(168,85,247,0.16), transparent 70%)",
        }}
      />

      {/* BOTTOM DEPTH */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px circle at 50% 120%, rgba(99,102,241,0.10), transparent 70%)",
        }}
      />

      {/* GRID OVERLAY */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}