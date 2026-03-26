import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wsId: string }> }
) {
  try {
    const { wsId } = await params;
    const data = await request.json();

    const workstream = await prisma.workstream.update({
      where: { id: wsId },
      data,
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(workstream);
  } catch (error) {
    console.error("Failed to update workstream:", error);
    return NextResponse.json({ error: "Failed to update workstream" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ wsId: string }> }
) {
  try {
    const { wsId } = await params;
    await prisma.workstream.delete({ where: { id: wsId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete workstream:", error);
    return NextResponse.json({ error: "Failed to delete workstream" }, { status: 500 });
  }
}
