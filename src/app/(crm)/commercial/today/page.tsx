import { getTodayActions } from "@/lib/commercial/today-service";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";
import { CompleteTaskButton } from "@/components/complete-task-button";
import { RunTriggersButton } from "@/components/run-triggers-button";
import { format, isToday, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { TASK_TYPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const priorityLabel: Record<number, string> = {
  1: "Urgente",
  2: "Alta",
  3: "Normal",
  4: "Baja",
  5: "Mínima",
};

const priorityClass: Record<number, string> = {
  1: "bg-red-500 text-white border-transparent",
  2: "bg-orange-400 text-white border-transparent",
  3: "",
  4: "bg-muted text-muted-foreground",
  5: "bg-muted text-muted-foreground",
};

export default async function TodayPage() {
  const actions = await getTodayActions(50);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Acciones del día</h1>
            <p className="text-muted-foreground">
              {actions.length} tarea{actions.length !== 1 ? "s" : ""} pendiente{actions.length !== 1 ? "s" : ""} hoy
            </p>
          </div>
          <RunTriggersButton />
        </div>

        {actions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg font-medium">¡Todo al día!</p>
              <p className="text-sm mt-1">No hay tareas pendientes para hoy.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {actions.map(({ task, client, score }) => {
              const overdue = isPast(task.dueDate) && !isToday(task.dueDate);
              return (
                <Card key={task.id} className={overdue ? "border-destructive/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Priority indicator */}
                      <div className="flex-shrink-0 pt-0.5">
                        <Badge className={`text-xs ${priorityClass[task.priority] ?? ""}`}>
                          P{task.priority} {priorityLabel[task.priority] ?? ""}
                        </Badge>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{task.title}</span>
                          {task.taskType && (
                            <Badge variant="outline" className="text-xs">
                              {TASK_TYPE[task.taskType as keyof typeof TASK_TYPE] ?? task.taskType}
                            </Badge>
                          )}
                          {task.triggerFiringId && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {client.lastName}, {client.firstName}
                          </Link>
                          {client.aumCurrent !== null && (
                            <span className="text-xs text-muted-foreground">
                              USD {client.aumCurrent.toLocaleString("es-AR")}
                            </span>
                          )}
                          <ScoreBadge score={score} />
                        </div>
                      </div>

                      {/* Right: date + actions */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <span className={`text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {overdue
                            ? `Vencida: ${format(task.dueDate, "d MMM", { locale: es })}`
                            : isToday(task.dueDate)
                            ? "Hoy"
                            : format(task.dueDate, "d MMM", { locale: es })}
                        </span>
                        <CompleteTaskButton taskId={task.id} currentStatus="PENDING" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
  );
}
