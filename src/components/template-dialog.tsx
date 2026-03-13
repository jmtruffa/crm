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
import { Plus, Pencil } from "lucide-react";

type Template = {
  id: number;
  name: string;
  subject: string | null;
  body: string;
  variables: string | null;
};

type Props = {
  template?: Template;
};

export function TemplateDialog({ template }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!template;

  const [form, setForm] = useState({
    name: template?.name ?? "",
    subject: template?.subject ?? "",
    body: template?.body ?? "",
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  // Extract variables from body: {{varName}}
  function extractVariables(body: string): string[] {
    const matches = body.match(/\{\{(\w+)\}\}/g) ?? [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const variables = extractVariables(form.body);
      const res = await fetch(
        isEdit ? `/api/commercial/templates/${template!.id}` : "/api/commercial/templates",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, variables }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Template actualizado" : "Template creado");
      setOpen(false);
      if (!isEdit) setForm({ name: "", subject: "", body: "" });
      router.refresh();
    } catch {
      toast.error("Error al guardar template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-3 w-3" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Template" : "Nuevo Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Nombre *</Label>
            <Input id="tpl-name" value={form.name} onChange={set("name")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-subject">Asunto</Label>
            <Input id="tpl-subject" value={form.subject} onChange={set("subject")} placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-body">
              Cuerpo *{" "}
              <span className="text-xs font-normal text-muted-foreground">
                — Variables: {`{{firstName}}`}, {`{{lastName}}`}, {`{{aumCurrent}}`}
              </span>
            </Label>
            <Textarea
              id="tpl-body"
              value={form.body}
              onChange={set("body")}
              rows={6}
              required
              placeholder="Hola {{firstName}}, te escribo para…"
            />
          </div>
          {form.body && (
            <p className="text-xs text-muted-foreground">
              Variables detectadas:{" "}
              {extractVariables(form.body).map((v) => `{{${v}}}`).join(", ") || "ninguna"}
            </p>
          )}
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
