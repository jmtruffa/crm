"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { INTERACTION_TYPE } from "@/lib/constants";
import { Plus, CalendarDays } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ClientOption = { id: number; firstName: string; lastName: string };

type Props =
  | { clientId: number; clients?: never }
  | { clientId?: undefined; clients: ClientOption[] };

export function InteractionDialog({ clientId, clients }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [form, setForm] = useState({
    type: "CALL",
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    notes: "",
    duration: "",
    followUpDate: "",
    followUpTitle: "",
  });

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  function resetForm() {
    setSelectedClientId("");
    setForm({
      type: "CALL",
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      notes: "",
      duration: "",
      followUpDate: "",
      followUpTitle: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveClientId = clientId ?? (selectedClientId ? Number(selectedClientId) : null);
    if (!effectiveClientId) {
      toast.error("Seleccioná un cliente");
      return;
    }
    if (!form.notes.trim()) {
      toast.error("Las notas son obligatorias");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: effectiveClientId,
          type: form.type,
          date: form.date,
          notes: form.notes,
          duration: form.duration ? Number(form.duration) : null,
          followUpDate: form.followUpDate || null,
          followUpTitle: form.followUpTitle || "Seguimiento",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Interacción registrada");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Error al guardar la interacción");
    } finally {
      setLoading(false);
    }
  }

  const followUpSelected = form.followUpDate
    ? new Date(form.followUpDate + "T12:00:00")
    : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {clientId ? "Nueva interacción" : "Agregar interacción"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Interacción</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de cliente (solo cuando se usa sin clientId) */}
          {!clientId && clients && (
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un cliente" />
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERACTION_TYPE).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha y hora *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={set("date")}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={form.duration}
              onChange={set("duration")}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Notas *{" "}
              <span className="text-xs font-normal text-muted-foreground">
                — Markdown soportado. Pegá imágenes con ⌘V / Ctrl+V
              </span>
            </Label>
            <MarkdownEditor
              value={form.notes}
              onChange={(v) => setForm((p) => ({ ...p, notes: v }))}
              placeholder="¿De qué hablaron? Podés usar **negrita**, _cursiva_, listas…"
              minHeight={220}
            />
          </div>

          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Seguimiento (opcional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fecha del seguimiento</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.followUpDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {form.followUpDate
                        ? format(followUpSelected!, "d 'de' MMMM yyyy", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={followUpSelected}
                      onSelect={(date) => {
                        setForm((p) => ({
                          ...p,
                          followUpDate: date ? format(date, "yyyy-MM-dd") : "",
                        }));
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="followUpTitle" className="text-xs">Título de la tarea</Label>
                <Input
                  id="followUpTitle"
                  value={form.followUpTitle}
                  onChange={set("followUpTitle")}
                  placeholder="Seguimiento"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
