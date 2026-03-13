"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Stage = { id: number; name: string };

type Props = {
  clientId: number;
  pipelineId: number;
  currentStageId: number;
  stages: Stage[];
};

export function PipelineStageSelector({ clientId, pipelineId, currentStageId, stages }: Props) {
  const router = useRouter();

  async function handleChange(stageId: string) {
    const res = await fetch(`/api/commercial/pipeline/${pipelineId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, stageId: Number(stageId) }),
    });

    if (!res.ok) {
      toast.error("Error al mover cliente");
      return;
    }

    toast.success("Cliente movido");
    router.refresh();
  }

  return (
    <Select value={String(currentStageId)} onValueChange={handleChange}>
      <SelectTrigger className="h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map((stage) => (
          <SelectItem key={stage.id} value={String(stage.id)} className="text-xs">
            {stage.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
