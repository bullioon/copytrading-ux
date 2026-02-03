// app/enter/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { readSession } from "@/lib/session"
import { setTier } from "@/lib/accessStore"

export const dynamic = "force-dynamic"

function normalizeTier(t?: string | null) {
  const x = (t || "").toUpperCase()
  return x === "BULLION" || x === "HELLION" || x === "TORION" ? x : ""
}

type SP = { tier?: string }

export default async function Page({ searchParams }: { searchParams: any }) {
  const c = await cookies()

  // ✅ usa la cookie real de sesión (incluye ct_session)
  const token =
    c.get("ct_session")?.value ||
    c.get("access_token")?.value ||
    c.get("session")?.value ||
    c.get("token")?.value ||
    ""

  if (!token) {
    redirect("/login?next=" + encodeURIComponent("/enter"))
  }

  // ✅ Promise-safe (Next 16 puede mandar Promise)
  const sp = (await Promise.resolve(searchParams)) as SP

  const tier = normalizeTier(sp?.tier || "")
  if (!tier) redirect("/onboarding")

  // ✅ NO FETCH a /api aquí.
  // Persistimos tier directo en Firestore (best-effort)
  try {
    const payload: any = await readSession(token).catch(() => null)

    const address =
      payload?.address ||
      payload?.sub ||        // a veces viene aquí
      payload?.publicKey ||  // por si acaso
      payload?.wallet ||
      ""

    if (address) {
      await setTier(address, tier as any)
    } else {
      // no rompas UX
      // console.log("⚠️ enter: session but no address in payload")
    }
  } catch {
    // ignore (best-effort)
  }

  const mode = tier === "HELLION" ? "hellion" : tier === "TORION" ? "torion" : "bullion"
  redirect(`/dashboard?mode=${mode}`)
}