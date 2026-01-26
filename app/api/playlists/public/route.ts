
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = parseInt(searchParams.get("limit") || "10")

    let where: any = {
      isPublic: true,
    }

    if (query) {
      where.name = { contains: query }
    }

    const playlists = await prisma.playlist.findMany({
      where,
      take: limit,
      include: {
        user: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(playlists)
  } catch (error) {
    console.error("Error fetching public playlists:", error)
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    )
  }
}
