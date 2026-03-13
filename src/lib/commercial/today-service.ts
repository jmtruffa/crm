import { prisma } from "@/lib/prisma";

export type TodayAction = {
  task: {
    id: number;
    title: string;
    description: string | null;
    dueDate: Date;
    priority: number;
    taskType: string | null;
    triggerFiringId: number | null;
  };
  client: {
    id: number;
    firstName: string;
    lastName: string;
    aumCurrent: number | null;
  };
  score: number | null;
};

export async function getTodayActions(limit = 50): Promise<TodayAction[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      status: "PENDING",
      dueDate: { lte: today },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          aumCurrent: true,
          contactScores: {
            orderBy: { calculatedAt: "desc" },
            take: 1,
            select: { score: true },
          },
        },
      },
    },
    take: limit,
  });

  // Sort: priority ASC, score DESC, aumCurrent DESC, dueDate ASC
  const sorted = tasks.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;

    const scoreA = a.client.contactScores[0]?.score ?? 0;
    const scoreB = b.client.contactScores[0]?.score ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;

    const aumA = a.client.aumCurrent ?? 0;
    const aumB = b.client.aumCurrent ?? 0;
    if (aumA !== aumB) return aumB - aumA;

    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return sorted.map((task) => ({
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      taskType: task.taskType,
      triggerFiringId: task.triggerFiringId,
    },
    client: {
      id: task.client.id,
      firstName: task.client.firstName,
      lastName: task.client.lastName,
      aumCurrent: task.client.aumCurrent,
    },
    score: task.client.contactScores[0]?.score ?? null,
  }));
}
