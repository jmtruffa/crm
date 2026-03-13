import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const triggers = await prisma.trigger.findMany({
    include: {
      _count: { select: { firings: true } },
      firings: {
        orderBy: { firedAt: "desc" },
        take: 5,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(triggers);
}
