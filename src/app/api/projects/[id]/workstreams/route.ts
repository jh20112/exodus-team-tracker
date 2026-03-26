import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const maxOrder = await prisma.workstream.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });

    const workstream = await prisma.workstream.create({
      data: {
        projectId,
        name,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: { items: true },
    });

    return NextResponse.json(workstream);
  } catch (error) {
    console.error("Failed to create workstream:", error);
    return NextResponse.json({ error: "Failed to create workstream" }, { status: 500 });
  }
}
