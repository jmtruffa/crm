import { NextResponse } from "next/server";
import { evaluateAllActiveClients } from "@/lib/commercial/triggers";

export async function POST() {
  const result = await evaluateAllActiveClients();
  return NextResponse.json(result);
}
