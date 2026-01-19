"use client"

import React, { useMemo } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets"

// estilos del modal (WalletMultiButton)
import "@solana/wallet-adapter-react-ui/styles.css"

export default function Providers({ children }: { children: React.ReactNode }) {
  // Devnet para probar. Cuando vayas live cambia a mainnet-beta.
  const endpoint = useMemo(() => "https://api.devnet.solana.com", [])

  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
