"use client"

import { useEffect, useState } from "react"

type PhantomProvider = {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: { toString(): string } }>
  disconnect: () => Promise<void>
  publicKey?: { toString(): string }
}

export function usePhantom() {
  const [provider, setProvider] = useState<PhantomProvider | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  /* ===== DETECT PHANTOM ===== */
  useEffect(() => {
    if (typeof window === "undefined") return

    const anyWindow = window as any
    if (anyWindow.solana?.isPhantom) {
      setProvider(anyWindow.solana)
    }

    setReady(true)
  }, [])

  /* ===== CONNECT ===== */
  const connect = async () => {
    if (!provider) {
      window.open("https://phantom.app/", "_blank")
      return
    }

    try {
      const res = await provider.connect()
      setWallet(res.publicKey.toString())
    } catch (err) {
      console.error("Phantom connect error", err)
    }
  }

  /* ===== DISCONNECT ===== */
  const disconnect = async () => {
    if (!provider) return
    await provider.disconnect()
    setWallet(null)
  }

  return {
    ready,
    wallet,
    connected: !!wallet,
    connect,
    disconnect,
  }
}
