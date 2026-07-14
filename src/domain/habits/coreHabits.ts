import type { Habit, HabitCategory, HabitDifficulty, HabitFrequency, HabitPillar, HabitType } from "../model";

export type HabitTemplate = Omit<Habit, "createdAt">;

const NHS_WELLBEING =
  "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/five-steps-to-mental-wellbeing/";
const NHS_HAPPIER = "https://www.nhs.uk/mental-health/self-help/tips-and-support/how-to-be-happier/";
const CDC_SLEEP = "https://www.cdc.gov/sleep/about/index.html";
const CDC_ACTIVITY = "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html";
const CFPB_FINANCE =
  "https://www.consumerfinance.gov/consumer-tools/educator-tools/adult-financial-education/tools-and-resources/";
const CAREERONESTOP = "https://www.careeronestop.org/";

const SOURCE_NOTES = {
  cfpb: "CFPB udostępnia narzędzia do planowania wydatków, rachunków, oszczędzania i decyzji finansowych.",
  career:
    "CareerOneStop wspiera planowanie kariery, rozwój umiejętności, CV, szukanie pracy i przygotowanie do rynku.",
  sleep: "CDC opisuje regularny sen i powtarzalne nawyki snu jako ważny element zdrowia dorosłych.",
  activity: "CDC rekomenduje dorosłym regularną aktywność fizyczną oraz ograniczanie długiego siedzenia.",
  wellbeing:
    "NHS wskazuje kontakt, aktywność, uważność, uczenie się i dawanie jako praktyki wspierające dobrostan.",
  happier: "NHS opisuje małe codzienne kroki wspierające samoocenę, równowagę, relacje i radzenie sobie ze stresem."
} as const;

type SourceKey = keyof typeof SOURCES;

const SOURCES = {
  cfpb: {
    sourceName: "CFPB Financial Education",
    sourceUrl: CFPB_FINANCE,
    sourceNote: SOURCE_NOTES.cfpb
  },
  career: {
    sourceName: "CareerOneStop",
    sourceUrl: CAREERONESTOP,
    sourceNote: SOURCE_NOTES.career
  },
  sleep: {
    sourceName: "CDC Sleep Basics",
    sourceUrl: CDC_SLEEP,
    sourceNote: SOURCE_NOTES.sleep
  },
  activity: {
    sourceName: "CDC Physical Activity",
    sourceUrl: CDC_ACTIVITY,
    sourceNote: SOURCE_NOTES.activity
  },
  wellbeing: {
    sourceName: "NHS Five Steps To Mental Wellbeing",
    sourceUrl: NHS_WELLBEING,
    sourceNote: SOURCE_NOTES.wellbeing
  },
  happier: {
    sourceName: "NHS How To Be Happier",
    sourceUrl: NHS_HAPPIER,
    sourceNote: SOURCE_NOTES.happier
  }
} as const;

type HabitInput = {
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
  type?: HabitType;
  minimumVersion?: string;
};

function habit(input: HabitInput): HabitTemplate {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    pillar: input.pillar,
    pack: "v0.3-core",
    trackKey: input.id,
    type: input.type ?? "habit",
    difficulty: input.difficulty,
    estimatedMinutes: input.estimatedMinutes,
    frequency: input.frequency,
    xp: input.xp,
    enabled: true,
    ...SOURCES[input.source],
    expectedEffect: input.expectedEffect,
    minimumVersion: input.minimumVersion
  };
}

export const CORE_HABITS: HabitTemplate[] = [
  habit({
    id: "money-scan",
    title: "Skan wydatków 10 minut",
    description: "Przejrzyj ostatnie wydatki i zapisz jedną obserwację.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "cfpb",
    expectedEffect: "mniejszy chaos finansowy"
  }),
  habit({
    id: "bill-check",
    title: "Kontrola najbliższego rachunku",
    description: "Sprawdź jeden nadchodzący rachunek albo termin płatności.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "weekly",
    xp: 15,
    source: "cfpb",
    expectedEffect: "mniej zaskoczeń w budżecie"
  }),
  habit({
    id: "subscription-review",
    title: "Przegląd jednej subskrypcji",
    description: "Sprawdź jedną cykliczną opłatę i zdecyduj: zostaje, pauza albo anulowanie.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "cfpb",
    expectedEffect: "większa kontrola kosztów stałych"
  }),
  habit({
    id: "savings-transfer",
    title: "Mikroprzelew oszczędnościowy",
    description: "Odłóż małą kwotę albo zaplanuj przelew na cel bez presji wysokiej sumy.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "weekly",
    xp: 20,
    source: "cfpb",
    expectedEffect: "regularniejszy nawyk oszczędzania"
  }),
  habit({
    id: "expense-category",
    title: "Jedna kategoria wydatków",
    description: "Wybierz jedną kategorię i sprawdź, czy koszt jest zgodny z planem miesiąca.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "cfpb",
    expectedEffect: "lepsza widoczność przepływu pieniędzy"
  }),
  habit({
    id: "cashflow-note",
    title: "Notatka cashflow",
    description: "Zapisz, co w tym tygodniu wpływa i co wychodzi z konta.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "cfpb",
    expectedEffect: "spokojniejszy obraz najbliższych dni"
  }),
  habit({
    id: "debt-step",
    title: "Jeden krok wobec zobowiązania",
    description: "Sprawdź saldo, termin albo minimalną płatność jednego zobowiązania.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "cfpb",
    expectedEffect: "mniej unikania trudnych finansów"
  }),
  habit({
    id: "purchase-pause",
    title: "Pauza przed zakupem",
    description: "Zapisz jeden planowany zakup i odłóż decyzję do jutra.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "cfpb",
    expectedEffect: "mniej impulsywnych decyzji"
  }),
  habit({
    id: "finance-folder",
    title: "Porządek w dokumentach finansowych",
    description: "Przenieś jeden rachunek, umowę albo potwierdzenie do właściwego miejsca.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "cfpb",
    expectedEffect: "łatwiejszy dostęp do danych"
  }),
  habit({
    id: "month-money-review",
    title: "Przegląd miesiąca finansowego",
    description: "Podsumuj trzy największe wydatki i jeden wniosek na kolejny miesiąc.",
    category: "Finanse",
    pillar: "finance",
    difficulty: "strong",
    estimatedMinutes: 25,
    frequency: "weekly",
    xp: 45,
    source: "cfpb",
    expectedEffect: "lepsze decyzje w kolejnym miesiącu",
    minimumVersion: "Zapisz tylko jeden największy wydatek i jedną obserwację."
  }),
  habit({
    id: "cv-line",
    title: "Jedna linijka CV",
    description: "Dopisz lub popraw jedną linijkę w CV, profilu albo portfolio.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "career",
    expectedEffect: "stałe porządkowanie profilu zawodowego"
  }),
  habit({
    id: "job-market-scan",
    title: "Skan rynku pracy",
    description: "Przejrzyj trzy ogłoszenia i zapisz jedną powtarzającą się umiejętność.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekly",
    xp: 35,
    source: "career",
    expectedEffect: "lepsza orientacja w wymaganiach rynku",
    minimumVersion: "Zapisz jedną umiejętność z jednego ogłoszenia."
  }),
  habit({
    id: "portfolio-proof",
    title: "Dowód do portfolio",
    description: "Dodaj notatkę, zrzut albo link pokazujący wykonaną pracę.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "career",
    expectedEffect: "więcej materiału do pokazania efektów"
  }),
  habit({
    id: "networking-touch",
    title: "Kontakt zawodowy",
    description: "Napisz krótką wiadomość do jednej osoby z branży lub poprzedniej pracy.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "career",
    expectedEffect: "utrzymanie słabych więzi zawodowych"
  }),
  habit({
    id: "interview-note",
    title: "Jedna odpowiedź rekrutacyjna",
    description: "Przygotuj krótką odpowiedź na jedno pytanie o doświadczenie.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "career",
    expectedEffect: "większa gotowość do rozmów"
  }),
  habit({
    id: "skill-gap",
    title: "Jedna luka kompetencyjna",
    description: "Wybierz jedną brakującą umiejętność i zapisz najmniejszy następny krok.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "career",
    expectedEffect: "jaśniejszy kierunek nauki"
  }),
  habit({
    id: "work-win-log",
    title: "Dziennik zawodowego efektu",
    description: "Zapisz jeden konkretny efekt pracy z dzisiaj lub tygodnia.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "career",
    expectedEffect: "mniej zapominania o realnych wynikach"
  }),
  habit({
    id: "process-improvement",
    title: "Usprawnienie procesu",
    description: "Znajdź jedną powtarzalną czynność i zapisz, jak ją uprościć.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekly",
    xp: 35,
    source: "career",
    expectedEffect: "lepsza organizacja pracy",
    minimumVersion: "Zapisz tylko nazwę czynności i jedną przeszkodę."
  }),
  habit({
    id: "learning-plan",
    title: "Plan jednej kompetencji",
    description: "Rozpisz trzy małe kroki do poprawy jednej kompetencji zawodowej.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "strong",
    estimatedMinutes: 25,
    frequency: "weekly",
    xp: 45,
    source: "career",
    expectedEffect: "bardziej konkretny rozwój kompetencji",
    minimumVersion: "Wybierz tylko pierwszy krok."
  }),
  habit({
    id: "weekly-career-review",
    title: "Tygodniowy przegląd kariery",
    description: "Podsumuj, co w tym tygodniu zwiększyło twoje opcje zawodowe.",
    category: "Rozwoj",
    pillar: "career",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekly",
    xp: 35,
    source: "career",
    expectedEffect: "utrzymanie kierunku rozwoju",
    minimumVersion: "Zapisz jeden fakt i jeden następny krok."
  }),
  habit({
    id: "focused-reading",
    title: "Czytanie z notatką",
    description: "Przeczytaj fragment materiału i zapisz jedno zdanie wniosku.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "light",
    estimatedMinutes: 15,
    frequency: "daily",
    xp: 25,
    source: "wellbeing",
    expectedEffect: "regularniejsze uczenie się"
  }),
  habit({
    id: "flashcard-five",
    title: "Pięć powtórek",
    description: "Powtórz pięć pojęć, słówek, komend albo zasad.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "career",
    expectedEffect: "utrwalenie małej porcji wiedzy"
  }),
  habit({
    id: "tutorial-step",
    title: "Jeden krok tutorialu",
    description: "Zrób jeden mały krok kursu lub tutorialu bez kończenia całości.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekdays",
    xp: 30,
    source: "career",
    expectedEffect: "postęp bez przeciążania",
    minimumVersion: "Zrób tylko pierwsze 5 minut."
  }),
  habit({
    id: "explain-concept",
    title: "Wyjaśnij jedno pojęcie",
    description: "Opisz prostymi słowami jedno pojęcie, które ostatnio poznałeś.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "wellbeing",
    expectedEffect: "lepsze rozumienie przez aktywne przypominanie"
  }),
  habit({
    id: "practice-block",
    title: "Blok ćwiczenia umiejętności",
    description: "Ćwicz jedną wybraną umiejętność przez krótki, zamknięty blok.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekdays",
    xp: 30,
    source: "career",
    expectedEffect: "więcej praktyki zamiast samego czytania",
    minimumVersion: "Ćwicz przez 7 minut."
  }),
  habit({
    id: "question-list",
    title: "Lista pytań",
    description: "Zapisz trzy pytania do tematu, który chcesz zrozumieć.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "wellbeing",
    expectedEffect: "jaśniejsze luki w wiedzy"
  }),
  habit({
    id: "mistake-review",
    title: "Przegląd jednego błędu",
    description: "Wybierz jeden błąd i zapisz, czego uczy na przyszłość.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "happier",
    expectedEffect: "spokojniejsze uczenie się na błędach"
  }),
  habit({
    id: "knowledge-link",
    title: "Połącz dwie informacje",
    description: "Połącz nową informację z czymś, co już znasz.",
    category: "Umysl",
    pillar: "learning",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "wellbeing",
    expectedEffect: "mocniejsze zapamiętywanie"
  }),
  habit({
    id: "sleep-shutdown",
    title: "Zamknięcie dnia przed snem",
    description: "Ustal godzinę wyciszenia i ogranicz ekran przed snem.",
    category: "Energia",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "sleep",
    expectedEffect: "stabilniejsza energia",
    minimumVersion: "Zapisz tylko godzinę, o której chcesz się położyć."
  }),
  habit({
    id: "wake-anchor",
    title: "Stała kotwica poranka",
    description: "Ustal jedną powtarzalną godzinę pobudki lub pierwszy krok po wstaniu.",
    category: "Energia",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "sleep",
    expectedEffect: "bardziej przewidywalny rytm dnia"
  }),
  habit({
    id: "caffeine-cutoff",
    title: "Granica kofeiny",
    description: "Zapisz godzinę, po której dzisiaj nie pijesz kofeiny.",
    category: "Energia",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "sleep",
    expectedEffect: "lepsze warunki do snu"
  }),
  habit({
    id: "bedroom-reset",
    title: "Reset sypialni",
    description: "Przygotuj sypialnię do snu: światło, temperatura albo porządek przy łóżku.",
    category: "Energia",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "sleep",
    expectedEffect: "łatwiejsze wyciszenie"
  }),
  habit({
    id: "walk-10m",
    title: "Spacer 10 minut",
    description: "Wyjdź na lekki spacer bez liczenia tempa.",
    category: "Cialo",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 15,
    source: "activity",
    expectedEffect: "większa energia i mniej siedzenia"
  }),
  habit({
    id: "movement-break",
    title: "Przerwa ruchowa",
    description: "Wstań od biurka i poruszaj się przez kilka minut.",
    category: "Cialo",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "activity",
    expectedEffect: "przerwanie długiego siedzenia"
  }),
  habit({
    id: "stretch-reset",
    title: "Krótkie rozciąganie",
    description: "Zrób spokojny zestaw rozciągania lub mobilizacji.",
    category: "Cialo",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "activity",
    expectedEffect: "mniej sztywności w ciele"
  }),
  habit({
    id: "strength-session",
    title: "Krótka sesja wzmacniająca",
    description: "Zrób proste ćwiczenia wzmacniające całe ciało.",
    category: "Cialo",
    pillar: "energy",
    difficulty: "strong",
    estimatedMinutes: 25,
    frequency: "twoPerWeek",
    xp: 40,
    source: "activity",
    expectedEffect: "lepsza baza fizyczna",
    minimumVersion: "Zrób 5 minut mobilizacji albo 10 przysiadów."
  }),
  habit({
    id: "brisk-walk",
    title: "Szybszy spacer",
    description: "Idź energiczniej przez krótki odcinek, bez presji treningu.",
    category: "Cialo",
    pillar: "energy",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekly",
    xp: 30,
    source: "activity",
    expectedEffect: "więcej umiarkowanej aktywności",
    minimumVersion: "Idź energicznie przez 7 minut."
  }),
  habit({
    id: "hydration-check",
    title: "Sprawdzenie nawodnienia",
    description: "Wypij wodę i ustaw jedną widoczną przypominajkę o piciu.",
    category: "Energia",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "activity",
    expectedEffect: "łatwiejsze dbanie o podstawy energii"
  }),
  habit({
    id: "evening-winddown",
    title: "Wieczorne wyciszenie",
    description: "Zrób jedną spokojną czynność kończącą dzień.",
    category: "Energia",
    pillar: "energy",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "sleep",
    expectedEffect: "mniej gwałtownego wejścia w sen"
  }),
  habit({
    id: "weekly-activity-plan",
    title: "Plan aktywności tygodnia",
    description: "Wybierz dwa realne okna na ruch w tym tygodniu.",
    category: "Cialo",
    pillar: "energy",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "activity",
    expectedEffect: "większa szansa na regularny ruch"
  }),
  habit({
    id: "inbox-zero-five",
    title: "Pięć minut skrzynki",
    description: "Usuń, odłóż albo zaplanuj kilka wiadomości przez pięć minut.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "happier",
    expectedEffect: "mniej cyfrowego bałaganu"
  }),
  habit({
    id: "desk-reset",
    title: "Reset biurka",
    description: "Odłóż rzeczy z blatu i zostaw tylko to, co potrzebne do kolejnego kroku.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "happier",
    expectedEffect: "łatwiejszy start pracy"
  }),
  habit({
    id: "one-delayed-thing",
    title: "Jedna odkładana rzecz",
    description: "Wybierz małą zaległość i poświęć jej 10 minut.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "happier",
    expectedEffect: "mniej zaległości w tle"
  }),
  habit({
    id: "calendar-check",
    title: "Kontrola kalendarza",
    description: "Sprawdź jutro i zapisz jedną rzecz do przygotowania.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "happier",
    expectedEffect: "mniej porannego chaosu"
  }),
  habit({
    id: "file-one-doc",
    title: "Jeden dokument na miejsce",
    description: "Nazwij, przenieś albo zarchiwizuj jeden plik lub dokument.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "happier",
    expectedEffect: "lepszy porządek w rzeczach"
  }),
  habit({
    id: "weekly-reset",
    title: "Tygodniowy reset spraw",
    description: "Zapisz trzy otwarte sprawy i wybierz jedną do zamknięcia.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "normal",
    estimatedMinutes: 20,
    frequency: "weekly",
    xp: 35,
    source: "happier",
    expectedEffect: "jaśniejszy obraz zobowiązań",
    minimumVersion: "Zapisz jedną otwartą sprawę."
  }),
  habit({
    id: "friction-remove",
    title: "Usuń jedną przeszkodę",
    description: "Znajdź jedną rzecz, która utrudnia dobry nawyk, i uprość ją.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "happier",
    expectedEffect: "łatwiejsze powtarzanie dobrych kroków"
  }),
  habit({
    id: "prepare-tomorrow",
    title: "Przygotuj jutro",
    description: "Przygotuj jeden przedmiot, notatkę albo miejsce potrzebne jutro.",
    category: "Porzadek",
    pillar: "order",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "daily",
    xp: 20,
    source: "happier",
    expectedEffect: "spokojniejszy start kolejnego dnia"
  }),
  habit({
    id: "social-touchpoint",
    title: "Kontakt z jedną osobą",
    description: "Napisz albo odezwij się do jednej osoby bez wielkiego planowania.",
    category: "Relacje",
    pillar: "relationships",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "wellbeing",
    expectedEffect: "utrzymanie relacji"
  }),
  habit({
    id: "gratitude-message",
    title: "Wiadomość z docenieniem",
    description: "Wyślij krótką wiadomość z konkretnym podziękowaniem lub uznaniem.",
    category: "Relacje",
    pillar: "relationships",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "wellbeing",
    expectedEffect: "więcej pozytywnego kontaktu"
  }),
  habit({
    id: "listen-better",
    title: "Jedno pytanie słuchające",
    description: "Zadaj jednej osobie pytanie i wysłuchaj odpowiedzi bez poprawiania.",
    category: "Relacje",
    pillar: "relationships",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "wellbeing",
    expectedEffect: "lepsza jakość rozmów"
  }),
  habit({
    id: "plan-meetup",
    title: "Zaplanuj kontakt",
    description: "Zaproponuj termin rozmowy, spaceru albo spotkania jednej osobie.",
    category: "Relacje",
    pillar: "relationships",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "wellbeing",
    expectedEffect: "więcej realnego czasu z ludźmi"
  }),
  habit({
    id: "repair-small",
    title: "Mała naprawa relacji",
    description: "Wróć do jednej niedomkniętej sprawy i wykonaj łagodny krok naprawczy.",
    category: "Relacje",
    pillar: "relationships",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "wellbeing",
    expectedEffect: "mniej napięcia w tle"
  }),
  habit({
    id: "help-one-person",
    title: "Pomóż jednej osobie",
    description: "Zrób drobną rzecz, która realnie ułatwi komuś dzień.",
    category: "Relacje",
    pillar: "relationships",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "wellbeing",
    expectedEffect: "więcej poczucia połączenia"
  }),
  habit({
    id: "progress-evidence",
    title: "Dowód postępu",
    description: "Zapisz jedną rzecz, która dziś realnie ruszyłeś do przodu.",
    category: "Skupienie",
    pillar: "confidence",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "happier",
    expectedEffect: "mniej porównywania się z innymi"
  }),
  habit({
    id: "self-respect-promise",
    title: "Mała obietnica dla siebie",
    description: "Wybierz jedną bardzo małą obietnicę i wykonaj ją dzisiaj.",
    category: "Skupienie",
    pillar: "confidence",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "happier",
    expectedEffect: "więcej zaufania do siebie"
  }),
  habit({
    id: "discomfort-rep",
    title: "Powtórka dyskomfortu",
    description: "Zrób jeden mały krok, którego unikasz, ale który jest bezpieczny i sensowny.",
    category: "Skupienie",
    pillar: "confidence",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "happier",
    expectedEffect: "większa tolerancja trudniejszych kroków"
  }),
  habit({
    id: "values-check",
    title: "Kontrola wartości",
    description: "Zapisz, czy dzisiejszy plan pasuje do jednej ważnej dla ciebie wartości.",
    category: "Skupienie",
    pillar: "confidence",
    difficulty: "light",
    estimatedMinutes: 10,
    frequency: "weekly",
    xp: 20,
    source: "wellbeing",
    expectedEffect: "lepsza zgodność działań z priorytetami"
  }),
  habit({
    id: "compare-less",
    title: "Mniej porównywania",
    description: "Zauważ jedno porównanie i zamień je na konkretne pytanie: jaki mój następny krok.",
    category: "Skupienie",
    pillar: "confidence",
    difficulty: "light",
    estimatedMinutes: 5,
    frequency: "daily",
    xp: 15,
    source: "happier",
    expectedEffect: "więcej sprawczości"
  }),
  habit({
    id: "weekly-win-review",
    title: "Przegląd małych wygranych",
    description: "Zapisz trzy małe wygrane z tygodnia i jedną rzecz do utrzymania.",
    category: "Skupienie",
    pillar: "confidence",
    difficulty: "normal",
    estimatedMinutes: 15,
    frequency: "weekly",
    xp: 30,
    source: "happier",
    expectedEffect: "stabilniejsze poczucie progresu"
  })
];

if (CORE_HABITS.length !== 60) {
  throw new Error(`CORE_HABITS must contain exactly 60 habits, got ${CORE_HABITS.length}.`);
}
