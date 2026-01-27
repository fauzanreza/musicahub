import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jam = await prisma.jam.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        currentTrack: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        queue: {
          include: {
            track: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 50,
        },
      },
    });

    if (!jam) {
      return new NextResponse("Jam not found", { status: 404 });
    }

    // Check if user is a member
    const isMember = jam.members.some((m) => m.userId === userId);
    if (!isMember && !jam.isPublic) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(jam);
  } catch (error) {
    console.error("[JAM_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jam = await prisma.jam.findUnique({
      where: { id },
    });

    if (!jam) {
      return new NextResponse("Jam not found", { status: 404 });
    }

    // Only host can update jam settings
    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, isPublic, currentTrackId, isPlaying, seekPosition } = body;

    const updatedJam = await prisma.jam.update({
      where: { id },
      data: {
        name,
        isPublic,
        currentTrackId,
        isPlaying,
        seekPosition,
        lastSyncAt: (isPlaying !== undefined || seekPosition !== undefined || currentTrackId !== undefined) ? new Date() : undefined,
      },
    });

    return NextResponse.json(updatedJam);
  } catch (error) {
    console.error("[JAM_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jam = await prisma.jam.findUnique({
      where: { id },
    });

    if (!jam) {
      return new NextResponse("Jam not found", { status: 404 });
    }

    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.jam.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[JAM_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
