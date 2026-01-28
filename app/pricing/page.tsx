"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import dynamic from "next/dynamic"

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

type Tier = "BULLION" | "HELLION" | "TORION"

const TIERS: { id: Tier; name: string; price: number }[] = [
  { id: "BULLION", name: "Bullion", price: 300 },
  { id: "HELLION", name: "Hellion", price: 1500 },
  { id: "TORION", name: "Torion", price: 3000 },
]

export default function PricingPage() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [me, setMe] = useState<{ authed: boolean; address?: string; error?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      const r = await fetch("/api/auth/me")
      const j = await r.json().catch(() => ({}))
      setMe(j)
      if (!j?.authed) router.replace("/login")
    })()
  }, [router])

  async function chooseTier(tier: Tier) {
    try {
      setBusy(true)
     const r = await fetch("/api/access/set-tier", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ tier }),
})
      const txt = await r.text()
      let j: any = {}
      try {
        j = JSON.parse(txt)
      } catch {
        j = { error: txt }
      }
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      router.push("/onboarding")
    } catch (e: any) {
      alert(e?.message || "Failed")
    } finally {
      setBusy(false)
    }
  }

  if (!me) return <div className="min-h-screen bg-black text-white p-6">Loading...</div>

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold">Pricing</div>
            <div className="text-white/60 text-sm">
              Choose your access tier. (MVP: no charge yet)
            </div>
          </div>
          <WalletMultiButton />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Session: <span className="text-white">{me.authed ? "OK" : "NO"}</span>
          {me.address ? <> · {me.address}</> : null}
          {publicKey ? <> · Wallet connected</> : <> · Connect wallet</>}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <button
              key={t.id}
              disabled={busy}
              onClick={() => chooseTier(t.id)}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10 transition disabled:opacity-50"
            >
              <div className="text-xl font-semibold">{t.name}</div>
              <div className="text-white/60 mt-1">${t.price} USDC</div>
              <div className="text-xs text-white/50 mt-3">
                Lifetime access tier (balance can be topped up later).
              </div>
              <div className="mt-4 inline-flex rounded-xl bg-white text-black px-3 py-2 text-sm font-semibold">
                Continue
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}