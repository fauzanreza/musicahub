
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteProps {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        tracks: {
          orderBy: {
            position: "asc",
          },
          include: {
            track: {
              include: {
                creator: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    comments: true,
                    votes: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Format tracks
    const formattedTracks = playlist.tracks.map((pt: any) => ({
      ...pt.track,
      votes: { ups: 0, downs: 0 }, // Simplified
    }))

    return NextResponse.json({
      ...playlist,
      tracks: formattedTracks,
    })
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    )
  }
}
