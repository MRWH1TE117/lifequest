import { describe, expect, it } from "vitest";
import script from "../start-lifequest.cmd?raw";

describe("LifeQuest start script", () => {
  it("uses the documented localhost port consistently", () => {
    const urls = script.match(/http:\/\/127\.0\.0\.1:\d+/g) ?? [];

    expect(new Set(urls)).toEqual(new Set(["http://127.0.0.1:5174"]));
    expect(script).toContain("npm run dev -- --port 5174 --strictPort");
  });
});
