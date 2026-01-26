
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

interface RouteProps {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: trackId } = await params

    const userId = session.user.id
    // Check if user already liked
    const existingLike = await prisma.likedTrack.findUnique({
      where: {
        trackId_userId: {
          trackId,
          userId,
        },
      },
    })

    if (existingLike) {
      // Toggle off
      await prisma.likedTrack.delete({
        where: {
          trackId_userId: {
            trackId,
            userId,
          },
        },
      })
      return NextResponse.json({ liked: false })
    } else {
      // Create new like
      await prisma.likedTrack.create({
        data: {
          trackId,
          userId,
        },
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error handling like:", error)
    return NextResponse.json({ error: "Failed to like track" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ liked: false })
    }

    const { id: trackId } = await params

    const userId = session.user.id
    const like = await prisma.likedTrack.findUnique({
      where: {
        trackId_userId: {
          trackId,
          userId,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    return NextResponse.json({ liked: false })
  }
}
