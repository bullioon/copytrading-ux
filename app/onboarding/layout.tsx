import React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { readSession } from "@/lib/session"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

// ✅ Onboarding ES PUBLICO.
// Si ya estás authed + active, no tiene sentido ver onboarding: te mandamos a /enter.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const token = store.get("ct_session")?.value

  // si NO hay sesión: deja pasar (onboarding público)
  if (!token) return <>{children}</>

  // si hay sesión, intenta leerla. Si falla, deja pasar.
  let address = ""
  try {
    const payload = await readSession(token)
    address = payload?.address || ""
  } catch {
    return <>{children}</>
  }

  if (!address) return <>{children}</>

  // si ya tiene acceso activo -> brinca a /enter (que decide dashboard)
  try {
    const snap = await db.collection("access").doc(address).get()
    if (snap.exists) {
      const data = snap.data() as any
      if (data?.active && data?.tier) {
        redirect("/enter")
      }
    }
  } catch {
    // si firestore falla, no bloquees onboarding
  }

  return <>{children}</>
}