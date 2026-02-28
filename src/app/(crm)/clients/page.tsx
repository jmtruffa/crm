import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { CLIENT_STATUS, RISK_PROFILE } from "@/lib/constants";
import { ClientsSearch } from "@/components/clients-search";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  PROSPECT: "secondary",
  INACTIVE: "outline",
  SUSPENDED: "destructive",
};

type Props = {
  searchParams: Promise<{ search?: string; status?: string }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const { search = "", status = "" } = await searchParams;

  // Support comma-separated statuses (e.g. "PROSPECT,INACTIVE,SUSPENDED")
  const statuses = status ? status.split(",").filter(Boolean) : [];

  const clients = await prisma.client.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { document: { contains: search } },
                { cuit: { contains: search } },
              ],
            }
          : {},
        statuses.length === 1
          ? { status: statuses[0] }
          : statuses.length > 1
          ? { status: { in: statuses } }
          : {},
      ],
    },
    include: {
      brokerAccounts: { include: { broker: true } },
      _count: { select: { interactions: true, tasks: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">{clients.length} clientes encontrados</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <ClientsSearch defaultSearch={search} defaultStatus={status} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Perfil de Riesgo</TableHead>
              <TableHead>Brokers</TableHead>
              <TableHead className="text-right">Actividad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                const href = statuses.length > 0
                  ? `/clients/${client.id}?from=${encodeURIComponent(status)}`
                  : `/clients/${client.id}`;
                return (
                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={href} className="block">
                      <div className="font-medium">
                        {client.lastName}, {client.firstName}
                      </div>
                      {client.document && (
                        <div className="text-xs text-muted-foreground">DNI: {client.document}</div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={href} className="block">
                      <div className="text-sm">{client.email || "—"}</div>
                      <div className="text-xs text-muted-foreground">{client.phone || ""}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={href} className="block">
                      <Badge variant={statusVariant[client.status] ?? "outline"}>
                        {CLIENT_STATUS[client.status as keyof typeof CLIENT_STATUS] ?? client.status}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={href} className="block">
                      {client.riskProfile
                        ? RISK_PROFILE[client.riskProfile as keyof typeof RISK_PROFILE]
                        : "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={href} className="block">
                      <div className="flex flex-wrap gap-1">
                        {client.brokerAccounts.length === 0
                          ? <span className="text-muted-foreground text-sm">—</span>
                          : client.brokerAccounts.map((acc) => (
                              <Badge key={acc.id} variant="outline" className="text-xs">
                                {acc.broker.name}
                              </Badge>
                            ))}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={href} className="block">
                      <div className="text-sm text-muted-foreground">
                        {client._count.interactions} interact. · {client._count.tasks} tareas
                      </div>
                    </Link>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
