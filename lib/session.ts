import jwt from "jsonwebtoken"

type SessionPayload = {
  address: string
  iat?: number
  exp?: number
}

function must(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export async function signSession(address: string) {
  const secret = must("ACCESS_JWT_SECRET")
  const token = jwt.sign({ address } satisfies SessionPayload, secret, {
    expiresIn: "30d",
  })
  return token
}

export async function readSession(token: string) {
  const secret = must("ACCESS_JWT_SECRET")
  const payload = jwt.verify(token, secret) as SessionPayload
  return payload
}