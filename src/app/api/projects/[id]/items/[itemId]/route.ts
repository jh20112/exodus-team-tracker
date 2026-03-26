import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const data = await request.json();

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update checklist item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    await prisma.checklistItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete checklist item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
