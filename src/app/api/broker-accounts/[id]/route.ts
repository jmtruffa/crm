import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const account = await prisma.brokerAccount.update({
    where: { id: Number(id) },
    data: body,
    include: { broker: true },
  });
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.brokerAccount.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
