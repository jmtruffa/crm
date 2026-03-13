"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function RunTriggersButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    try {
      const res = await fetch("/api/commercial/run-triggers", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(
        `Evaluación completa: ${data.fired} trigger(s) activados, ${data.tasksCreated} tarea(s) creadas (${data.processed} clientes procesados)`
      );
      router.refresh();
    } catch {
      toast.error("Error al ejecutar triggers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleRun} disabled={loading}>
      <Zap className="h-4 w-4 mr-2" />
      {loading ? "Evaluando…" : "Ejecutar evaluación"}
    </Button>
  );
}
