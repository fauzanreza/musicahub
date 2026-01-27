import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { roomCode } = body;

    if (!roomCode) {
      return new NextResponse("Room code is required", { status: 400 });
    }

    const jam = await prisma.jam.findUnique({
      where: {
        roomCode: roomCode.toUpperCase(),
      },
    });

    if (!jam) {
      return new NextResponse("Invalid room code", { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.jamMember.findUnique({
      where: {
        jamId_userId: {
          jamId: jam.id,
          userId: userId,
        },
      },
    });

    if (!existingMember) {
      await prisma.jamMember.create({
        data: {
          jamId: jam.id,
          userId: userId,
          role: "LISTENER",
        },
      });
    }

    return NextResponse.json({ jamId: jam.id });
  } catch (error) {
    console.error("[JAMS_JOIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
