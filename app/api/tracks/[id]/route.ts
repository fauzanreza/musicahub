
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteProps {
  params: Promise<{
    id: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, genre, coverUrl } = body

    // Verify ownership
    const track = await prisma.track.findUnique({
      where: { id },
    })

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    if (track.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this track" },
        { status: 403 }
      )
    }

    const updatedTrack = await prisma.track.update({
      where: { id },
      data: {
        title,
        genre,
        coverUrl,
      },
    })

    return NextResponse.json(updatedTrack)
  } catch (error) {
    console.error("Track update error:", error)
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const track = await prisma.track.findUnique({
      where: { id },
    })

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    if (track.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this track" },
        { status: 403 }
      )
    }

    await prisma.track.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Track deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete track" },
      { status: 500 }
    )
  }
}
