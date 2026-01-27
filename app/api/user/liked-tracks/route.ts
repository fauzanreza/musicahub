
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const likedTracks = await prisma.likedTrack.findMany({
      where: {
        userId,
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
      orderBy: {
        createdAt: "desc",
      },
    })


    // Format to match Track interface
    const tracks = await Promise.all(likedTracks.map(async (lt: any) => {
      const track = lt.track
      const votes = await prisma.vote.groupBy({
        by: ["type"],
        where: { trackId: track.id },
        _count: true,
      })

      const ups = votes.find((v: any) => v.type === "UP")?._count || 0
      const downs = votes.find((v: any) => v.type === "DOWN")?._count || 0
      
      const userVote = await prisma.vote.findUnique({
        where: { trackId_userId: { trackId: track.id, userId } }
      })

      return {
        ...track,
        votes: { ups, downs },
        isLiked: true,
        userVote: userVote?.type || null
      }
    }))

    return NextResponse.json(tracks)
  } catch (error) {
    console.error("Error fetching liked tracks:", error)
    return NextResponse.json(
      { error: "Failed to fetch liked tracks" },
      { status: 500 }
    )
  }
}
