"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type Props = { runId: number };

export function AdvanceWorkflowButton({ runId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAdvance() {
    setLoading(true);
    try {
      const res = await fetch(`/api/commercial/workflows/runs/${runId}/advance`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const run = await res.json();
      toast.success(run.status === "COMPLETED" ? "Workflow completado" : "Paso avanzado");
      router.refresh();
    } catch {
      toast.error("Error al avanzar el workflow");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleAdvance} disabled={loading}>
      <ChevronRight className="h-4 w-4 mr-1" />
      {loading ? "…" : "Avanzar"}
    </Button>
  );
}
