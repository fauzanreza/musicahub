import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jamId } = await params;
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

    // Only host can add to queue
    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { trackId } = body;

    if (!trackId) {
      return new NextResponse("Track ID is required", { status: 400 });
    }

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return new NextResponse("Track not found", { status: 404 });
    }

    // Get current max position
    const lastTrack = await prisma.jamTrack.findFirst({
      where: { jamId },
      orderBy: { position: "desc" },
    });

    const position = lastTrack ? lastTrack.position + 1 : 0;

    // Add to queue
    const jamTrack = await prisma.jamTrack.create({
      data: {
        jamId,
        trackId,
        position,
      },
      include: {
        track: true,
      },
    });

    // If no track is currently playing, set this as the current track
    if (!jam.currentTrackId) {
      await prisma.jam.update({
        where: { id: jamId },
        data: {
          currentTrackId: trackId,
          isPlaying: true,
        },
      });
    }

    return NextResponse.json(jamTrack);
  } catch (error: any) {
    console.error("[JAM_QUEUE_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
