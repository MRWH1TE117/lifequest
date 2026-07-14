import type {
  HabitCategory,
  HabitDifficulty,
  HabitFrequency,
  HabitPillar
} from "../model";
import type { HabitTemplate } from "./coreHabits";

const SOURCES = {
  activity: {
    sourceName: "CDC Physical Activity",
    sourceUrl: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    sourceNote: "CDC zaleca dorosłym regularny ruch, ćwiczenia wzmacniające oraz ograniczanie długiego siedzenia."
  },
  sleep: {
    sourceName: "NHLBI Healthy Sleep",
    sourceUrl: "https://www.nhlbi.nih.gov/health/heart-healthy-living/sleep",
    sourceNote: "NHLBI opisuje regularny rytm, światło, aktywność i warunki sypialni jako elementy zdrowego snu."
  },
  breaks: {
    sourceName: "CDC NIOSH Work From Home",
    sourceUrl: "https://www.cdc.gov/niosh/bulletin/2020/working-from-home.html",
    sourceNote: "NIOSH rekomenduje regularne przerwy, zmianę pozycji, ochronę wzroku i wyraźne granice pracy."
  },
  mental: {
    sourceName: "NIMH Caring for Your Mental Health",
    sourceUrl: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    sourceNote: "NIMH wskazuje sen, ruch, relaks, priorytety i kontakt z ludźmi jako praktyczne elementy samoopieki."
  },
  emotional: {
    sourceName: "NIH Emotional Wellness Toolkit",
    sourceUrl: "https://www.nih.gov/health-information/your-healthiest-self-wellness-toolkits/emotional-wellness-toolkit",
    sourceNote: "NIH opisuje odporność psychiczną, uważność, wdzięczność i wsparcie społeczne jako elementy dobrostanu."
  },
  connection: {
    sourceName: "HHS Social Connection",
    sourceUrl: "https://www.hhs.gov/surgeongeneral/reports-and-publications/connection/resources/index.html",
    sourceNote: "HHS podkreśla znaczenie regularnego kontaktu, wzajemności i uczestnictwa w relacjach społecznych."
  },
  finance: {
    sourceName: "CFPB Consumer Resources",
    sourceUrl: "https://www.consumerfinance.gov/consumer-tools/",
    sourceNote: "CFPB udostępnia praktyczne narzędzia do kontroli wydatków, planowania rachunków i oszczędzania."
  },
  career: {
    sourceName: "CareerOneStop",
    sourceUrl: "https://www.careeronestop.org/",
    sourceNote: "CareerOneStop wspiera ocenę umiejętności, planowanie kariery, naukę oraz przygotowanie do rekrutacji."
  }
} as const;

type SourceKey = keyof typeof SOURCES;
type Input = {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  pillar: HabitPillar;
  difficulty: HabitDifficulty;
  estimatedMinutes: number;
  frequency: HabitFrequency;
  xp: number;
  source: SourceKey;
  expectedEffect: string;
};

function balancedHabit(input: Input): HabitTemplate {
  return {
    ...input,
    pack: "v0.5-balanced",
    trackKey: input.id,
    type: "habit",
    enabled: true,
    ...SOURCES[input.source],
    minimumVersion: "Zrób wersję trwającą 2 minuty."
  };
}

export const BALANCED_HABITS: HabitTemplate[] = [
  balancedHabit({ id: "morning-daylight", title: "Poranne światło", description: "Spędź 10 minut na zewnątrz po rozpoczęciu dnia.", category: "Energia", pillar: "energy", difficulty: "light", estimatedMinutes: 10, frequency: "daily", xp: 20, source: "sleep", expectedEffect: "stabilniejszy rytm dobowy" }),
  balancedHabit({ id: "fixed-wake-time", title: "Stała pora pobudki", description: "Wstań o zaplanowanej porze z tolerancją do 30 minut.", category: "Energia", pillar: "energy", difficulty: "normal", estimatedMinutes: 2, frequency: "daily", xp: 20, source: "sleep", expectedEffect: "bardziej regularny sen" }),
  balancedHabit({ id: "evening-light-down", title: "Przygaś światło wieczorem", description: "Na godzinę przed snem ogranicz jasne światło i ekran.", category: "Energia", pillar: "energy", difficulty: "normal", estimatedMinutes: 5, frequency: "daily", xp: 20, source: "sleep", expectedEffect: "łatwiejsze wyciszenie" }),
  balancedHabit({ id: "afternoon-caffeine-cutoff", title: "Granica dla kofeiny", description: "Nie pij kofeiny w drugiej części dnia.", category: "Energia", pillar: "energy", difficulty: "normal", estimatedMinutes: 2, frequency: "daily", xp: 20, source: "sleep", expectedEffect: "mniejsze zakłócenia snu" }),
  balancedHabit({ id: "energy-check", title: "Skan poziomu energii", description: "Oceń energię od 1 do 5 i dopasuj obciążenie dnia.", category: "Energia", pillar: "energy", difficulty: "light", estimatedMinutes: 3, frequency: "daily", xp: 15, source: "mental", expectedEffect: "lepsze zarządzanie obciążeniem" }),
  balancedHabit({ id: "recovery-window", title: "Okno regeneracji", description: "Zaplanuj 20 minut bez pracy i obowiązków.", category: "Energia", pillar: "energy", difficulty: "normal", estimatedMinutes: 20, frequency: "daily", xp: 25, source: "mental", expectedEffect: "mniejsze przeciążenie" }),
  balancedHabit({ id: "sleep-room-check", title: "Przygotuj sypialnię", description: "Zadbaj wieczorem o ciszę, ciemność i komfortową temperaturę.", category: "Energia", pillar: "energy", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "sleep", expectedEffect: "lepsze warunki snu" }),

  balancedHabit({ id: "brisk-walk-10", title: "Szybki spacer 10 minut", description: "Idź energicznym krokiem przez co najmniej 10 minut.", category: "Cialo", pillar: "energy", difficulty: "light", estimatedMinutes: 10, frequency: "daily", xp: 20, source: "activity", expectedEffect: "więcej codziennego ruchu" }),
  balancedHabit({ id: "strength-set", title: "Jedna seria siłowa", description: "Wykonaj jedną serię ćwiczeń na główne grupy mięśni.", category: "Cialo", pillar: "energy", difficulty: "normal", estimatedMinutes: 10, frequency: "twoPerWeek", xp: 25, source: "activity", expectedEffect: "regularniejsze wzmacnianie ciała" }),
  balancedHabit({ id: "stairs-choice", title: "Wybierz schody", description: "Przynajmniej raz wybierz schody zamiast windy.", category: "Cialo", pillar: "energy", difficulty: "light", estimatedMinutes: 3, frequency: "daily", xp: 10, source: "activity", expectedEffect: "więcej ruchu w rutynie" }),
  balancedHabit({ id: "mobility-hips", title: "Mobilność bioder", description: "Poświęć 5 minut na łagodne ruchy bioder i nóg.", category: "Cialo", pillar: "energy", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "activity", expectedEffect: "mniejsza sztywność po siedzeniu" }),
  balancedHabit({ id: "posture-change", title: "Zmień pozycję pracy", description: "Przynajmniej raz pracuj chwilę stojąc lub spacerując.", category: "Cialo", pillar: "energy", difficulty: "light", estimatedMinutes: 5, frequency: "weekdays", xp: 15, source: "breaks", expectedEffect: "mniej długiego siedzenia" }),
  balancedHabit({ id: "movement-calendar", title: "Zaplanuj ruch w kalendarzu", description: "Zarezerwuj konkretny termin następnej aktywności.", category: "Cialo", pillar: "energy", difficulty: "light", estimatedMinutes: 3, frequency: "weekly", xp: 15, source: "activity", expectedEffect: "większa regularność aktywności" }),
  balancedHabit({ id: "walk-after-meal", title: "Spacer po posiłku", description: "Po jednym posiłku przejdź się spokojnie przez 10 minut.", category: "Cialo", pillar: "energy", difficulty: "light", estimatedMinutes: 10, frequency: "daily", xp: 20, source: "activity", expectedEffect: "mniej czasu spędzanego siedząc" }),

  balancedHabit({ id: "focus-block-25", title: "Blok skupienia 25 minut", description: "Pracuj nad jednym zadaniem bez przełączania kontekstu.", category: "Skupienie", pillar: "career", difficulty: "normal", estimatedMinutes: 25, frequency: "weekdays", xp: 30, source: "breaks", expectedEffect: "dłuższa nieprzerwana uwaga" }),
  balancedHabit({ id: "hourly-screen-break", title: "Przerwa od ekranu", description: "Po godzinie pracy odejdź od ekranu na 5 minut.", category: "Skupienie", pillar: "energy", difficulty: "light", estimatedMinutes: 5, frequency: "weekdays", xp: 15, source: "breaks", expectedEffect: "mniejsze zmęczenie wzroku" }),
  balancedHabit({ id: "top-one-task", title: "Jedno zadanie najważniejsze", description: "Wskaż jedną rzecz, która ma dziś pierwszeństwo.", category: "Skupienie", pillar: "career", difficulty: "light", estimatedMinutes: 3, frequency: "daily", xp: 15, source: "mental", expectedEffect: "jaśniejszy priorytet dnia" }),
  balancedHabit({ id: "notification-window", title: "Okno bez powiadomień", description: "Wycisz powiadomienia na jeden zaplanowany blok pracy.", category: "Skupienie", pillar: "career", difficulty: "light", estimatedMinutes: 25, frequency: "weekdays", xp: 25, source: "breaks", expectedEffect: "mniej przerwań podczas pracy" }),
  balancedHabit({ id: "workday-shutdown", title: "Zamknięcie dnia pracy", description: "Zapisz następny krok i zakończ pracę o ustalonej porze.", category: "Skupienie", pillar: "career", difficulty: "normal", estimatedMinutes: 5, frequency: "weekdays", xp: 20, source: "breaks", expectedEffect: "wyraźniejsza granica pracy" }),
  balancedHabit({ id: "single-tab-start", title: "Start z jednym oknem", description: "Rozpocznij ważne zadanie z zamkniętymi zbędnymi kartami.", category: "Skupienie", pillar: "career", difficulty: "light", estimatedMinutes: 3, frequency: "weekdays", xp: 15, source: "breaks", expectedEffect: "mniej bodźców konkurujących o uwagę" }),
  balancedHabit({ id: "fatigue-pause", title: "Reakcja na zmęczenie", description: "Gdy spada koncentracja, zrób krótką przerwę zamiast forsować tempo.", category: "Skupienie", pillar: "energy", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "breaks", expectedEffect: "mniej błędów wynikających ze zmęczenia" }),

  balancedHabit({ id: "emotion-name", title: "Nazwij emocję", description: "Zapisz jedną odczuwaną emocję i sytuację, która jej towarzyszy.", category: "Umysl", pillar: "confidence", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "emotional", expectedEffect: "większa świadomość emocji" }),
  balancedHabit({ id: "three-breath-reset", title: "Trzy spokojne oddechy", description: "Zatrzymaj się i wykonaj trzy wolne, świadome oddechy.", category: "Umysl", pillar: "confidence", difficulty: "light", estimatedMinutes: 2, frequency: "daily", xp: 10, source: "mental", expectedEffect: "krótkie obniżenie napięcia" }),
  balancedHabit({ id: "gratitude-specific", title: "Konkretna wdzięczność", description: "Zapisz jedną konkretną rzecz, za którą jesteś dziś wdzięczny.", category: "Umysl", pillar: "confidence", difficulty: "light", estimatedMinutes: 3, frequency: "daily", xp: 15, source: "emotional", expectedEffect: "więcej uwagi dla pozytywnych doświadczeń" }),
  balancedHabit({ id: "stress-trigger-note", title: "Rozpoznaj źródło stresu", description: "Zapisz stresor oraz jedną rzecz, na którą masz wpływ.", category: "Umysl", pillar: "confidence", difficulty: "normal", estimatedMinutes: 7, frequency: "daily", xp: 20, source: "mental", expectedEffect: "bardziej konkretna reakcja na stres" }),

  balancedHabit({ id: "skill-gap-note", title: "Jedna luka kompetencyjna", description: "Wskaż umiejętność potrzebną w interesującej Cię roli.", category: "Rozwoj", pillar: "career", difficulty: "normal", estimatedMinutes: 10, frequency: "weekly", xp: 25, source: "career", expectedEffect: "jaśniejszy kierunek rozwoju" }),
  balancedHabit({ id: "career-evidence", title: "Dowód kompetencji", description: "Zapisz jeden konkretny przykład użycia ważnej umiejętności.", category: "Rozwoj", pillar: "career", difficulty: "normal", estimatedMinutes: 10, frequency: "weekly", xp: 25, source: "career", expectedEffect: "lepsze przygotowanie do rekrutacji" }),

  balancedHabit({ id: "expense-receipt-check", title: "Sprawdź jeden paragon", description: "Przypisz jeden zakup do właściwej kategorii budżetu.", category: "Finanse", pillar: "finance", difficulty: "light", estimatedMinutes: 3, frequency: "daily", xp: 15, source: "finance", expectedEffect: "dokładniejsza kontrola wydatków" }),
  balancedHabit({ id: "emergency-saving-step", title: "Krok do funduszu awaryjnego", description: "Odłóż małą kwotę lub zaplanuj najbliższą wpłatę.", category: "Finanse", pillar: "finance", difficulty: "light", estimatedMinutes: 5, frequency: "weekly", xp: 20, source: "finance", expectedEffect: "większa odporność na nagłe wydatki" }),

  balancedHabit({ id: "send-check-in", title: "Krótki kontakt", description: "Napisz do jednej osoby i szczerze zapytaj, co u niej.", category: "Relacje", pillar: "relationships", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "connection", expectedEffect: "częstszy kontakt społeczny" }),
  balancedHabit({ id: "shared-meal", title: "Wspólny posiłek", description: "Zjedz jeden posiłek z drugą osobą bez telefonu.", category: "Relacje", pillar: "relationships", difficulty: "normal", estimatedMinutes: 20, frequency: "weekly", xp: 25, source: "connection", expectedEffect: "więcej jakościowego czasu razem" }),
  balancedHabit({ id: "offer-specific-help", title: "Zaproponuj konkretną pomoc", description: "Zaoferuj jednej osobie małą, konkretną formę wsparcia.", category: "Relacje", pillar: "relationships", difficulty: "normal", estimatedMinutes: 5, frequency: "weekly", xp: 20, source: "connection", expectedEffect: "większa wzajemność w relacjach" }),
  balancedHabit({ id: "listen-without-fixing", title: "Słuchaj bez naprawiania", description: "W jednej rozmowie najpierw wysłuchaj i dopytaj, zamiast od razu doradzać.", category: "Relacje", pillar: "relationships", difficulty: "normal", estimatedMinutes: 10, frequency: "daily", xp: 25, source: "connection", expectedEffect: "lepsza jakość rozmów" }),
  balancedHabit({ id: "thank-someone", title: "Podziękuj konkretnie", description: "Podziękuj jednej osobie, wskazując za co dokładnie.", category: "Relacje", pillar: "relationships", difficulty: "light", estimatedMinutes: 3, frequency: "daily", xp: 15, source: "emotional", expectedEffect: "więcej docenienia w relacjach" }),
  balancedHabit({ id: "plan-social-time", title: "Zaplanuj spotkanie", description: "Ustal konkretny termin kontaktu lub spotkania z bliską osobą.", category: "Relacje", pillar: "relationships", difficulty: "normal", estimatedMinutes: 5, frequency: "weekly", xp: 20, source: "connection", expectedEffect: "bardziej regularne relacje" }),
  balancedHabit({ id: "community-step", title: "Mały krok do społeczności", description: "Sprawdź wydarzenie, grupę lub aktywność zgodną z Twoimi zainteresowaniami.", category: "Relacje", pillar: "relationships", difficulty: "normal", estimatedMinutes: 10, frequency: "weekly", xp: 25, source: "connection", expectedEffect: "więcej okazji do przynależności" }),

  balancedHabit({ id: "workplace-reset", title: "Reset miejsca pracy", description: "Odłóż zbędne przedmioty i przygotuj blat do następnego zadania.", category: "Porzadek", pillar: "order", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "breaks", expectedEffect: "mniej rozpraszającego bałaganu" }),
  balancedHabit({ id: "tomorrow-ready", title: "Przygotuj jutro", description: "Wieczorem przygotuj jedną rzecz potrzebną rano.", category: "Porzadek", pillar: "order", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "mental", expectedEffect: "łatwiejszy start następnego dnia" }),
  balancedHabit({ id: "calendar-conflict-check", title: "Sprawdź konflikty w kalendarzu", description: "Przejrzyj najbliższe trzy dni i usuń jeden konflikt lub brak.", category: "Porzadek", pillar: "order", difficulty: "light", estimatedMinutes: 5, frequency: "daily", xp: 15, source: "mental", expectedEffect: "mniej niespodzianek organizacyjnych" }),
  balancedHabit({ id: "one-item-home", title: "Jedna rzecz na miejsce", description: "Odłóż jedną zalegającą rzecz dokładnie tam, gdzie powinna być.", category: "Porzadek", pillar: "order", difficulty: "light", estimatedMinutes: 2, frequency: "daily", xp: 10, source: "mental", expectedEffect: "stopniowo mniejszy bałagan" })
];

if (BALANCED_HABITS.length !== 40) {
  throw new Error(`BALANCED_HABITS must contain exactly 40 habits, got ${BALANCED_HABITS.length}.`);
}
