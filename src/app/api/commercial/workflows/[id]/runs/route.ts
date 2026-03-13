import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startWorkflow } from "@/lib/commercial/workflows";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: Number(id) },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json(runs);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const run = await startWorkflow(Number(id), Number(body.clientId));
  return NextResponse.json(run, { status: 201 });
}
