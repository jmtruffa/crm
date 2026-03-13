"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ScoreExplain = {
  base: number;
  daysSinceInteraction: number | null;
  interactionPenalty: number;
  daysSinceOperation: number | null;
  operationPenalty: number;
  aumBonus: number;
  referralBonus: number;
  total: number;
};

type Props = {
  score: number | null;
  explain?: ScoreExplain | null;
};

function scoreVariant(score: number): string {
  if (score > 60) return "bg-emerald-500 text-white border-transparent hover:bg-emerald-500/90";
  if (score >= 30) return "bg-amber-400 text-white border-transparent hover:bg-amber-400/90";
  return "bg-red-500 text-white border-transparent hover:bg-red-500/90";
}

export function ScoreBadge({ score, explain }: Props) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const badge = (
    <Badge className={`text-xs font-mono ${scoreVariant(score)}`}>
      {Math.round(score)}
    </Badge>
  );

  if (!explain) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="text-xs space-y-1 max-w-xs">
        <p className="font-semibold">Score: {Math.round(score)}</p>
        <p>Base: {explain.base}</p>
        {explain.daysSinceInteraction !== null ? (
          <p>Interacción: hace {explain.daysSinceInteraction}d ({explain.interactionPenalty})</p>
        ) : (
          <p>Sin interacciones ({explain.interactionPenalty})</p>
        )}
        {explain.daysSinceOperation !== null ? (
          <p>Operación: hace {explain.daysSinceOperation}d ({explain.operationPenalty})</p>
        ) : (
          <p>Sin operaciones ({explain.operationPenalty})</p>
        )}
        {explain.aumBonus > 0 && <p>AUM bonus: +{explain.aumBonus}</p>}
        {explain.referralBonus > 0 && <p>Referido: +{explain.referralBonus}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
