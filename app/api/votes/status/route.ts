// app/api/votes/status/route.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ type: null })
    }

    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get("trackId")

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 })
    }


    const vote = await prisma.vote.findUnique({
      where: {
        trackId_userId: {
          trackId,
          userId,
        },
      },
    })

    return NextResponse.json({ type: vote?.type || null })
  } catch (error) {
    console.error("Error fetching vote status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
