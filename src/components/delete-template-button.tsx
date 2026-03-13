"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  templateId: number;
  templateName: string;
};

export function DeleteTemplateButton({ templateId, templateName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar template "${templateName}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/commercial/templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Template eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}
