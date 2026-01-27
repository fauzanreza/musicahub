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
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jam = await prisma.jam.findUnique({
      where: { id: jamId },
    });

    if (!jam) {
      return new NextResponse("Jam not found", { status: 404 });
    }

    // Only current host can promote others
    if (jam.hostId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Check if user is a member
    const member = await prisma.jamMember.findUnique({
      where: {
        jamId_userId: {
          jamId,
          userId,
        },
      },
    });

    if (!member) {
      return new NextResponse("User is not a member of this jam", { status: 404 });
    }

    // Update jam host and member roles
    await prisma.$transaction([
      prisma.jam.update({
        where: { id: jamId },
        data: { hostId: userId },
      }),
      prisma.jamMember.update({
        where: {
          jamId_userId: { jamId, userId: session.user.id },
        },
        data: { role: "LISTENER" },
      }),
      prisma.jamMember.update({
        where: {
          jamId_userId: { jamId, userId },
        },
        data: { role: "HOST" },
      }),
    ]);

    return new NextResponse("Promoted successfully", { status: 200 });
  } catch (error) {
    console.error("[JAM_PROMOTE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
