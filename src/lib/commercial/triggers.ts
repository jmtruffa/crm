import { prisma } from "@/lib/prisma";

const DEDUP_DAYS = 7;

type EvalResult = {
  triggerId: number;
  triggerCode: string;
  firingId: number;
  taskId: number;
};

export async function evaluateTriggers(clientId: number): Promise<EvalResult[]> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      firstName: true,
      lastInteractionAt: true,
      lastOperationAt: true,
      lastFundingAt: true,
      createdAt: true,
      status: true,
    },
  });

  if (!client || client.status === "SUSPENDED") return [];

  const triggers = await prisma.trigger.findMany({ where: { isActive: true } });
  const now = new Date();
  const results: EvalResult[] = [];

  for (const trigger of triggers) {
    const conditionMet = checkCondition(trigger, client, now);
    if (!conditionMet) continue;

    // Dedup: skip if already fired for this client+trigger within DEDUP_DAYS
    const cutoff = new Date(now.getTime() - DEDUP_DAYS * 24 * 60 * 60 * 1000);
    const recentFiring = await prisma.triggerFiring.findFirst({
      where: {
        triggerId: trigger.id,
        clientId,
        firedAt: { gte: cutoff },
      },
    });
    if (recentFiring) continue;

    // Create firing + task in transaction
    const result = await prisma.$transaction(async (tx) => {
      const firing = await tx.triggerFiring.create({
        data: { triggerId: trigger.id, clientId },
      });

      const task = await tx.task.create({
        data: {
          clientId,
          title: trigger.name,
          description: trigger.description ?? undefined,
          dueDate: now,
          status: "PENDING",
          taskType: "FOLLOW_UP",
          priority: 1,
          triggerFiringId: firing.id,
          aiSuggestion: `Trigger automático: ${trigger.name}`,
        },
      });

      return { triggerId: trigger.id, triggerCode: trigger.code, firingId: firing.id, taskId: task.id };
    });

    results.push(result);
  }

  return results;
}

type TriggerConditionClient = {
  lastInteractionAt: Date | null;
  lastOperationAt: Date | null;
  lastFundingAt: Date | null;
  createdAt: Date;
};

function checkCondition(
  trigger: { conditionType: string; conditionDays: number | null },
  client: TriggerConditionClient,
  now: Date
): boolean {
  const days = trigger.conditionDays ?? 30;
  const msThreshold = days * 24 * 60 * 60 * 1000;

  switch (trigger.conditionType) {
    case "NO_OP_DAYS": {
      if (!client.lastOperationAt) return true;
      return now.getTime() - client.lastOperationAt.getTime() >= msThreshold;
    }
    case "NO_FUND_DAYS": {
      if (!client.lastFundingAt) return true;
      return now.getTime() - client.lastFundingAt.getTime() >= msThreshold;
    }
    case "NO_CONTACT_DAYS": {
      if (!client.lastInteractionAt) return true;
      return now.getTime() - client.lastInteractionAt.getTime() >= msThreshold;
    }
    case "ANNIVERSARY_MONTHS": {
      const months = days; // conditionDays used as months here
      const anniversaryMs = months * 30 * 24 * 60 * 60 * 1000;
      return now.getTime() - client.createdAt.getTime() >= anniversaryMs;
    }
    case "CONTENT_ENGAGED": {
      // Manual trigger — never auto-fires
      return false;
    }
    default:
      return false;
  }
}

export async function evaluateAllActiveClients(): Promise<{
  processed: number;
  fired: number;
  tasksCreated: number;
}> {
  const clients = await prisma.client.findMany({
    where: { status: { in: ["ACTIVE", "PROSPECT", "INACTIVE"] } },
    select: { id: true },
  });

  let fired = 0;
  let tasksCreated = 0;

  for (const { id } of clients) {
    const results = await evaluateTriggers(id);
    fired += results.length;
    tasksCreated += results.length;
  }

  return { processed: clients.length, fired, tasksCreated };
}
