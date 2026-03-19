import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, PhoneCall, CalendarCheck, AlertCircle, TrendingUp, Zap, GitBranch, UserPlus } from "lucide-react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { ScoreBadge } from "@/components/score-badge";
import { ClientQuickSearch } from "@/components/client-quick-search";
import { CLIENT_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    totalClients,
    activeClients,
    pendingTasks,
    recentInteractions,
    overdueTasks,
    upcomingTasks,
    activeTriggerFirings,
    activeWorkflowRuns,
    topClientsByScore,
    recentClients,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.task.count({ where: { status: "PENDING" } }),
    prisma.interaction.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.task.findMany({
      where: { status: "PENDING", dueDate: { lt: new Date() } },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { status: "PENDING", dueDate: { gte: new Date() } },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    // Active trigger firings in last 7 days
    prisma.triggerFiring.count({
      where: { firedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.workflowRun.count({ where: { status: "ACTIVE" } }),
    // Top 5 clients by latest score
    prisma.client.findMany({
      where: {
        contactScores: { some: {} },
      },
      include: {
        contactScores: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
          select: { score: true, explain: true },
        },
      },
      take: 20,
    }),
    // Recently registered clients
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, firstName: true, lastName: true, status: true, createdAt: true },
    }),
  ]);

  // Sort top clients by score descending
  const top5 = topClientsByScore
    .filter((c) => c.contactScores[0])
    .sort((a, b) => (b.contactScores[0]?.score ?? 0) - (a.contactScores[0]?.score ?? 0))
    .slice(0, 5);

  // Average score
  const allScores = topClientsByScore.map((c) => c.contactScores[0]?.score ?? 0);
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    ACTIVE: "default",
    PROSPECT: "secondary",
    INACTIVE: "outline",
    SUSPENDED: "destructive",
  };
  const statusClass: Record<string, string> = {
    ACTIVE: "bg-emerald-500 hover:bg-emerald-500/90 text-white border-transparent",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu cartera y actividad reciente</p>
        </div>
        <ClientQuickSearch />
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">{activeClients} activos</p>
          </CardContent>
        </Card>

        <Link href="/commercial/today" className="block group">
          <Card className="group-hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {overdueTasks.length > 0 ? (
                  <span className="text-destructive">{overdueTasks.length} vencidas</span>
                ) : (
                  "Sin vencidas"
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients?sort=score" className="block group">
          <Card className="group-hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgScore !== null ? avgScore : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {topClientsByScore.filter((c) => c.contactScores[0]).length} clientes con score
              </p>
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-4 md:col-span-1">
          <Link href="/commercial/triggers" className="block group">
            <Card className="group-hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Triggers 7d</CardTitle>
                <Zap className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{activeTriggerFirings}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/commercial/workflows" className="block group">
            <Card className="group-hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Workflows</CardTitle>
                <GitBranch className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{activeWorkflowRuns}</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top 5 clientes por score */}
        {top5.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top clientes por score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {top5.map((client) => {
                const score = client.contactScores[0];
                const explain = score?.explain ? JSON.parse(score.explain) : null;
                return (
                  <div key={client.id} className="flex items-center justify-between text-sm">
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                      {client.firstName} {client.lastName}
                    </Link>
                    <ScoreBadge score={score?.score ?? null} explain={explain} />
                  </div>
                );
              })}
              <Link href="/clients?sort=score" className="text-xs text-muted-foreground hover:underline block mt-2">
                Ver todos por score →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Tareas vencidas */}
        {overdueTasks.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Tareas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/clients/${task.clientId}`}
                  className="flex items-center justify-between text-sm hover:bg-muted/50 rounded px-1 -mx-1 py-0.5"
                >
                  <div>
                    <p className="font-medium">
                      {task.client.firstName} {task.client.lastName}
                    </p>
                    <p className="text-muted-foreground">{task.title}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {format(task.dueDate, "d MMM", { locale: es })}
                  </Badge>
                </Link>
              ))}
              <Link href="/commercial/today" className="text-xs text-muted-foreground hover:underline block mt-2">
                Ver acciones del día →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Próximas tareas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              Próximas Tareas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tareas pendientes</p>
            ) : (
              upcomingTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/clients/${task.clientId}`}
                  className="flex items-center justify-between text-sm hover:bg-muted/50 rounded px-1 -mx-1 py-0.5"
                >
                  <div>
                    <p className="font-medium">
                      {task.client.firstName} {task.client.lastName}
                    </p>
                    <p className="text-muted-foreground">{task.title}</p>
                  </div>
                  <Badge
                    variant={isToday(task.dueDate) ? "default" : isTomorrow(task.dueDate) ? "secondary" : "outline"}
                    className="text-xs whitespace-nowrap shrink-0"
                  >
                    {isToday(task.dueDate)
                      ? "Hoy"
                      : isTomorrow(task.dueDate)
                      ? "Mañana"
                      : format(task.dueDate, "d MMM", { locale: es })}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Interacciones recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              Últimas Interacciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentInteractions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
            ) : (
              recentInteractions.map((interaction) => (
                <div key={interaction.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/clients/${interaction.clientId}`}
                      className="font-medium hover:underline"
                    >
                      {interaction.client.firstName} {interaction.client.lastName}
                    </Link>
                    <p className="text-muted-foreground line-clamp-1">{interaction.notes}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {format(interaction.date, "d MMM", { locale: es })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Clientes recién dados de alta */}
        {recentClients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Clientes Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between text-sm">
                  <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                    {client.firstName} {client.lastName}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant[client.status] ?? "outline"}
                      className={`text-xs ${statusClass[client.status] ?? ""}`}
                    >
                      {CLIENT_STATUS[client.status as keyof typeof CLIENT_STATUS] ?? client.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(client.createdAt, "d MMM", { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
              <Link href="/clients" className="text-xs text-muted-foreground hover:underline block mt-2">
                Ver todos los clientes →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
