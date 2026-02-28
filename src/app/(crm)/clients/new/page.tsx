import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
        <p className="text-muted-foreground">Completá los datos del nuevo cliente</p>
      </div>
      <ClientForm />
    </div>
  );
}
