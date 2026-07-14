import type { HabitCategory, LifeStat } from "./model";

const AREA_LABELS: Record<string, string> = {
  Cialo: "Ciało",
  Porzadek: "Porządek",
  Rozwoj: "Rozwój",
  Umysl: "Umysł"
};

export function areaLabel(area: HabitCategory | LifeStat | string): string {
  return AREA_LABELS[area] ?? area;
}
