import { prisma } from "@/lib/prisma";

export async function startWorkflow(workflowId: number, clientId: number) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { position: "asc" } } },
  });

  if (!workflow || !workflow.isActive) throw new Error("Workflow not found or inactive");
  if (workflow.steps.length === 0) throw new Error("Workflow has no steps");

  const firstStep = workflow.steps[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + firstStep.delayDays);

  const [run] = await prisma.$transaction([
    prisma.workflowRun.create({
      data: { workflowId, clientId, currentStep: 0, status: "ACTIVE" },
    }),
    prisma.task.create({
      data: {
        clientId,
        title: firstStep.title,
        description: firstStep.description ?? undefined,
        dueDate,
        status: "PENDING",
        taskType: firstStep.taskType ?? "FOLLOW_UP",
        priority: 2,
      },
    }),
  ]);

  return run;
}

export async function advanceWorkflowRun(runId: number) {
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      workflow: {
        include: { steps: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!run) throw new Error("WorkflowRun not found");
  if (run.status !== "ACTIVE") throw new Error("WorkflowRun is not active");

  const steps = run.workflow.steps;
  const nextStepIndex = run.currentStep + 1;

  if (nextStepIndex >= steps.length) {
    // Complete the run
    return await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", currentStep: nextStepIndex },
    });
  }

  const nextStep = steps[nextStepIndex];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + nextStep.delayDays);

  await prisma.$transaction([
    prisma.workflowRun.update({
      where: { id: runId },
      data: { currentStep: nextStepIndex },
    }),
    prisma.task.create({
      data: {
        clientId: run.clientId,
        title: nextStep.title,
        description: nextStep.description ?? undefined,
        dueDate,
        status: "PENDING",
        taskType: nextStep.taskType ?? "FOLLOW_UP",
        priority: 2,
      },
    }),
  ]);

  return await prisma.workflowRun.findUnique({ where: { id: runId } });
}
