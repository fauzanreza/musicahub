import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; jamTrackId: string }> }
) {
  try {
    const { id: jamId, jamTrackId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jam = await prisma.jam.findUnique({
      where: { id: jamId },
    });

    if (!jam) {
      return new NextResponse("Jam not found", { status: 404 });
    }

    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.jamTrack.delete({
      where: { id: jamTrackId },
    });

    // Re-index positions
    const remainingTracks = await prisma.jamTrack.findMany({
      where: { jamId },
      orderBy: { position: "asc" },
    });

    await Promise.all(
      remainingTracks.map((track, index) =>
        prisma.jamTrack.update({
          where: { id: track.id },
          data: { position: index },
        })
      )
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[JAM_TRACK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; jamTrackId: string }> }
) {
  try {
    const { id: jamId, jamTrackId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jam = await prisma.jam.findUnique({
      where: { id: jamId },
    });

    if (!jam) {
      return new NextResponse("Jam not found", { status: 404 });
    }

    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { direction } = body; // "up" or "down"

    const currentTrack = await prisma.jamTrack.findUnique({
      where: { id: jamTrackId },
    });

    if (!currentTrack) {
      return new NextResponse("Track not found in queue", { status: 404 });
    }

    const targetPosition = direction === "up" ? currentTrack.position - 1 : currentTrack.position + 1;

    if (targetPosition < 0) {
      return new NextResponse("Already at the top", { status: 400 });
    }

    const otherTrack = await prisma.jamTrack.findFirst({
      where: {
        jamId,
        position: targetPosition,
      },
    });

    if (!otherTrack) {
      return new NextResponse("Already at the bottom", { status: 400 });
    }

    // Swap positions
    await prisma.$transaction([
      prisma.jamTrack.update({
        where: { id: currentTrack.id },
        data: { position: targetPosition },
      }),
      prisma.jamTrack.update({
        where: { id: otherTrack.id },
        data: { position: currentTrack.position },
      }),
    ]);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[JAM_TRACK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
