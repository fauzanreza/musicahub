
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { username, bio, avatar } = body

    // Validation
    if (username && username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long" },
        { status: 400 }
      )
    }

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username,
        bio,
        avatar,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
