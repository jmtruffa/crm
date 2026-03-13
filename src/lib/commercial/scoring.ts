export type ScoreExplain = {
  base: number;
  daysSinceInteraction: number | null;
  interactionPenalty: number;
  daysSinceOperation: number | null;
  operationPenalty: number;
  aumBonus: number;
  referralBonus: number;
  total: number;
};

type ScoringInput = {
  lastInteractionAt: Date | null;
  lastOperationAt: Date | null;
  aumCurrent: number | null;
  sourceChannel: string | null;
};

export function calculateScore(client: ScoringInput): { score: number; explain: ScoreExplain } {
  const now = new Date();
  const base = 50;

  const daysSinceInteraction = client.lastInteractionAt
    ? Math.floor((now.getTime() - client.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const daysSinceOperation = client.lastOperationAt
    ? Math.floor((now.getTime() - client.lastOperationAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // -1 per day without interaction, max -20; if never interacted: -20
  const interactionPenalty =
    daysSinceInteraction !== null ? Math.min(daysSinceInteraction, 20) : 20;

  // -0.5 per day without operation, max -15; if never operated: -10
  const operationPenalty =
    daysSinceOperation !== null ? Math.min(Math.floor(daysSinceOperation * 0.5), 15) : 10;

  // AUM bonus
  let aumBonus = 0;
  if (client.aumCurrent) {
    if (client.aumCurrent > 100_000) aumBonus = 20;
    else if (client.aumCurrent > 50_000) aumBonus = 10;
    else if (client.aumCurrent > 10_000) aumBonus = 5;
  }

  // Referral channel bonus
  const referralBonus = client.sourceChannel === "REFERRAL" ? 5 : 0;

  const raw = base - interactionPenalty - operationPenalty + aumBonus + referralBonus;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    explain: {
      base,
      daysSinceInteraction,
      interactionPenalty: -interactionPenalty,
      daysSinceOperation,
      operationPenalty: -operationPenalty,
      aumBonus,
      referralBonus,
      total: score,
    },
  };
}
