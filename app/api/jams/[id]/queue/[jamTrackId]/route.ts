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

    // Only host can remove from queue
    if (jam.hostId !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // If jamTrackId is actually a trackId, we might need to find the specific JamTrack entry
    // But ideally it should be the JamTrack ID. 
    // Let's first try to delete as if it is a JamTrack ID (which is a CUID)
    
    // Check if it exists
    const jamTrack = await prisma.jamTrack.findUnique({
      where: { id: jamTrackId },
    });

    if (jamTrack) {
        if (jamTrack.jamId !== jamId) {
             return new NextResponse("Track not in this jam", { status: 400 });
        }
        await prisma.jamTrack.delete({
            where: { id: jamTrackId },
        });
        return new NextResponse("Track removed", { status: 200 });
    } 
    
    // If not found by Primary ID, maybe the user sent a Track ID?
    // In that case, we delete the *first* playing instance of that track in this jam?
    // Or we strictly enforce JamTrack ID. Strict is better for API design.
    // However, if the frontend currently only knows Track IDs, we need a fallback.
    
    const jamTrackByTrackId = await prisma.jamTrack.findFirst({
        where: { jamId, trackId: jamTrackId },
        orderBy: { position: 'asc' } // Remove the first occurrence
    });

    if (jamTrackByTrackId) {
        await prisma.jamTrack.delete({
            where: { id: jamTrackByTrackId.id }
        });
        return new NextResponse("Track removed (by TrackID)", { status: 200 });
    }

    return new NextResponse("Track not found in queue", { status: 404 });

  } catch (error: any) {
    console.error("[JAM_QUEUE_DELETE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
