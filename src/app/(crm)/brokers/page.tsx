import { prisma } from "@/lib/prisma";
import { BrokerManager } from "@/components/broker-manager";

export const dynamic = "force-dynamic";

export default async function BrokersPage() {
  const brokers = await prisma.broker.findMany({
    include: { _count: { select: { accounts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brokers</h1>
        <p className="text-muted-foreground">Administrá los brokers disponibles</p>
      </div>
      <BrokerManager brokers={brokers} />
    </div>
  );
}
