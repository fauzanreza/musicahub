// app/api/tracks/route.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
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
      // We'll sort in memory below for trending
      orderBy = { createdAt: "desc" }
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

    const session = await auth()
    const userId = session?.user?.id

    let tracksWithVotes = await Promise.all(
      tracks.map(async (track: any) => {
        const votes = await prisma.vote.groupBy({
          by: ["type"],
          where: { trackId: track.id },
          _count: true,
        })

        const ups = votes.find((v: any) => v.type === "UP")?._count || 0
        const downs = votes.find((v: any) => v.type === "DOWN")?._count || 0

        const isLiked = userId ? await prisma.likedTrack.findUnique({
          where: { trackId_userId: { trackId: track.id, userId } }
        }) : null

        const userVote = userId ? await prisma.vote.findUnique({
          where: { trackId_userId: { trackId: track.id, userId } }
        }) : null

        return {
          ...track,
          votes: { ups, downs },
          isLiked: !!isLiked,
          userVote: userVote?.type || null
        }
      })
    )

    if (sort === "trending") {
      tracksWithVotes.sort((a: any, b: any) => {
        const scoreA = a.votes.ups - a.votes.downs
        const scoreB = b.votes.ups - b.votes.downs
        if (scoreB !== scoreA) return scoreB - scoreA
        return b.playCount - a.playCount // Tie-break with play count
      })
    }

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