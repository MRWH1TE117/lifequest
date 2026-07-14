import { describe, expect, it } from "vitest";
import { calculateLifeStats } from "../../src/domain/stats";

describe("life stat calculation", () => {
  it("starts every stat at zero", () => {
    const stats = calculateLifeStats([]);
    expect(stats.Energia).toBe(0);
    expect(stats.Cialo).toBe(0);
    expect(stats.Umysl).toBe(0);
    expect(stats.Skupienie).toBe(0);
    expect(stats.Rozwoj).toBe(0);
    expect(stats.Finanse).toBe(0);
    expect(stats.Relacje).toBe(0);
  });

  it("adds completed quest XP to the matching stat", () => {
    const stats = calculateLifeStats([
      { questId: "q1", completedAt: "2026-07-07T10:00:00.000Z", localDate: "2026-07-07", xpAwarded: 25, lifeStat: "Cialo" },
      { questId: "q2", completedAt: "2026-07-07T11:00:00.000Z", localDate: "2026-07-07", xpAwarded: 10, lifeStat: "Cialo" },
      { questId: "q3", completedAt: "2026-07-07T12:00:00.000Z", localDate: "2026-07-07", xpAwarded: 50, lifeStat: "Skupienie" }
    ]);

    expect(stats.Cialo).toBe(35);
    expect(stats.Skupienie).toBe(50);
    expect(stats.Energia).toBe(0);
  });
});
