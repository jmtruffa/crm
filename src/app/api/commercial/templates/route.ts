import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.template.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const template = await prisma.template.create({
    data: {
      name: body.name,
      subject: body.subject ?? null,
      body: body.body,
      variables: body.variables ? JSON.stringify(body.variables) : null,
    },
  });
  return NextResponse.json(template, { status: 201 });
}
