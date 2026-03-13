import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateAndSaveScore } from "@/lib/commercial/score-service";

// datetime-local sends "YYYY-MM-DDTHH:MM" with no timezone; treat it as UTC-3 (Buenos Aires)
function parseBsAsDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return new Date(value + ":00-03:00");
  }
  return new Date(value);
}

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

  const interaction = await prisma.$transaction(async (tx) => {
    const created = await tx.interaction.create({
      data: {
        ...interactionData,
        date: parseBsAsDate(interactionData.date),
        ...(followUpDate
          ? {
              followUpTask: {
                create: {
                  clientId: interactionData.clientId,
                  title: followUpTitle || "Seguimiento",
                  dueDate: new Date(followUpDate),
                  status: "PENDING",
                  taskType: "FOLLOW_UP",
                },
              },
            }
          : {}),
      },
      include: { followUpTask: true },
    });

    // Update lastInteractionAt on the client
    await tx.client.update({
      where: { id: interactionData.clientId },
      data: { lastInteractionAt: parseBsAsDate(interactionData.date) },
    });

    return created;
  });

  // Recalculate score outside the transaction (non-critical)
  try {
    await recalculateAndSaveScore(interactionData.clientId);
  } catch {
    // Score recalculation failure is non-blocking
  }

  return NextResponse.json(interaction, { status: 201 });
}
