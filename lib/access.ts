import { db, FieldValue } from "./firebaseAdmin"
import type { Tier } from "./solana"

export async function setAccess(address: string, tier: Tier, txSig: string) {
  const ref = db.collection("access").doc(address)
  await ref.set(
    { address, tier, active: true, txSig, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export async function getAccess(address: string) {
  const snap = await db.collection("access").doc(address).get()
  return snap.exists ? (snap.data() as any) : null
}

export async function markTxUsed(signature: string, address: string) {
  await db.collection("usedSignatures").doc(signature).set(
    { signature, address, createdAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export async function isTxUsed(signature: string) {
  const snap = await db.collection("usedSignatures").doc(signature).get()
  return snap.exists
}