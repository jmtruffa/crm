import { prisma } from "@/lib/prisma";
import { calculateScore } from "./scoring";

export async function recalculateAndSaveScore(clientId: number): Promise<number> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      lastInteractionAt: true,
      lastOperationAt: true,
      aumCurrent: true,
      sourceChannel: true,
    },
  });

  if (!client) throw new Error(`Client ${clientId} not found`);

  const { score, explain } = calculateScore(client);

  await prisma.contactScore.create({
    data: {
      clientId,
      score,
      explain: JSON.stringify(explain),
    },
  });

  return score;
}
