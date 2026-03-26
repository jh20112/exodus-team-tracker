import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const maxOrder = await prisma.checklistItem.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });

    const item = await prisma.checklistItem.create({
      data: {
        projectId,
        text,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to create checklist item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
