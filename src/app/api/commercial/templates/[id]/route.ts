import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id: Number(id) } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const template = await prisma.template.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      subject: body.subject ?? null,
      body: body.body,
      variables: body.variables ? JSON.stringify(body.variables) : null,
    },
  });
  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.template.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
