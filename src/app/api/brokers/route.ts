import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const brokers = await prisma.broker.findMany({
    include: { _count: { select: { accounts: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(brokers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const broker = await prisma.broker.create({ data: body });
  return NextResponse.json(broker, { status: 201 });
}
