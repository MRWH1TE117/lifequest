import { LIFE_STATS, type LifeStat, type QuestCompletion } from "./model";

export type LifeStatScores = Record<LifeStat, number>;

export function createEmptyLifeStats(): LifeStatScores {
  return LIFE_STATS.reduce((scores, stat) => {
    scores[stat] = 0;
    return scores;
  }, {} as LifeStatScores);
}

export function calculateLifeStats(completions: QuestCompletion[]): LifeStatScores {
  const scores = createEmptyLifeStats();
  for (const completion of completions) {
    scores[completion.lifeStat] += completion.xpAwarded;
  }
  return scores;
}
