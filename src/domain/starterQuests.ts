import type { LifeStat, Quest, QuestDifficulty, QuestType } from "./model";
import { getDefaultXp } from "./xp";

type StarterQuestTuple = [string, string, string, LifeStat, QuestType, QuestDifficulty];

export function createStarterQuests(nowIso: string): Quest[] {
  const quests: StarterQuestTuple[] = [
    ["sleep-7h", "Sen 7+ godzin", "Zadbaj o bazowy poziom energii.", "Energia", "daily", "medium"],
    ["walk-20m", "Spacer 20 minut", "Utrzymaj codzienny ruch i tempo.", "Cialo", "daily", "easy"],
    ["reflect-10m", "Refleksja 10 minut", "Zapisz krotka notatke z dnia.", "Umysl", "daily", "easy"],
    ["deep-work", "Blok skupionej pracy", "Zrób postęp przed reagowaniem na rozpraszacze.", "Skupienie", "daily", "medium"],
    ["learn-20m", "Nauka 20 minut", "Czytaj, ćwicz albo kontynuuj kurs.", "Rozwoj", "daily", "medium"],
    ["expense-note", "Zapis wydatkow", "Utrzymaj swiadomosc finansowa.", "Finanse", "daily", "easy"],
    ["meaningful-contact", "Kontakt z jedna osoba", "Wyslij wiadomosc albo porozmawiaj realnie.", "Relacje", "weekly", "medium"],
    ["weekly-boss", "Cel tygodnia", "Wybierz jeden ważny cel na tydzień.", "Rozwoj", "boss", "boss"]
  ];

  return quests.map(([id, name, description, lifeStat, type, difficulty]) => ({
    id,
    name,
    description,
    lifeStat,
    type,
    difficulty,
    xp: getDefaultXp(difficulty, type),
    active: true,
    createdAt: nowIso
  }));
}
