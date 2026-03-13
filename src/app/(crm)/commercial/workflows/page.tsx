import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StartWorkflowButton } from "@/components/start-workflow-button";
import { AdvanceWorkflowButton } from "@/components/advance-workflow-button";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const [workflows, activeRuns, clients] = await Promise.all([
    prisma.workflow.findMany({
      include: { steps: { orderBy: { position: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.workflowRun.findMany({
      where: { status: "ACTIVE" },
      include: {
        workflow: { include: { steps: { orderBy: { position: "asc" } } } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.client.findMany({
      where: { status: { in: ["ACTIVE", "PROSPECT"] } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground">
          Secuencias automáticas de seguimiento por cliente
        </p>
      </div>

      {/* Active runs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Runs activos
          <Badge variant="secondary" className="ml-2">{activeRuns.length}</Badge>
        </h2>
        {activeRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay workflows en curso</p>
        ) : (
          <div className="space-y-2">
            {activeRuns.map((run) => {
              const currentStep = run.workflow.steps[run.currentStep];
              const progress = `${run.currentStep + 1} / ${run.workflow.steps.length}`;
              return (
                <Card key={run.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/clients/${run.client.id}`} className="font-medium text-sm hover:underline">
                          {run.client.lastName}, {run.client.firstName}
                        </Link>
                        <Badge variant="outline" className="text-xs">{run.workflow.name}</Badge>
                        <Badge variant="secondary" className="text-xs">{progress}</Badge>
                      </div>
                      {currentStep && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Paso actual: {currentStep.title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Iniciado {format(run.startedAt, "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                    <AdvanceWorkflowButton runId={run.id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Workflow definitions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Workflows disponibles</h2>
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No hay workflows configurados.</p>
              <p className="text-sm mt-1">
                Ejecutá:{" "}
                <code className="font-mono bg-muted px-1 rounded text-xs">
                  npx tsx scripts/seed-workflows.ts
                </code>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{workflow.name}</CardTitle>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
                      )}
                    </div>
                    <StartWorkflowButton workflowId={workflow.id} clients={clients} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {workflow.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                          {i + 1}
                        </span>
                        <span>{step.title}</span>
                        {step.delayDays > 0 && (
                          <span className="text-xs opacity-60">(+{step.delayDays}d)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
