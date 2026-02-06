import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    projectId: process.env.FIREBASE_PROJECT_ID ?? null,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "NOT_SET",
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? "SET" : "NOT_SET",
  })
}
