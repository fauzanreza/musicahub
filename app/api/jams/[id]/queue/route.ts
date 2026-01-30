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
    const { trackId, trackIds } = body;

    const idsToAdd: string[] = trackIds || (trackId ? [trackId] : []);

    if (idsToAdd.length === 0) {
      return new NextResponse("Track IDs are required", { status: 400 });
    }

    // Verify all tracks exist
    const tracks = await prisma.track.findMany({
      where: { id: { in: idsToAdd } },
    });

    if (tracks.length !== idsToAdd.length) {
      return new NextResponse("One or more tracks not found", { status: 404 });
    }

    // Get current max position
    const lastTrack = await prisma.jamTrack.findFirst({
      where: { jamId },
      orderBy: { position: "desc" },
    });

    let currentPosition = lastTrack ? lastTrack.position + 1 : 0;

    // Add to queue in transaction
    const createdJamTracks = await prisma.$transaction(
      idsToAdd.map((id) => {
        const jamTrack = prisma.jamTrack.create({
          data: {
            jamId,
            trackId: id,
            position: currentPosition++,
          },
          include: {
            track: true,
          },
        });
        return jamTrack;
      })
    );

    // If no track is currently playing, set the first one as current
    let updatedJam = null;
    if (!jam.currentTrackId && createdJamTracks.length > 0) {
      updatedJam = await prisma.jam.update({
        where: { id: jamId },
        data: {
          currentTrackId: createdJamTracks[0].trackId,
          isPlaying: true,
        },
        include: {
          currentTrack: true
        }
      });
      
      // Notify about playback start
      // Note: We need a socket instance here or rely on the client to emit after response
      // For now, next-response is fine, user will refresh or socket will handle it
    }

    return NextResponse.json(createdJamTracks);
  } catch (error: any) {
    console.error("[JAM_QUEUE_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

export async function PATCH(
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

    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return new NextResponse("Ordered IDs array is required", { status: 400 });
    }

    // Update positions in a transaction
    await prisma.$transaction(
      orderedIds.map((id, index) => 
        prisma.jamTrack.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return new NextResponse("Queue reordered", { status: 200 });

  } catch (error: any) {
    console.error("[JAM_QUEUE_PATCH]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
