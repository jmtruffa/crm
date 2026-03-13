import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/score-badge";
import { PipelineStageSelector } from "@/components/pipeline-stage-selector";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        orderBy: { position: "asc" },
        include: {
          memberships: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  status: true,
                  aumCurrent: true,
                  commercialSubstate: true,
                  contactScores: {
                    orderBy: { calculatedAt: "desc" },
                    take: 1,
                    select: { score: true, explain: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (pipelines.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">No hay pipelines configurados</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Ejecutá el seed para crear el pipeline por defecto:{" "}
          <code className="font-mono bg-muted px-1 rounded">npx ts-node scripts/seed-triggers.ts</code>
        </p>
      </div>
    );
  }

  const pipeline = pipelines[0];
  const allStages = pipeline.stages;

  // Count clients without a pipeline membership
  const totalClientsInPipeline = pipeline.stages.reduce(
    (sum, s) => sum + s.memberships.length,
    0
  );

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pipeline.name}</h1>
            <p className="text-muted-foreground">
              {totalClientsInPipeline} clientes en el pipeline
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/clients">Ver todos los clientes</Link>
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages.map((stage) => (
            <div key={stage.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">{stage.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {stage.memberships.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {stage.memberships.length === 0 ? (
                  <div className="border-2 border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
                    Sin clientes
                  </div>
                ) : (
                  stage.memberships.map(({ client }) => {
                    const score = client.contactScores[0] ?? null;
                    const explain = score?.explain ? JSON.parse(score.explain) : null;
                    return (
                      <Card key={client.id} className="p-0">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm font-medium flex items-center justify-between">
                            <Link
                              href={`/clients/${client.id}`}
                              className="hover:underline"
                            >
                              {client.lastName}, {client.firstName}
                            </Link>
                            <ScoreBadge score={score?.score ?? null} explain={explain} />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 space-y-2">
                          {client.aumCurrent !== null && (
                            <p className="text-xs text-muted-foreground">
                              AUM: USD {client.aumCurrent.toLocaleString("es-AR")}
                            </p>
                          )}
                          <PipelineStageSelector
                            clientId={client.id}
                            pipelineId={pipeline.id}
                            currentStageId={stage.id}
                            stages={allStages.map((s) => ({ id: s.id, name: s.name }))}
                          />
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}
