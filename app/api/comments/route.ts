// app/api/comments/route.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get("trackId")

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID required" },
        { status: 400 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: { trackId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { trackId, content } = body

    if (!trackId || !content?.trim()) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        trackId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}