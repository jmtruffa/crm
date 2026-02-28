import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, PhoneCall, CalendarCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalClients, activeClients, pendingTasks, recentInteractions, overdueTasks, upcomingTasks] =
    await Promise.all([
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
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu cartera y actividad reciente</p>
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

        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interacciones Recientes</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentInteractions.length}</div>
            <p className="text-xs text-muted-foreground">Últimas registradas</p>
          </CardContent>
        </Card>

        <Link href="/clients?status=PROSPECT,INACTIVE,SUSPENDED" className="block group">
          <Card className="group-hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospectos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalClients - activeClients}
              </div>
              <p className="text-xs text-muted-foreground">En pipeline → gestionar</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/clients/${task.clientId}`}
                      className="font-medium hover:underline"
                    >
                      {task.client.firstName} {task.client.lastName}
                    </Link>
                    <p className="text-muted-foreground">{task.title}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {format(task.dueDate, "d MMM", { locale: es })}
                  </Badge>
                </div>
              ))}
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
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/clients/${task.clientId}`}
                      className="font-medium hover:underline"
                    >
                      {task.client.firstName} {task.client.lastName}
                    </Link>
                    <p className="text-muted-foreground">{task.title}</p>
                  </div>
                  <Badge variant={isToday(task.dueDate) ? "default" : isTomorrow(task.dueDate) ? "secondary" : "outline"} className="text-xs whitespace-nowrap">
                    {isToday(task.dueDate)
                      ? "Hoy"
                      : isTomorrow(task.dueDate)
                      ? "Mañana"
                      : format(task.dueDate, "d MMM", { locale: es })}
                  </Badge>
                </div>
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
      </div>
    </div>
  );
}
