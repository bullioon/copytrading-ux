"use client"

import { useSearchParams } from "next/navigation"

export default function PayClient() {
  const params = useSearchParams()
  const tier = params.get("tier") || "BULLION"
  const mode = params.get("mode") || ""

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-semibold">Pay</h1>
      <p className="mt-3 text-white/70">
        tier: <span className="text-white">{tier}</span>
        {mode ? (
          <>
            {" "}
            · mode: <span className="text-white">{mode}</span>
          </>
        ) : null}
      </p>
    </main>
  )
}

export {}
