import { NextRequest, NextResponse } from "next/server";
import { evaluateAllActiveClients } from "@/lib/commercial/triggers";
import { getTodayActions } from "@/lib/commercial/today-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runTriggers = searchParams.get("triggers") === "true";

  // Lazy trigger evaluation if requested
  if (runTriggers) {
    try {
      await evaluateAllActiveClients();
    } catch {
      // Non-blocking
    }
  }

  const actions = await getTodayActions(50);
  return NextResponse.json(actions);
}
