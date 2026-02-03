import React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { readSession } from "@/lib/session"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeTier(t?: string | null) {
  const x = (t || "").toUpperCase()
  return x === "BULLION" || x === "HELLION" || x === "TORION" ? x : ""
}

// ✅ Onboarding ES PUBLICO.
// Si ya estás authed + active + tier (en DB), no tiene sentido ver onboarding: te mandamos a /enter?tier=...
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const token = store.get("ct_session")?.value

  // 1) No session => onboarding público
  if (!token) return <>{children}</>

  // 2) Lee sesión (si falla, no bloquees)
  let address = ""
  try {
    const payload = await readSession(token)
    address = payload?.address || ""
  } catch {
    return <>{children}</>
  }

  if (!address) return <>{children}</>

  // 3) Si ya tiene acceso activo + tier => brinca
  try {
    const snap = await db.collection("access").doc(address).get()
    if (snap.exists) {
      const data = snap.data() as any
      const tier = normalizeTier(data?.tier)

      if (data?.active === true && tier) {
        // ✅ Mantén el tier por query para que /enter decida dashboard
        redirect(`/enter?tier=${encodeURIComponent(tier)}`)
      }
    }
  } catch {
    // si firestore falla, no bloquees onboarding
    return <>{children}</>
  }

  // 4) default: deja pasar
  return <>{children}</>
}
