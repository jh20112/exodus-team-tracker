import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const memberId = request.nextUrl.searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const projects = await prisma.project.findMany({
      where: { memberId },
      include: {
        workstreams: { include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
        linksFrom: true,
        linksTo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { memberId, name, posX, posY } = await request.json();
    if (!memberId || !name) {
      return NextResponse.json({ error: "memberId and name required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        memberId,
        name,
        posX: posX ?? 0.5,
        posY: posY ?? 0.5,
      },
      include: {
        workstreams: { include: { items: true } },
        linksFrom: true,
        linksTo: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
