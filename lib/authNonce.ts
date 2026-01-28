import crypto from "crypto"

export function makeNonce(): string {
  return crypto.randomBytes(16).toString("hex")
}

export function makeSignInMessage(address: string, nonce: string): string {
  return [
    "Sign-in to CopyTrading UX",
    "",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n")
}