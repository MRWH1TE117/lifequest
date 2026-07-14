import { describe, expect, it } from "vitest";
import { millisecondsUntilNextLocalDay } from "../../src/domain/dates";

describe("local date rollover", () => {
  it("returns the delay until just after the next local midnight", () => {
    const now = new Date(2026, 6, 9, 23, 59, 59, 500);

    expect(millisecondsUntilNextLocalDay(now)).toBe(550);
  });
});
