// app/api/tracks/route.ts

import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get("genre")
    const sort = searchParams.get("sort") || "recent"
    const limit = parseInt(searchParams.get("limit") || "20")
    const query = searchParams.get("q")

    let orderBy: any = { createdAt: "desc" }
    let where: any = {}

    if (genre) {
      where.genre = genre
    }

    if (query) {
      where.OR = [
        { title: { contains: query } }, // Removed mode: 'insensitive' for MySQL compatibility if needed, or keep if supported
        { creator: { username: { contains: query } } },
      ]
    }

    if (sort === "popular") {
      orderBy = { playCount: "desc" }
    } else if (sort === "trending") {
      // For trending, we'll order by recent plays with high vote counts
      orderBy = [{ playCount: "desc" }, { createdAt: "desc" }]
    }

    const tracks = await prisma.track.findMany({
      where,
      orderBy,
      take: limit,
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
            likedBy: true,
          },
        },
      },
    })

    // Calculate vote scores
    const tracksWithVotes = await Promise.all(
      tracks.map(async (track: any) => {
        const votes = await prisma.vote.groupBy({
          by: ["type"],
          where: { trackId: track.id },
          _count: true,
        })

        const ups = votes.find((v: any) => v.type === "UP")?._count || 0
        const downs = votes.find((v: any) => v.type === "DOWN")?._count || 0

        return {
          ...track,
          votes: { ups, downs },
        }
      })
    )

    return NextResponse.json(tracksWithVotes)
  } catch (error) {
    console.error("Error fetching tracks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, audioUrl, coverUrl, genre, creatorId, duration } = body

    const track = await prisma.track.create({
      data: {
        title,
        audioUrl,
        coverUrl,
        genre,
        duration,
        creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error("Error creating track:", error)
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 }
    )
  }
}