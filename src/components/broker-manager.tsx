"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

type Broker = { id: number; name: string; website: string | null; _count: { accounts: number } };

export function BrokerManager({ brokers }: { brokers: Broker[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", website: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, website: form.website || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      toast.success("Broker creado");
      setOpen(false);
      setForm({ name: "", website: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear el broker");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string, accountCount: number) {
    if (accountCount > 0) {
      toast.error(`No se puede eliminar: hay ${accountCount} cuenta(s) asociadas`);
      return;
    }
    if (!confirm(`¿Eliminar el broker "${name}"?`)) return;
    try {
      const res = await fetch(`/api/brokers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Broker eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar el broker");
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Broker
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Broker</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brokerName">Nombre *</Label>
              <Input
                id="brokerName"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="IOL, Balanz, Interactive Brokers…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerWebsite">Sitio web</Label>
              <Input
                id="brokerWebsite"
                type="url"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando…" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {brokers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay brokers registrados.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {brokers.map((broker) => (
            <div key={broker.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{broker.name}</div>
                {broker.website && (
                  <a
                    href={broker.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {broker.website}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {broker._count.accounts} cuenta{broker._count.accounts !== 1 ? "s" : ""}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(broker.id, broker.name, broker._count.accounts)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
