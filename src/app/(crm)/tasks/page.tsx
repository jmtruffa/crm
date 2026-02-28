import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { CompleteTaskButton } from "@/components/complete-task-button";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [pendingTasks, recentCompleted] = await Promise.all([
    prisma.task.findMany({
      where: { status: "PENDING" },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.findMany({
      where: { status: { in: ["COMPLETED", "CANCELLED"] } },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const overdue = pendingTasks.filter((t) => isPast(t.dueDate) && !isToday(t.dueDate));
  const today = pendingTasks.filter((t) => isToday(t.dueDate));
  const tomorrow = pendingTasks.filter((t) => isTomorrow(t.dueDate));
  const upcoming = pendingTasks.filter(
    (t) => !isPast(t.dueDate) && !isToday(t.dueDate) && !isTomorrow(t.dueDate)
  );

  const renderTasks = (tasks: typeof pendingTasks) =>
    tasks.map((task) => (
      <div
        key={task.id}
        className="flex items-start justify-between rounded-md border p-3 text-sm bg-card"
      >
        <div className="space-y-0.5">
          <div className="font-medium">{task.title}</div>
          {task.description && (
            <div className="text-muted-foreground text-xs">{task.description}</div>
          )}
          <div>
            <Link
              href={`/clients/${task.client.id}`}
              className="text-xs text-primary hover:underline"
            >
              {task.client.lastName}, {task.client.firstName}
            </Link>
            <span className="text-xs text-muted-foreground ml-2">
              {format(task.dueDate, "d 'de' MMMM yyyy", { locale: es })}
            </span>
          </div>
        </div>
        <CompleteTaskButton taskId={task.id} currentStatus="PENDING" />
      </div>
    ));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">
          {pendingTasks.length} tareas pendientes
        </p>
      </div>

      {overdue.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-destructive flex items-center gap-2">
            Vencidas ({overdue.length})
          </h2>
          <div className="space-y-2">{renderTasks(overdue)}</div>
        </section>
      )}

      {today.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            Hoy
            <Badge>{today.length}</Badge>
          </h2>
          <div className="space-y-2">{renderTasks(today)}</div>
        </section>
      )}

      {tomorrow.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Mañana ({tomorrow.length})
          </h2>
          <div className="space-y-2">{renderTasks(tomorrow)}</div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Próximas ({upcoming.length})
          </h2>
          <div className="space-y-2">{renderTasks(upcoming)}</div>
        </section>
      )}

      {pendingTasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No hay tareas pendientes.
        </div>
      )}

      {recentCompleted.length > 0 && (
        <details className="space-y-2">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            Ver completadas/canceladas recientes ({recentCompleted.length})
          </summary>
          <div className="space-y-2 mt-2">
            {recentCompleted.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between rounded-md border p-3 text-sm opacity-70"
              >
                <div>
                  <div className="font-medium line-through">{task.title}</div>
                  <Link
                    href={`/clients/${task.client.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {task.client.lastName}, {task.client.firstName}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {task.status === "COMPLETED" ? "Completada" : "Cancelada"}
                  </Badge>
                  <CompleteTaskButton taskId={task.id} currentStatus={task.status} />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
