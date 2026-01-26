// app/api/votes/route.ts

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { trackId, type } = body

    if (!trackId || !type || !["UP", "DOWN"].includes(type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        trackId_userId: {
          trackId,
          userId: session.user.id,
        },
      },
    })

    if (existingVote) {
      // If same vote type, remove it (toggle off)
      if (existingVote.type === type) {
        await prisma.vote.delete({
          where: {
            trackId_userId: {
              trackId,
              userId: session.user.id,
            },
          },
        })
        return NextResponse.json({ vote: null })
      } else {
        // If different vote type, update it
        const updatedVote = await prisma.vote.update({
          where: {
            trackId_userId: {
              trackId,
              userId: session.user.id,
            },
          },
          data: { type },
        })
        return NextResponse.json({ vote: updatedVote })
      }
    } else {
      // Create new vote
      const newVote = await prisma.vote.create({
        data: {
          trackId,
          userId: session.user.id,
          type,
        },
      })
      return NextResponse.json({ vote: newVote })
    }
  } catch (error) {
    console.error("Error handling vote:", error)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}