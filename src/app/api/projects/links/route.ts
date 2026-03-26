import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }
    const idList = ids.split(",");

    const links = await prisma.projectLink.findMany({
      where: {
        OR: [
          { fromId: { in: idList } },
          { toId: { in: idList } },
        ],
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Failed to fetch links:", error);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fromId, fromType, toId, toType, description } = await request.json();
    if (!fromId || !toId) {
      return NextResponse.json({ error: "fromId and toId required" }, { status: 400 });
    }

    // Normalize ordering so we don't get duplicate reverse links
    const [a, aType, b, bType] = fromId < toId
      ? [fromId, fromType || "project", toId, toType || "project"]
      : [toId, toType || "project", fromId, fromType || "project"];

    const link = await prisma.projectLink.upsert({
      where: { fromId_toId: { fromId: a, toId: b } },
      update: { description: description || null, fromType: aType, toType: bType },
      create: { fromId: a, fromType: aType, toId: b, toType: bType, description: description || null },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Failed to create link:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, description } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const link = await prisma.projectLink.update({
      where: { id },
      data: { description: description ?? null },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("Failed to update link:", error);
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
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
