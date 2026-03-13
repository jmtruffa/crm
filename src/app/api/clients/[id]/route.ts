import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateAndSaveScore } from "@/lib/commercial/score-service";

const DATE_FIELDS = ["dob", "lastOperationAt", "lastFundingAt", "lastInteractionAt"] as const;

function parseDateFields(body: Record<string, unknown>) {
  const out = { ...body };
  for (const field of DATE_FIELDS) {
    const val = out[field];
    if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      out[field] = new Date(`${val}T12:00:00.000Z`);
    } else if (val === "" || val === null) {
      out[field] = undefined;
    }
  }
  return out;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      brokerAccounts: { include: { broker: true } },
      interactions: { orderBy: { date: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
      pipelineMemberships: { include: { stage: { include: { pipeline: true } } } },
      contactScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const prev = await prisma.client.findUnique({
    where: { id: Number(id) },
    select: { aumCurrent: true },
  });

  const client = await prisma.client.update({
    where: { id: Number(id) },
    data: parseDateFields(body) as Parameters<typeof prisma.client.update>[0]["data"],
  });

  // Recalculate score if AUM changed
  const aumChanged = prev && prev.aumCurrent !== client.aumCurrent;
  if (aumChanged || body.sourceChannel !== undefined || body.lastOperationAt !== undefined) {
    try {
      await recalculateAndSaveScore(Number(id));
    } catch {
      // Non-blocking
    }
  }

  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.client.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
