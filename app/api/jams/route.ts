import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// GET /api/jams - List public jams
export async function GET() {
  try {
    const jams = await prisma.jam.findMany({
      where: {
        isPublic: true,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        currentTrack: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jams);
  } catch (error) {
    console.error("[JAMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/jams - Create a new jam
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, isPublic } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    let roomCode = null;
    if (!isPublic) {
      // Generate unique 6-digit alphanumeric code
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Ensure uniqueness
      let isUnique = false;
      while (!isUnique) {
        const existing = await prisma.jam.findUnique({
          where: { roomCode },
        });
        if (!existing) {
          isUnique = true;
        } else {
          roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
      }
    }

    const jam = await prisma.jam.create({
      data: {
        name,
        isPublic,
        roomCode,
        hostId: userId,
        members: {
          create: {
            userId: userId,
            role: "HOST",
          },
        },
      },
    });

    return NextResponse.json(jam);
  } catch (error) {
    console.error("[JAMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
