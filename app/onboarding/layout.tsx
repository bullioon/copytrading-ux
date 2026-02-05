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
// Si ya estás authed y ya tienes tier en DB => no hay razón para ver onboarding.
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

  // 3) Si ya tiene tier guardado => brinca a /enter?tier=...
  try {
    const snap = await db.collection("access").doc(address).get()
    if (!snap.exists) return <>{children}</>

    const data = snap.data() as any
    const tier = normalizeTier(data?.tier)

    // ✅ NUEVA LOGICA: si hay tier, entra (Bullion free)
    if (tier) {
      redirect(`/enter?tier=${encodeURIComponent(tier)}`)
    }
  } catch {
    return <>{children}</>
  }

  // 4) default: deja pasar
  return <>{children}</>
}
