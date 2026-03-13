import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const referrals = await prisma.referral.findMany({
    include: {
      referrer: { select: { id: true, firstName: true, lastName: true } },
      referred: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(referrals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const referral = await prisma.referral.create({
    data: {
      referrerId: Number(body.referrerId),
      referredId: Number(body.referredId),
      notes: body.notes ?? null,
    },
    include: {
      referrer: { select: { id: true, firstName: true, lastName: true } },
      referred: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(referral, { status: 201 });
}
