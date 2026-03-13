import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/commercial/pipeline/[id]/members — list members of a pipeline
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const stages = await prisma.pipelineStage.findMany({
    where: { pipelineId: Number(id) },
    orderBy: { position: "asc" },
    include: {
      memberships: {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
              aumCurrent: true,
              commercialSubstate: true,
            },
          },
        },
      },
    },
  });
  return NextResponse.json(stages);
}

// POST /api/commercial/pipeline/[id]/members — add or move a client to a stage
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { clientId, stageId } = body;

  // Verify stage belongs to this pipeline
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: Number(stageId), pipelineId: Number(id) },
  });
  if (!stage) return NextResponse.json({ error: "Stage not found in pipeline" }, { status: 404 });

  // Get current membership for history
  const existing = await prisma.pipelineMembership.findUnique({
    where: { clientId: Number(clientId) },
    select: { stageId: true },
  });

  const [membership] = await prisma.$transaction([
    prisma.pipelineMembership.upsert({
      where: { clientId: Number(clientId) },
      create: { clientId: Number(clientId), stageId: Number(stageId) },
      update: { stageId: Number(stageId) },
    }),
    prisma.pipelineStageHistory.create({
      data: {
        clientId: Number(clientId),
        fromStageId: existing?.stageId ?? null,
        toStageId: Number(stageId),
      },
    }),
  ]);

  return NextResponse.json(membership, { status: 201 });
}
