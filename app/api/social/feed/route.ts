import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.max(1, Math.min(10, Number(searchParams.get("limit") || 3)))

    const snap = await db
      .collection("socialComments")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get()

    const items = snap.docs.map((d) => {
      const x: any = d.data()
      const createdAt =
        typeof x.createdAtMs === "number"
          ? x.createdAtMs
          : x.createdAt?.toMillis
          ? x.createdAt.toMillis()
          : Date.now()

      return {
        id: d.id,
        username: x.username || "user",
        stars: x.stars || 5,
        text: x.text || "",
        citizenship: x.citizenship || "OTHER",
        createdAt,
      }
    })

    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    console.error("[/api/social/feed] ERROR:", e)
    return NextResponse.json({ ok: false, error: e?.message || "feed failed" }, { status: 500 })
  }
}