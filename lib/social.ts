import crypto from "crypto"

type Citizenship =
  | "MX"
  | "CO"
  | "US"
  | "ES"
  | "RU"
  | "BR"
  | "AR"
  | "DE"
  | "FR"
  | "OTHER"

export function hashEmail(email: string) {
  const norm = email.trim().toLowerCase()
  return crypto.createHash("sha256").update(norm).digest("hex")
}

export function monthKey(ms: number) {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function validatePost(body: any):
  | { ok: true; data: { username: string; email: string; text: string; stars: number; citizenship: Citizenship } }
  | { ok: false; error: string } {
  const username = String(body?.username || "").trim()
  const email = String(body?.email || "").trim()
  const text = String(body?.text || "").trim()
  const stars = Number(body?.stars || 0)
  const citizenship = (String(body?.citizenship || "OTHER") as Citizenship) || "OTHER"

  if (username.length < 2 || username.length > 20) return { ok: false, error: "Invalid username" }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Invalid email" }
  if (text.length < 2 || text.length > 240) return { ok: false, error: "Invalid comment length" }
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return { ok: false, error: "Invalid rating" }

  return { ok: true, data: { username, email, text, stars, citizenship } }
}

export function serverToClientItem(id: string, data: any) {
  const createdAt =
    data?.createdAt?.toMillis ? data.createdAt.toMillis() : Number(data?.createdAt || Date.now())

  return {
    id,
    username: String(data?.username || "user"),
    stars: Number(data?.stars || 5),
    text: String(data?.text || ""),
    citizenship: (data?.citizenship || "OTHER") as Citizenship,
    createdAt,
  }
}