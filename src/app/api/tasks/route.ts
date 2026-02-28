import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const tasks = await prisma.task.findMany({
    where: {
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const task = await prisma.task.create({
    data: {
      ...body,
      dueDate: new Date(body.dueDate),
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}
