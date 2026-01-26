
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const { id: playlistId } = await params
    const body = await request.json()
    const { trackId } = body

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    // Verify playlist ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const userId = session.user.id
    if (playlist.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if track already in playlist
    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Track already in playlist" }, { status: 400 })
    }

    // Get last position
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
    })

    const position = lastTrack ? lastTrack.position + 1 : 0

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        position,
      },
    })

    // Update playlist updatedAt
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(playlistTrack, { status: 201 })
  } catch (error) {
    console.error("Error adding track to playlist:", error)
    return NextResponse.json(
      { error: "Failed to add track to playlist" },
      { status: 500 }
    )
  }
}
