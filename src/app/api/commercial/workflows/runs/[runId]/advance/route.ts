import { NextRequest, NextResponse } from "next/server";
import { advanceWorkflowRun } from "@/lib/commercial/workflows";

type Params = { params: Promise<{ runId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { runId } = await params;
  const run = await advanceWorkflowRun(Number(runId));
  return NextResponse.json(run);
}
