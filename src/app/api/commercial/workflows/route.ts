import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workflows = await prisma.workflow.findMany({
    include: {
      steps: { orderBy: { position: "asc" } },
      _count: { select: { runs: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(workflows);
}
