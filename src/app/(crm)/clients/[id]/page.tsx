import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Pencil, Phone, Mail, MapPin, FileText, Building2, Briefcase, Cake,
  ChevronLeft, ChevronRight, TrendingUp, DollarSign,
} from "lucide-react";
import {
  CLIENT_STATUS, RISK_PROFILE, INTERACTION_TYPE,
  COMMERCIAL_SUBSTATE, SOURCE_CHANNEL, OBJECTION_CODE,
} from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const bsAs = (d: Date) => new Date(d.getTime() - 3 * 60 * 60 * 1000);
import { InteractionDialog } from "@/components/interaction-dialog";
import { TaskDialog } from "@/components/task-dialog";
import { BrokerAccountDialog } from "@/components/broker-account-dialog";
import { DeleteClientButton } from "@/components/delete-client-button";
import { CompleteTaskButton } from "@/components/complete-task-button";
import { MarkdownDisplay } from "@/components/markdown-display";
import { ScoreBadge } from "@/components/score-badge";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  PROSPECT: "secondary",
  INACTIVE: "outline",
  SUSPENDED: "destructive",
};

const statusClass: Record<string, string> = {
  ACTIVE: "bg-emerald-500 hover:bg-emerald-500/90 text-white border-transparent",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      brokerAccounts: { include: { broker: true }, orderBy: { createdAt: "asc" } },
      interactions: {
        orderBy: { date: "desc" },
        include: { followUpTask: true },
      },
      tasks: { orderBy: { dueDate: "asc" } },
      pipelineMemberships: { include: { stage: { include: { pipeline: true } } } },
      contactScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
    },
  });

  if (!client) notFound();

  const pendingTasks = client.tasks.filter((t) => t.status === "PENDING");
  const completedTasks = client.tasks.filter((t) => t.status !== "PENDING");
  const brokers = await prisma.broker.findMany({ orderBy: { name: "asc" } });
  const latestScore = client.contactScores[0] ?? null;
  const scoreExplain = latestScore ? JSON.parse(latestScore.explain) : null;

  // Prev/next navigation when coming from a filtered list
  let prevClient: { id: number; firstName: string; lastName: string } | null = null;
  let nextClient: { id: number; firstName: string; lastName: string } | null = null;
  let position: number | null = null;
  let total: number | null = null;

  if (from) {
    const fromStatuses = from.split(",").filter(Boolean);
    const siblings = await prisma.client.findMany({
      where: fromStatuses.length === 1
        ? { status: fromStatuses[0] }
        : { status: { in: fromStatuses } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    });
    const idx = siblings.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      position = idx + 1;
      total = siblings.length;
      prevClient = idx > 0 ? siblings[idx - 1] : null;
      nextClient = idx < siblings.length - 1 ? siblings[idx + 1] : null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Prev/next navigation bar */}
      {from && (
        <div className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
          <div className="flex-1">
            {prevClient ? (
              <Link
                href={`/clients/${prevClient.id}?from=${from}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {prevClient.lastName}, {prevClient.firstName}
              </Link>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
          <div className="text-muted-foreground text-xs px-4 flex items-center gap-2">
            <Link href={`/clients?status=${encodeURIComponent(from)}`} className="hover:underline">
              {from.includes(",")
                ? "Pipeline"
                : (CLIENT_STATUS[from as keyof typeof CLIENT_STATUS] ?? from)}
            </Link>
            {position && total && <span>· {position} de {total}</span>}
          </div>
          <div className="flex-1 flex justify-end">
            {nextClient ? (
              <Link
                href={`/clients/${nextClient.id}?from=${from}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {nextClient.lastName}, {nextClient.firstName}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {client.firstName} {client.lastName}
            </h1>
            <Badge
              variant={statusVariant[client.status] ?? "outline"}
              className={statusClass[client.status]}
            >
              {CLIENT_STATUS[client.status as keyof typeof CLIENT_STATUS] ?? client.status}
            </Badge>
            {client.riskProfile && (
              <Badge variant="outline">
                {RISK_PROFILE[client.riskProfile as keyof typeof RISK_PROFILE]}
              </Badge>
            )}
            {latestScore && (
              <ScoreBadge score={latestScore.score} explain={scoreExplain} />
            )}
          </div>
          {client.origin && (
            <p className="text-sm text-muted-foreground mt-1">Origen: {client.origin}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <DeleteClientButton clientId={client.id} clientName={`${client.firstName} ${client.lastName}`} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Datos de contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.company && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{client.company}</span>
              </div>
            )}
            {client.dob && (
              <div className="flex items-center gap-2">
                <Cake className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{format(client.dob, "d 'de' MMMM yyyy", { locale: es })}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${client.email}`} className="hover:underline truncate">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${client.phone}`} className="hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {(client.street || client.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  {client.street && (
                    <div>
                      {client.street} {client.streetNumber}
                      {client.apt && `, ${client.apt}`}
                    </div>
                  )}
                  {client.city && (
                    <div className="text-muted-foreground">
                      {client.city}
                      {client.postalCode && ` (${client.postalCode})`}
                    </div>
                  )}
                  {client.country && (
                    <div className="text-muted-foreground">{client.country}</div>
                  )}
                </div>
              </div>
            )}
            {(client.document || client.cuit) && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  {client.document && <div>DNI: {client.document}</div>}
                  {client.cuit && <div>CUIT: {client.cuit}</div>}
                </div>
              </div>
            )}
            {!client.company && !client.dob && !client.email && !client.phone && !client.street && !client.document && (
              <p className="text-muted-foreground">Sin datos de contacto</p>
            )}
          </CardContent>
        </Card>

        {/* Datos Comerciales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Datos Comerciales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {client.commercialSubstate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subestado</span>
                <span>{COMMERCIAL_SUBSTATE[client.commercialSubstate as keyof typeof COMMERCIAL_SUBSTATE] ?? client.commercialSubstate}</span>
              </div>
            )}
            {client.sourceChannel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal</span>
                <span>{SOURCE_CHANNEL[client.sourceChannel as keyof typeof SOURCE_CHANNEL] ?? client.sourceChannel}</span>
              </div>
            )}
            {client.aumCurrent !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">AUM actual</span>
                <span className="font-medium">
                  USD {client.aumCurrent.toLocaleString("es-AR")}
                </span>
              </div>
            )}
            {client.aumEstimated !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">AUM estimado</span>
                <span>USD {client.aumEstimated.toLocaleString("es-AR")}</span>
              </div>
            )}
            {client.lastOperationAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última operación</span>
                <span>{format(client.lastOperationAt, "d MMM yyyy", { locale: es })}</span>
              </div>
            )}
            {client.lastFundingAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última acreditación</span>
                <span>{format(client.lastFundingAt, "d MMM yyyy", { locale: es })}</span>
              </div>
            )}
            {client.lastInteractionAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último contacto</span>
                <span>{format(client.lastInteractionAt, "d MMM yyyy", { locale: es })}</span>
              </div>
            )}
            {client.objectionCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Objeción</span>
                <span>{OBJECTION_CODE[client.objectionCode as keyof typeof OBJECTION_CODE] ?? client.objectionCode}</span>
              </div>
            )}
            {client.pipelineMemberships[0] && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pipeline</span>
                <span className="font-medium">{client.pipelineMemberships[0].stage.name}</span>
              </div>
            )}
            {!client.commercialSubstate && !client.aumCurrent && !client.sourceChannel && (
              <p className="text-muted-foreground">Sin datos comerciales</p>
            )}
          </CardContent>
        </Card>

        {/* Score comercial */}
        {latestScore && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Score Comercial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <ScoreBadge score={latestScore.score} explain={scoreExplain} />
                <span className="text-muted-foreground text-xs">
                  Calculado {format(latestScore.calculatedAt, "d MMM HH:mm", { locale: es })}
                </span>
              </div>
              {scoreExplain && (
                <div className="space-y-1 mt-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base</span>
                    <span>{scoreExplain.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interacción</span>
                    <span className={scoreExplain.interactionPenalty < 0 ? "text-red-500" : "text-green-500"}>
                      {scoreExplain.interactionPenalty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operación</span>
                    <span className={scoreExplain.operationPenalty < 0 ? "text-red-500" : "text-green-500"}>
                      {scoreExplain.operationPenalty}
                    </span>
                  </div>
                  {scoreExplain.aumBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AUM bonus</span>
                      <span className="text-green-500">+{scoreExplain.aumBonus}</span>
                    </div>
                  )}
                  {scoreExplain.referralBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Referido</span>
                      <span className="text-green-500">+{scoreExplain.referralBonus}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cuentas en brokers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cuentas en Brokers
            </CardTitle>
            <BrokerAccountDialog clientId={client.id} brokers={brokers} />
          </CardHeader>
          <CardContent className="space-y-2">
            {client.brokerAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuentas registradas</p>
            ) : (
              client.brokerAccounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{acc.broker.name}</div>
                    {acc.accountNumber && (
                      <div className="text-xs text-muted-foreground">N°: {acc.accountNumber}</div>
                    )}
                    {acc.notes && (
                      <div className="text-xs text-muted-foreground">{acc.notes}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        {client.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Tareas pendientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Tareas Pendientes
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingTasks.length}</Badge>
            )}
          </h2>
          <TaskDialog clientId={client.id} />
        </div>
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas pendientes</p>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{task.title}</div>
                    {task.priority <= 2 && (
                      <Badge variant="destructive" className="text-xs">P{task.priority}</Badge>
                    )}
                  </div>
                  {task.description && (
                    <div className="text-muted-foreground mt-0.5">{task.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Vence: {format(task.dueDate, "d 'de' MMMM yyyy", { locale: es })}
                    {task.taskType && <span className="ml-2 capitalize">{task.taskType.toLowerCase().replace("_", " ")}</span>}
                  </div>
                </div>
                <CompleteTaskButton taskId={task.id} currentStatus="PENDING" />
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Interacciones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Interacciones</h2>
          <InteractionDialog clientId={client.id} />
        </div>
        {client.interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
        ) : (
          <div className="space-y-3">
            {client.interactions.map((interaction) => (
              <div key={interaction.id} className="rounded-md border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {INTERACTION_TYPE[interaction.type as keyof typeof INTERACTION_TYPE] ?? interaction.type}
                    </Badge>
                    <span className="text-sm font-medium">
                      {format(bsAs(interaction.date), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </span>
                    {interaction.duration && (
                      <span className="text-xs text-muted-foreground">
                        ({interaction.duration} min)
                      </span>
                    )}
                    {interaction.direction && (
                      <Badge variant="secondary" className="text-xs">
                        {interaction.direction === "INBOUND" ? "Entrante" : "Saliente"}
                      </Badge>
                    )}
                  </div>
                </div>
                {interaction.subject && (
                  <p className="text-sm font-medium text-muted-foreground">{interaction.subject}</p>
                )}
                <MarkdownDisplay content={interaction.notes} />
                {interaction.followUpTask && (
                  <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1 inline-flex items-center gap-1">
                    Seguimiento: {interaction.followUpTask.title} —{" "}
                    {format(interaction.followUpTask.dueDate, "d MMM", { locale: es })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tareas completadas (colapsadas) */}
      {completedTasks.length > 0 && (
        <>
          <Separator />
          <details className="space-y-2">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Ver tareas completadas/canceladas ({completedTasks.length})
            </summary>
            <div className="space-y-2 mt-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-md border p-3 text-sm opacity-70"
                >
                  <div>
                    <div className="font-medium line-through">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(task.dueDate, "d 'de' MMMM yyyy", { locale: es })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{task.status === "COMPLETED" ? "Completada" : "Cancelada"}</Badge>
                    <CompleteTaskButton taskId={task.id} currentStatus={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
