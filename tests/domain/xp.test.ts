import { describe, expect, it } from "vitest";
import { getDefaultXp, getLevelFromXp, getNextLevelXp } from "../../src/domain/xp";

describe("XP logic", () => {
  it("returns default XP by difficulty and quest type", () => {
    expect(getDefaultXp("easy", "daily")).toBe(10);
    expect(getDefaultXp("medium", "daily")).toBe(25);
    expect(getDefaultXp("hard", "weekly")).toBe(50);
    expect(getDefaultXp("boss", "boss")).toBe(100);
  });

  it("calculates level from total XP", () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(99)).toBe(1);
    expect(getLevelFromXp(100)).toBe(2);
    expect(getLevelFromXp(249)).toBe(2);
    expect(getLevelFromXp(250)).toBe(3);
  });

  it("returns the next level XP threshold", () => {
    expect(getNextLevelXp(0)).toBe(100);
    expect(getNextLevelXp(100)).toBe(250);
    expect(getNextLevelXp(250)).toBe(450);
  });
});
