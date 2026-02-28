import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const interaction = await prisma.interaction.update({
    where: { id: Number(id) },
    data: {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    },
  });
  return NextResponse.json(interaction);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.interaction.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
