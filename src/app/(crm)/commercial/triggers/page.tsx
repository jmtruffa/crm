import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RunTriggersButton } from "@/components/run-triggers-button";

export const dynamic = "force-dynamic";

export default async function TriggersPage() {
  const triggers = await prisma.trigger.findMany({
    include: {
      _count: { select: { firings: true } },
      firings: {
        orderBy: { firedAt: "desc" },
        take: 5,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Triggers</h1>
          <p className="text-muted-foreground">
            Reglas automáticas que generan tareas según el comportamiento del cliente
          </p>
        </div>
        <RunTriggersButton />
      </div>

      {triggers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No hay triggers configurados.</p>
            <p className="text-sm mt-1">
              Ejecutá:{" "}
              <code className="font-mono bg-muted px-1 rounded text-xs">
                npx tsx scripts/seed-triggers.ts
              </code>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {triggers.map((trigger) => (
            <Card key={trigger.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{trigger.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{trigger.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {trigger._count.firings} activaciones
                    </Badge>
                    <Badge
                      variant={trigger.isActive ? "default" : "outline"}
                      className={trigger.isActive ? "bg-emerald-500 text-white border-transparent text-xs" : "text-xs"}
                    >
                      {trigger.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {trigger.description && (
                  <p className="text-xs text-muted-foreground">{trigger.description}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  Condición: <span className="font-mono">{trigger.conditionType}</span>
                  {trigger.conditionDays && <span> — {trigger.conditionDays} días</span>}
                </div>

                <div className="flex justify-end">
                  <Link
                    href={`/commercial/triggers/${trigger.id}/clients`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Ver clientes →
                  </Link>
                </div>

                {trigger.firings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Últimas activaciones:</p>
                    <div className="space-y-1">
                      {trigger.firings.map((firing) => (
                        <div key={firing.id} className="flex items-center justify-between text-xs">
                          <Link
                            href={`/clients/${firing.client.id}`}
                            className="hover:underline text-foreground"
                          >
                            {firing.client.lastName}, {firing.client.firstName}
                          </Link>
                          <span className="text-muted-foreground">
                            {format(firing.firedAt, "d MMM HH:mm", { locale: es })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
