import type { Quest, QuestCompletion } from "./model";
import { getMondayWeekRange } from "./dates";

export function getDueQuests(quests: Quest[], completions: QuestCompletion[], today: string): Quest[] {
  const week = getMondayWeekRange(today);

  return quests.filter((quest) => {
    if (!quest.active) return false;
    const matching = completions.filter((item) => item.questId === quest.id);
    if (quest.type === "daily") return !matching.some((item) => item.localDate === today);
    if (quest.type === "weekly") {
      return !matching.some((item) => item.localDate >= week.weekStart && item.localDate <= week.weekEnd);
    }
    return matching.length === 0;
  });
}
