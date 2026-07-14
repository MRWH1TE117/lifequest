import type { QuestDifficulty, QuestType } from "./model";

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

export function getDefaultXp(difficulty: QuestDifficulty, type: QuestType): number {
  if (type === "boss" || difficulty === "boss") return 100;
  if (difficulty === "hard") return 50;
  if (difficulty === "medium") return 25;
  return 10;
}

export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let index = 1; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (totalXp >= LEVEL_THRESHOLDS[index]) {
      level = index + 1;
    }
  }
  return level;
}

export function getNextLevelXp(totalXp: number): number {
  const next = LEVEL_THRESHOLDS.find((threshold) => threshold > totalXp);
  return next ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}
