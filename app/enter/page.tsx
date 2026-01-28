import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { readSession } from "@/lib/session"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function EnterPage() {
  const store = await cookies()
  const token = store.get("ct_session")?.value

  // 1) no sesión -> login
  if (!token) redirect("/login?next=" + encodeURIComponent("/enter"))

  // 2) sesión inválida -> login
  let address = ""
  try {
    const payload = await readSession(token)
    address = payload?.address || ""
  } catch {
    redirect("/login?next=" + encodeURIComponent("/enter"))
  }
  if (!address) redirect("/login?next=" + encodeURIComponent("/enter"))

  // 3) lee access
  const snap = await db.collection("access").doc(address).get()
  const data = snap.exists ? (snap.data() as any) : null

  // si no hay doc todavía, regresa a onboarding
  if (!data?.tier) redirect("/onboarding")

  // si no está activo (no pagó), pay con tier
  if (!data?.active) redirect(`/pay?tier=${encodeURIComponent(data.tier)}`)

  // 4) ya pagó: manda al dashboard correspondiente
  const tier = data.tier as "BULLION" | "HELLION" | "TORION"

  // ✅ AJUSTA AQUÍ a tus rutas reales:
  if (tier === "HELLION") redirect("/dashboard?mode=hellion")
  if (tier === "TORION") redirect("/dashboard?mode=torion")
  redirect("/dashboard?mode=bullion")
}