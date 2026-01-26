
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface RouteProps {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params
    const session = await auth()

    // Increment play count
    const track = await prisma.track.update({
      where: { id },
      data: {
        playCount: {
          increment: 1,
        },
      },
    })

    // If user is logged in, record in play history
    if (session?.user?.id) {
      const userId = session.user.id
      await prisma.playHistory.create({
        data: {
          trackId: id,
          userId,
        },
      })
    }

    return NextResponse.json({ success: true, playCount: track.playCount })
  } catch (error) {
    console.error("Error recording play:", error)
    return NextResponse.json(
      { error: "Failed to record play" },
      { status: 500 }
    )
  }
}
