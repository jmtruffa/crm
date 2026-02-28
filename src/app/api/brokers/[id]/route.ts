import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const broker = await prisma.broker.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(broker);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.broker.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
