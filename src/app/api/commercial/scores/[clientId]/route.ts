import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateAndSaveScore } from "@/lib/commercial/score-service";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const scores = await prisma.contactScore.findMany({
    where: { clientId: Number(clientId) },
    orderBy: { calculatedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(
    scores.map((s) => ({
      ...s,
      explain: JSON.parse(s.explain),
    }))
  );
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const score = await recalculateAndSaveScore(Number(clientId));
  return NextResponse.json({ score });
}
