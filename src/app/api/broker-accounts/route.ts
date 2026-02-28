import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const account = await prisma.brokerAccount.create({
    data: body,
    include: { broker: true },
  });
  return NextResponse.json(account, { status: 201 });
}
