"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";

type Client = { id: number; firstName: string; lastName: string };

type Props = {
  workflowId: number;
  clients: Client[];
};

export function StartWorkflowButton({ workflowId, clients }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");

  async function handleStart() {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/commercial/workflows/${workflowId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: Number(clientId) }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Workflow iniciado");
      setOpen(false);
      setClientId("");
      router.refresh();
    } catch (e) {
      toast.error("Error al iniciar workflow");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Play className="h-3 w-3 mr-1" />
          Iniciar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Iniciar Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.lastName}, {c.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStart} disabled={loading || !clientId}>
              {loading ? "Iniciando…" : "Iniciar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
