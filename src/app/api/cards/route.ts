import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const memberId = searchParams.get("memberId");
  const weekStart = searchParams.get("weekStart");

  // Get specific card by memberId + weekStart
  if (memberId && weekStart) {
    const card = await prisma.weeklyCard.findUnique({
      where: {
        memberId_weekStart: {
          memberId,
          weekStart: new Date(weekStart),
        },
      },
      include: { member: true },
    });
    return NextResponse.json(card);
  }

  // Get all cards for a month
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);
    // Extend range to cover week starts that fall before the month
    const extendedStart = new Date(start);
    extendedStart.setDate(extendedStart.getDate() - 7);

    const cards = await prisma.weeklyCard.findMany({
      where: {
        weekStart: {
          gte: extendedStart,
          lte: end,
        },
      },
      include: { member: true },
    });
    return NextResponse.json(cards);
  }

  return NextResponse.json({ error: "Provide month or memberId+weekStart" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { memberId, weekStart, ...data } = body;

  if (!memberId || !weekStart) {
    return NextResponse.json({ error: "memberId and weekStart required" }, { status: 400 });
  }

  const card = await prisma.weeklyCard.upsert({
    where: {
      memberId_weekStart: {
        memberId,
        weekStart: new Date(weekStart),
      },
    },
    update: data,
    create: {
      memberId,
      weekStart: new Date(weekStart),
      ...data,
    },
    include: { member: true },
  });

  return NextResponse.json(card);
}
