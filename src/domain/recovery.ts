import { toLocalDateString } from "./dates";
import type { DayState, GeneratedTask, RecoveryActivity } from "./model";

export type RecoveryTemplate = Pick<
  GeneratedTask,
  | "id"
  | "title"
  | "description"
  | "category"
  | "trackKey"
  | "pillar"
  | "difficulty"
  | "estimatedMinutes"
  | "xp"
  | "sourceName"
  | "sourceUrl"
  | "sourceNote"
  | "expectedEffect"
> & {
  activity: RecoveryActivity;
};

export const RECOVERY_TEMPLATES: RecoveryTemplate[] = [
  {
    id: "recovery-walk",
    activity: "walk",
    title: "Spokojny spacer",
    description: "Wyjdź na 15 minut spokojnego marszu bez mierzenia tempa.",
    category: "Cialo",
    trackKey: "recovery-walk",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 15,
    xp: 8,
    sourceName: "CDC Physical Activity",
    sourceUrl: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    sourceNote: "CDC opisuje regularny ruch jako podstawę zdrowia dorosłych.",
    expectedEffect: "Lekki ruch pomaga wrócić do energii bez dokładania mocnego obciążenia."
  },
  {
    id: "recovery-screen-break",
    activity: "screenBreak",
    title: "Przerwa od ekranu",
    description: "Odejdź od komputera na 10 minut i rozluźnij wzrok oraz barki.",
    category: "Skupienie",
    trackKey: "recovery-screen-break",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    xp: 6,
    sourceName: "CDC NIOSH Work From Home",
    sourceUrl: "https://www.cdc.gov/niosh/bulletin/2020/working-from-home.html",
    sourceNote: "NIOSH wskazuje przerwy i ergonomię jako ważne elementy pracy z domu.",
    expectedEffect: "Krótka przerwa zmniejsza przeciążenie uwagi i napięcie po pracy ekranowej."
  },
  {
    id: "recovery-calm-hobby",
    activity: "calmHobby",
    title: "Ciche hobby",
    description: "Poświęć 20 minut na spokojne zajęcie: muzykę, rysowanie, czytanie albo porządkowanie zdjęć.",
    category: "Umysl",
    trackKey: "recovery-calm-hobby",
    pillar: "confidence",
    difficulty: "light",
    estimatedMinutes: 20,
    xp: 8,
    sourceName: "NIMH Caring for Your Mental Health",
    sourceUrl: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    sourceNote: "NIMH zaleca dbanie o odpoczynek i aktywności wspierające zdrowie psychiczne.",
    expectedEffect: "Spokojna aktywność daje regenerację bez presji wyniku."
  },
  {
    id: "recovery-social-contact",
    activity: "socialContact",
    title: "Krótki kontakt",
    description: "Napisz lub zadzwoń do jednej życzliwej osoby i zamień kilka zdań.",
    category: "Relacje",
    trackKey: "recovery-social-contact",
    pillar: "relationships",
    difficulty: "light",
    estimatedMinutes: 10,
    xp: 8,
    sourceName: "HHS Social Connection",
    sourceUrl: "https://www.hhs.gov/surgeongeneral/reports-and-publications/connection/resources/index.html",
    sourceNote: "HHS podkreśla znaczenie więzi społecznych dla zdrowia i dobrostanu.",
    expectedEffect: "Mały kontakt społeczny może zmniejszyć izolację w słabszy dzień."
  },
  {
    id: "recovery-breathing",
    activity: "breathing",
    title: "Oddychanie przeponowe",
    description: "Przez 5 minut oddychaj wolno, skupiając uwagę na spokojnym wydechu.",
    category: "Energia",
    trackKey: "recovery-breathing",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 5,
    xp: 5,
    sourceName: "NCCIH Stress",
    sourceUrl: "https://www.nccih.nih.gov/health/relaxation-techniques-what-you-need-to-know",
    sourceNote: "NCCIH opisuje ćwiczenia oddechowe jako jedną z technik relaksacyjnych.",
    expectedEffect: "Powolny oddech pomaga obniżyć pobudzenie i wrócić do spokojnego rytmu."
  },
  {
    id: "recovery-sleep-routine",
    activity: "sleepRoutine",
    title: "Wieczorne wyciszenie",
    description: "Przygotuj 20-minutową rutynę snu: przygaś światło, odłóż ekran i ustaw jutrzejszy alarm.",
    category: "Energia",
    trackKey: "recovery-sleep-routine",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 20,
    xp: 8,
    sourceName: "NHLBI Healthy Sleep",
    sourceUrl: "https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits",
    sourceNote: "NHLBI zaleca stałe nawyki snu i środowisko sprzyjające odpoczynkowi.",
    expectedEffect: "Wyciszenie wieczorem wspiera sen, który jest podstawą regeneracji."
  },
  {
    id: "recovery-outdoors",
    activity: "outdoors",
    title: "Światło i powietrze",
    description: "Spędź 10 minut na zewnątrz albo przy otwartym oknie, bez telefonu w dłoni.",
    category: "Energia",
    trackKey: "recovery-outdoors",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    xp: 6,
    sourceName: "CDC NIOSH Work From Home",
    sourceUrl: "https://www.cdc.gov/niosh/bulletin/2020/working-from-home.html",
    sourceNote: "NIOSH zwraca uwagę na przerwy i zmianę otoczenia podczas pracy zdalnej.",
    expectedEffect: "Krótka zmiana bodźców może pomóc odświeżyć uwagę w niskiej energii."
  }
];

export function filterRecoveryTemplates(
  templates: RecoveryTemplate[],
  preferredActivities: RecoveryActivity[]
): RecoveryTemplate[] {
  return templates.filter((template) => preferredActivities.includes(template.activity));
}

export function isRecoveryMode(dayStates: DayState[], localDate: string): boolean {
  const end = addLocalDays(localDate, -1);
  const start = addLocalDays(localDate, -5);
  const lightDates = new Set(
    dayStates
      .filter(
        (dayState) =>
          dayState.intensity === "light" &&
          dayState.localDate >= start &&
          dayState.localDate <= end
      )
      .map((dayState) => dayState.localDate)
  );

  return lightDates.size >= 3;
}

function addLocalDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}
