import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      brokerAccounts: { include: { broker: true } },
      interactions: { orderBy: { date: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const client = await prisma.client.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.client.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
