import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Return latest score per client
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      contactScores: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
        select: { score: true, explain: true, calculatedAt: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const result = clients.map((c) => ({
    clientId: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    score: c.contactScores[0]?.score ?? null,
    explain: c.contactScores[0]?.explain
      ? JSON.parse(c.contactScores[0].explain)
      : null,
    calculatedAt: c.contactScores[0]?.calculatedAt ?? null,
  }));

  return NextResponse.json(result);
}
