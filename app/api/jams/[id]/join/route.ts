import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    // Only allow joining public jams by ID directly
    // Private jams require joining via room code (which uses /api/jams/join)
    if (!jam.isPublic) {
        // Check if already a member
        const existingMember = await prisma.jamMember.findUnique({
            where: {
                jamId_userId: {
                    jamId: jam.id,
                    userId: userId,
                },
            },
        });
        
        if (!existingMember) {
            return new NextResponse("Forbidden: Private Jam", { status: 403 });
        }
        
        return NextResponse.json({ success: true, message: "Already a member" });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[JAM_JOIN_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
