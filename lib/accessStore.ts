// lib/accessStore.ts
import { db, FieldValue } from "@/lib/firebaseAdmin"
import type { Tier } from "@/lib/solana"

// Guarda SOLO el tier (onboarding / login)
export async function setTier(address: string, tier: Tier) {
  const ref = db.collection("access").doc(address)
  await ref.set(
    {
      address,
      tier,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

// Lee acceso real
export async function getAccess(address: string) {
  const snap = await db.collection("access").doc(address).get()
  return snap.exists ? (snap.data() as any) : null
}

// SOLO cuando haya pago real
export async function setAccess(address: string, tier: Tier, txSig: string) {
  const ref = db.collection("access").doc(address)
  await ref.set(
    {
      address,
      tier,
      active: true,
      txSig,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

// (opcional) fuerza a TS a tratarlo como módulo aunque alguien lo rompa
export {}