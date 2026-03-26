import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { fromId, toId, description } = await request.json();
    if (!fromId || !toId) {
      return NextResponse.json({ error: "fromId and toId required" }, { status: 400 });
    }

    // Normalize ordering so we don't get duplicate reverse links
    const [a, b] = fromId < toId ? [fromId, toId] : [toId, fromId];

    const link = await prisma.projectLink.upsert({
      where: { fromId_toId: { fromId: a, toId: b } },
      update: { description: description || null },
      create: { fromId: a, toId: b, description: description || null },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Failed to create link:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.projectLink.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete link:", error);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
