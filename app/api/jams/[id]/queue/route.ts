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

    // Get current max position
    const lastTrack = await prisma.jamTrack.findFirst({
      where: { jamId },
      orderBy: { position: "desc" },
    });

    const position = lastTrack ? lastTrack.position + 1 : 0;

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

    return NextResponse.json(jamTrack);
  } catch (error) {
    console.error("[JAM_QUEUE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
