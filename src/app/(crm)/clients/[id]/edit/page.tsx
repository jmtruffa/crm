import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id: Number(id) } });
  if (!client) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
        <p className="text-muted-foreground">
          {client.firstName} {client.lastName}
        </p>
      </div>
      <ClientForm
        initialData={{
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email ?? "",
          phone: client.phone ?? "",
          company: client.company ?? "",
          dob: client.dob ? client.dob.toISOString().slice(0, 10) : "",
          street: client.street ?? "",
          streetNumber: client.streetNumber ?? "",
          apt: client.apt ?? "",
          city: client.city ?? "",
          postalCode: client.postalCode ?? "",
          country: client.country ?? "Argentina",
          document: client.document ?? "",
          cuit: client.cuit ?? "",
          status: client.status,
          riskProfile: client.riskProfile ?? "",
          origin: client.origin ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
