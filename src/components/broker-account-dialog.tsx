"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

type Broker = { id: number; name: string };
type Props = { clientId: number; brokers: Broker[] };

export function BrokerAccountDialog({ clientId, brokers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brokerId: "",
    accountNumber: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brokerId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/broker-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          brokerId: Number(form.brokerId),
          accountNumber: form.accountNumber || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Cuenta agregada");
      setOpen(false);
      setForm({ brokerId: "", accountNumber: "", notes: "" });
      router.refresh();
    } catch {
      toast.error("Error al agregar la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar Cuenta en Broker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Broker *</Label>
            <Select
              value={form.brokerId}
              onValueChange={(v) => setForm((p) => ({ ...p, brokerId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar broker" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Número de cuenta</Label>
            <Input
              id="accountNumber"
              value={form.accountNumber}
              onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNotes">Notas</Label>
            <Textarea
              id="accountNotes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Opcional"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.brokerId}>
              {loading ? "Guardando…" : "Agregar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
