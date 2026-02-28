import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  const interactions = await prisma.interaction.findMany({
    where: clientId ? { clientId: Number(clientId) } : {},
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      followUpTask: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(interactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { followUpDate, followUpTitle, ...interactionData } = body;

  const interaction = await prisma.interaction.create({
    data: {
      ...interactionData,
      date: new Date(interactionData.date),
      ...(followUpDate
        ? {
            followUpTask: {
              create: {
                clientId: interactionData.clientId,
                title: followUpTitle || "Seguimiento",
                dueDate: new Date(followUpDate),
                status: "PENDING",
              },
            },
          }
        : {}),
    },
    include: { followUpTask: true },
  });

  return NextResponse.json(interaction, { status: 201 });
}
