import { describe, expect, it } from "vitest";
import { buildWeeklyReview } from "../../src/domain/review";

describe("weekly review", () => {
  it("summarizes completions and check-ins for a Monday-based week", () => {
    const review = buildWeeklyReview({
      weekAnchorDate: "2026-07-08",
      completions: [
        { questId: "q1", completedAt: "2026-07-07T10:00:00.000Z", localDate: "2026-07-07", xpAwarded: 25, lifeStat: "Cialo" },
        { questId: "q2", completedAt: "2026-07-09T10:00:00.000Z", localDate: "2026-07-09", xpAwarded: 50, lifeStat: "Skupienie" },
        { questId: "old", completedAt: "2026-06-30T10:00:00.000Z", localDate: "2026-06-30", xpAwarded: 100, lifeStat: "Rozwoj" }
      ],
      checkIns: [
        { localDate: "2026-07-07", sleepHours: 7, energy: 4, mood: 4, reflection: "Good", updatedAt: "2026-07-07T20:00:00.000Z" },
        { localDate: "2026-07-09", sleepHours: 6, energy: 3, mood: 3, reflection: "Ok", updatedAt: "2026-07-09T20:00:00.000Z" }
      ]
    });

    expect(review.weekStart).toBe("2026-07-06");
    expect(review.weekEnd).toBe("2026-07-12");
    expect(review.totalXp).toBe(75);
    expect(review.completedQuestCount).toBe(2);
    expect(review.bestStat).toBe("Skupienie");
    expect(review.weakestStat).toBe("Energia");
    expect(review.checkInCount).toBe(2);
    expect(review.suggestedFocus).toContain("Energia");
  });
});
