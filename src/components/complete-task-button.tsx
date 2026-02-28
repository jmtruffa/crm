"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw } from "lucide-react";

type Props = { taskId: number; currentStatus: string };

export function CompleteTaskButton({ taskId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isPending = currentStatus === "PENDING";

  async function handleToggle() {
    setLoading(true);
    const newStatus = isPending ? "COMPLETED" : "PENDING";
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(isPending ? "Tarea completada" : "Tarea reabierta");
      router.refresh();
    } catch {
      toast.error("Error al actualizar la tarea");
      setLoading(false);
    }
  }

  if (isPending) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
        onClick={handleToggle}
        disabled={loading}
        title="Marcar como completada"
      >
        <Check className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground hover:text-foreground shrink-0"
      onClick={handleToggle}
      disabled={loading}
      title="Reabrir tarea"
    >
      <RotateCcw className="h-3.5 w-3.5" />
    </Button>
  );
}
