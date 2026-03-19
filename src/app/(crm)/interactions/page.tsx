import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { INTERACTION_TYPE } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Shift UTC date to Buenos Aires (UTC-3) for display
const bsAs = (d: Date) => new Date(d.getTime() - 3 * 60 * 60 * 1000);
import { MarkdownDisplay } from "@/components/markdown-display";
import { InteractionsFilter } from "@/components/interactions-filter";
import { InteractionDialog } from "@/components/interaction-dialog";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    search?: string;
    clientId?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function InteractionsPage({ searchParams }: Props) {
  const { search = "", clientId = "", type = "", dateFrom = "", dateTo = "" } =
    await searchParams;

  const [interactions, clients] = await Promise.all([
    prisma.interaction.findMany({
      where: {
        ...(search ? { notes: { contains: search } } : {}),
        ...(clientId ? { clientId: Number(clientId) } : {}),
        ...(type ? { type } : {}),
        ...((dateFrom || dateTo) ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
          },
        } : {}),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        followUpTask: true,
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.client.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interacciones</h1>
          <p className="text-muted-foreground">
            {interactions.length} resultado{interactions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <InteractionDialog clients={clients} />
      </div>

      <InteractionsFilter
        clients={clients}
        defaultSearch={search}
        defaultClientId={clientId}
        defaultType={type}
        defaultDateFrom={dateFrom}
        defaultDateTo={dateTo}
      />

      {interactions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No se encontraron interacciones con los filtros aplicados.
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <div key={interaction.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {INTERACTION_TYPE[interaction.type as keyof typeof INTERACTION_TYPE] ?? interaction.type}
                    </Badge>
                    <Link
                      href={`/clients/${interaction.client.id}`}
                      className="font-medium hover:underline"
                    >
                      {interaction.client.lastName}, {interaction.client.firstName}
                    </Link>
                    {interaction.duration && (
                      <span className="text-xs text-muted-foreground">
                        {interaction.duration} min
                      </span>
                    )}
                  </div>
                  <MarkdownDisplay content={interaction.notes} />
                  {interaction.followUpTask && (
                    <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1 inline-flex items-center gap-1 mt-1">
                      Seguimiento: {interaction.followUpTask.title} —{" "}
                      {format(interaction.followUpTask.dueDate, "d MMM", { locale: es })}
                      {interaction.followUpTask.status === "COMPLETED" && " ✓"}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground whitespace-nowrap shrink-0">
                  <div>{format(bsAs(interaction.date), "d MMM yyyy", { locale: es })}</div>
                  <div className="text-xs">{format(bsAs(interaction.date), "HH:mm")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
