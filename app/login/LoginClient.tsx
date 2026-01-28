"use client"

import { useMemo, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
)

function shortAddr(a?: string | null) {
  if (!a) return ""
  return a.slice(0, 4) + "…" + a.slice(-4)
}

export default function LoginClient() {
  const { publicKey, signMessage } = useWallet()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()
  const params = useSearchParams()

  const next = params.get("next") || "/enter"

  const inferredTier = useMemo(() => {
    try {
      const u = new URL("http://x" + next)
      return (u.searchParams.get("tier") || "").toUpperCase()
    } catch {
      return ""
    }
  }, [next])

  const tierGlow = useMemo(() => {
    if (inferredTier === "BULLION") return "0 0 90px rgba(34,197,94,0.22)"
    if (inferredTier === "HELLION") return "0 0 90px rgba(239,68,68,0.22)"
    if (inferredTier === "TORION") return "0 0 90px rgba(168,85,247,0.22)"
    return "0 0 90px rgba(168,85,247,0.16)"
  }, [inferredTier])

  async function handleSignIn() {
    try {
      setErr(null)
      setLoading(true)

      if (!publicKey) throw new Error("Connect wallet first")
      if (!signMessage) throw new Error("Wallet does not support signMessage")

      const address = publicKey.toBase58()

      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`, { credentials: "include" })
      const nonceText = await nonceRes.text()
      let nonceJson: any = {}
      try {
        nonceJson = JSON.parse(nonceText)
      } catch {
        nonceJson = { error: nonceText || "Empty response" }
      }
      if (!nonceRes.ok) throw new Error(nonceJson.error || "Nonce failed")

      const message: string = nonceJson.message

      const sigBytes = await signMessage(new TextEncoder().encode(message))
      const bs58 = (await import("bs58")).default
      const signature = bs58.encode(sigBytes)

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, message }),
      })

      const verifyText = await verifyRes.text()
      let verifyJson: any = {}
      try {
        verifyJson = JSON.parse(verifyText)
      } catch {
        verifyJson = { error: verifyText || "Empty response" }
      }
      if (!verifyRes.ok) throw new Error(verifyJson.error || "Auth failed")

      router.push(next)
    } catch (e: any) {
      setErr(e?.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen text-white flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(900px 420px at 12% 0%, rgba(168,85,247,0.18), rgba(34,197,94,0.12), rgba(0,0,0,0.92)), #000",
      }}
    >
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs tracking-widest text-white/60">
          <div>
            STATUS · <span className="text-emerald-400 font-semibold">ARMING</span>
          </div>
          <div className="text-white/50">
            NEXT · <span className="text-white/80 font-semibold">{next}</span>
          </div>
        </div>

        <div
          className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur"
          style={{ boxShadow: tierGlow }}
        >
          <div className="text-center space-y-3">
            <div className="text-[11px] tracking-widest text-white/50">WALLET VERIFICATION</div>
            <h1 className="text-4xl font-semibold tracking-tight">Login</h1>
            <p className="text-sm text-white/60">
              Connect Phantom, then sign a message to verify you own the wallet.
            </p>

            {inferredTier ? (
              <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] tracking-widest text-white/70">
                TIER LOCK · <span className="ml-2 text-white/90 font-semibold">{inferredTier}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-[10px] tracking-widest text-white/45 mb-2">CONNECT</div>
              <div className="flex items-center justify-between gap-3">
                <WalletMultiButton />
                <div className="text-[10px] tracking-widest text-white/55">
                  {publicKey ? `WALLET · ${shortAddr(publicKey.toBase58())}` : "WALLET · NOT CONNECTED"}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignIn}
              disabled={!publicKey || loading}
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-4
                         text-sm font-semibold tracking-widest
                         hover:bg-white/20 transition disabled:opacity-40"
            >
              {loading ? "SIGNING…" : "SIGN-IN · VERIFY"}
            </button>

            <div className="mt-2 space-y-2 font-mono text-xs text-emerald-300">
              <div>▸ Nonce issued</div>
              <div>▸ Signature requested (no gas)</div>
              <div>▸ Session cookie will be set</div>
              <div>▸ You continue to: {next}</div>
            </div>

            {err && (
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {err}
              </div>
            )}

            <div className="mt-4 text-center text-[10px] tracking-widest text-white/45">
              Access is allocated in waves · Leaving may release your slot
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
