import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CLIENT_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  PROSPECT: "secondary",
  INACTIVE: "outline",
  SUSPENDED: "destructive",
};
const statusClass: Record<string, string> = {
  ACTIVE: "bg-emerald-500 text-white border-transparent",
};

export default async function TriggerClientsPage({ params }: Props) {
  const { id } = await params;

  const trigger = await prisma.trigger.findUnique({
    where: { id: Number(id) },
    include: {
      firings: {
        orderBy: { firedAt: "desc" },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, status: true } },
        },
      },
    },
  });

  if (!trigger) notFound();

  // Deduplicate: most recent firing per client
  const seenClientIds = new Set<number>();
  const uniqueFirings = trigger.firings.filter((f) => {
    if (seenClientIds.has(f.clientId)) return false;
    seenClientIds.add(f.clientId);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/commercial/triggers"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{trigger.name}</h1>
          <p className="text-muted-foreground text-sm">
            {uniqueFirings.length} cliente{uniqueFirings.length !== 1 ? "s" : ""} alcanzados
            {" · "}{trigger.firings.length} disparos totales
          </p>
        </div>
      </div>

      {trigger.description && (
        <p className="text-sm text-muted-foreground">{trigger.description}</p>
      )}

      {uniqueFirings.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Este trigger aún no se activó para ningún cliente.
        </p>
      ) : (
        <div className="rounded-md border divide-y">
          {uniqueFirings.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
              <Link
                href={`/clients/${f.client.id}`}
                className="font-medium hover:underline text-sm"
              >
                {f.client.lastName}, {f.client.firstName}
              </Link>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge
                  variant={statusVariant[f.client.status] ?? "outline"}
                  className={`text-xs ${statusClass[f.client.status] ?? ""}`}
                >
                  {CLIENT_STATUS[f.client.status as keyof typeof CLIENT_STATUS] ?? f.client.status}
                </Badge>
                <span className="text-xs">
                  {format(f.firedAt, "d MMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
