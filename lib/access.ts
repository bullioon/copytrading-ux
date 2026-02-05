// accessStore.ts (o donde sea)
import { db, FieldValue } from "./firebaseAdmin"
import type { Tier } from "./solana"

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

