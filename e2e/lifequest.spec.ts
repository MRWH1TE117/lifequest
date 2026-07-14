import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const STORAGE_KEY = "lifequest-rpg-state-v1";

function addLocalDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test("user can complete a quest and export data", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LifeQuest", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dzisiejsze zadania" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Otwórz pełne postępy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Arkusz postępu" })).toHaveCount(0);
  await expect(page.getByText("LifeQuest v0.9.0")).toBeVisible();
  await page.getByRole("button", { name: "Ustawienia" }).click();
  await expect(page.getByRole("heading", { name: "Personalizacja planu" })).toBeVisible();
  await page.getByLabel("Energia").check();
  await page.getByLabel("Finanse").check();
  await page.getByLabel("Rozwój").check();
  await expect(page.getByText("3/3 wybrane")).toBeVisible();
  await expect(page.getByLabel("Relacje")).toBeDisabled();
  await page.getByLabel("Przerwa od ekranu").uncheck();
  await expect(page.getByLabel("Przerwa od ekranu")).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dzisiejsze zadania" })).toBeVisible();
  await page.getByRole("button", { name: "Ustawienia" }).click();
  await expect(page.getByLabel("Energia")).toBeChecked();
  await expect(page.getByLabel("Finanse")).toBeChecked();
  await expect(page.getByLabel("Rozwój")).toBeChecked();
  await expect(page.getByLabel("Relacje")).toBeDisabled();
  await expect(page.getByLabel("Przerwa od ekranu")).not.toBeChecked();
  const today = await page.evaluate(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await page.evaluate(
    ({ storageKey, today }) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) throw new Error("Missing LifeQuest state");
      const state = JSON.parse(raw);
      const seedDates = [-1, -2, -3].map((offset) => {
        const date = new Date(`${today}T12:00:00`);
        date.setDate(date.getDate() + offset);
        return date.toISOString().slice(0, 10);
      });
      const seededDayStates = seedDates.map((localDate) => ({
        localDate,
        intensity: "light",
        energyNote: "",
        generatedPlanId: null,
        updatedAt: new Date().toISOString()
      }));
      state.dayStates = [
        ...state.dayStates.filter((item: { localDate: string }) => item.localDate !== today && !seedDates.includes(item.localDate)),
        ...seededDayStates
      ];
      state.dailyPlans = state.dailyPlans.filter((plan: { localDate: string }) => plan.localDate !== today);
      state.completions = state.completions.filter((completion: { localDate: string }) => completion.localDate !== today);
      localStorage.setItem(storageKey, JSON.stringify(state, null, 2));
    },
    { storageKey: STORAGE_KEY, today }
  );
  await page.reload();
  await expect(page.getByText("Tryb regeneracji")).toBeVisible();
  await expect(page.getByText("0/3 wykonane")).toBeVisible();
  await page.getByRole("button", { name: "Otwórz pełne postępy" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard postępów" })).toBeVisible();
  await page.getByRole("button", { name: /dzisiejsze zadania/i }).click();
  await expect(page.getByRole("heading", { name: "Plan automatyczny" })).toBeVisible();
  const regenerateButton = page.getByRole("button", { name: "Generuj ponownie" });
  await expect(regenerateButton).toBeVisible();
  const initialGeneratedTitles = await page.locator("article.generated h4").allTextContents();
  await regenerateButton.click();
  await expect.poll(async () => page.locator("article.generated h4").allTextContents()).not.toEqual(initialGeneratedTitles);
  await expect(page.getByRole("button", { name: "Przelicz" })).toHaveCount(0);
  await page.getByRole("button", { name: "Dzisiaj lekko" }).click();
  await expect(page.getByRole("button", { name: "Dzisiaj lekko" })).toHaveClass(/active/);
  await expect(page.getByLabel("Nazwa wygenerowanego zadania")).toHaveCount(0);
  const generatedTask = page.locator("article.generated").first();
  await generatedTask.getByRole("button", { name: "Edytuj" }).click();
  const generatedTitle = generatedTask.getByLabel("Nazwa wygenerowanego zadania");
  await generatedTitle.fill("Mój mikrocel na dziś");
  await expect(generatedTitle).toHaveValue("Mój mikrocel na dziś");
  await generatedTask.getByRole("button", { name: "Gotowe" }).click();
  await expect(generatedTask.getByLabel("Nazwa wygenerowanego zadania")).toHaveCount(0);
  await expect(generatedTask.getByText("Mój mikrocel na dziś")).toBeVisible();
  await generatedTask.getByRole("button", { name: "Pomiń" }).click();
  await expect(generatedTask.getByRole("button", { name: "Pominięto" })).toBeVisible();
  await expect(generatedTask.getByRole("button", { name: "Pominięto" })).toBeDisabled();
  await page.locator("article.generated").nth(1).getByRole("button", { name: "Wykonaj" }).click();
  await expect(page.getByText(/XP dzisiaj/i)).toBeVisible();
  await page.getByRole("button", { name: /habity/i }).click();
  await expect(page.getByRole("heading", { name: "Habity" })).toBeVisible();
  await expect(page.getByText("Profesjonalna biblioteka")).toBeVisible();
  await expect(page.getByRole("link", { name: "Źródło" }).first()).toBeVisible();
  await page.getByLabel("Kategoria habitów").selectOption("Finanse");
  await expect(page.getByText(/Finanse/).first()).toBeVisible();
  await page.getByLabel("Trudność habitów").selectOption("light");
  await page.getByLabel("Status habitów").selectOption("enabled");
  await expect(page.getByText(/Pokazuje \d+ z \d+ habitów\. W kategorii Finanse łącznie aktywne: 12\./i)).toBeVisible();
  const visibleHabitCards = page.locator(".habit-grid .habit-card");
  await expect(visibleHabitCards.first()).toBeVisible();
  const visibleHabitCardTexts = await visibleHabitCards.allTextContents();
  expect(visibleHabitCardTexts.length).toBeGreaterThan(0);
  for (const cardText of visibleHabitCardTexts) {
    expect(cardText).toContain("Finanse");
    expect(cardText).toContain("lekki");
  }
  await page.getByRole("button", { name: "Postępy", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dashboard postępów" })).toBeVisible();
  await expect(page.getByRole("button", { name: "7 dni" })).toHaveClass(/active/);
  await expect(page.getByText("Wykonanie planu")).toBeVisible();
  await page.getByRole("button", { name: "30 dni" }).click();
  await expect(page.getByRole("button", { name: "30 dni" })).toHaveClass(/active/);
  await expect(page.getByText(/Aktywne dni/i)).toBeVisible();
  await expect(page.getByText(/Aktywność ręczna/i)).toBeVisible();
  await page.getByRole("button", { name: /dane/i }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /eksportuj kopię json/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^lifequest-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error("Missing downloaded backup path");
  const backup = JSON.parse(await readFile(downloadPath, "utf8"));
  expect(backup).toMatchObject({
    format: "lifequest-backup",
    formatVersion: 1,
    appVersion: "0.9.0",
    dataVersion: 4,
    state: { settings: { dataVersion: 4 } }
  });
  const persistedJson = await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) throw new Error("Missing LifeQuest state");
    return JSON.parse(raw);
  }, STORAGE_KEY);
  expect(persistedJson.settings.dataVersion).toBe(4);
  expect(persistedJson.dayStates.map((item: { localDate: string }) => item.localDate)).toEqual(
    expect.arrayContaining([addLocalDays(today, -1), addLocalDays(today, -2), addLocalDays(today, -3)])
  );
});

test("dashboard shows a neutral state before the first activity", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");

  await page.getByRole("button", { name: "Postępy", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dashboard postępów" })).toBeVisible();
  await expect(page.getByText("Za mało danych")).toBeVisible();
  await expect(page.getByText("Brak danych")).toBeVisible();
});

test("desktop sidebar keeps the version visible while content scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 600 });
  await page.goto("/");
  await page.getByRole("button", { name: "Habity" }).click();

  const sidebar = page.locator("aside.sidebar");
  const version = page.getByText("LifeQuest v0.9.0");
  await expect(version).toBeVisible();
  await expect(sidebar).toHaveCSS("position", "sticky");

  const beforeScroll = await version.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const afterScroll = await version.boundingBox();

  expect(beforeScroll).not.toBeNull();
  expect(afterScroll).not.toBeNull();
  expect(Math.abs((afterScroll?.y ?? 0) - (beforeScroll?.y ?? 0))).toBeLessThanOrEqual(1);
  expect((afterScroll?.y ?? 0) + (afterScroll?.height ?? 0)).toBeLessThanOrEqual(600);
});

test("user can connect a goal with the weekly and daily plan", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");

  await page.getByRole("button", { name: "Cele", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kierunek działania" })).toBeVisible();
  await page.getByLabel("Rodzaj celu").selectOption("direction");
  await page.getByLabel("Nazwa celu").fill("Cel E2E");
  await page.getByLabel("Oczekiwany wynik").fill("Jeden wykonany krok tygodniowo");
  await page.getByLabel("Dlaczego to ważne").fill("Prywatny powód testowy");
  await page.getByRole("button", { name: "Zapisz cel" }).click();
  await expect(page.getByRole("heading", { name: "Cel E2E" })).toBeVisible();

  await page.getByLabel("Priorytet Cel E2E").check();
  const priorityCheckbox = page.getByLabel("Priorytet Cel E2E");
  const checkboxBox = await priorityCheckbox.boundingBox();
  expect(checkboxBox?.width).toBeLessThanOrEqual(20);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByLabel("Następny krok dla Cel E2E").fill("Wykonaj krok E2E");
  await page.getByRole("button", { name: "Zatwierdź tydzień" }).click();
  await expect(page.getByText("Zatwierdzony")).toBeVisible();

  await page.getByRole("button", { name: "Dzisiejsze zadania" }).click();
  await expect(page.getByRole("heading", { name: "Kierunek tygodnia" })).toBeVisible();
  const goalTask = page.locator("article.generated").filter({ hasText: "Wykonaj krok E2E" });
  await expect(goalTask).toBeVisible();
  await goalTask.getByRole("button", { name: "Wykonaj" }).click();

  await page.getByRole("button", { name: "Cele", exact: true }).click();
  await expect(page.getByText("Wykonano 1 z 1 zaplanowanych kroków.")).toBeVisible();
  await page.getByRole("button", { name: "Zapisz przegląd" }).click();

  const state = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}"), STORAGE_KEY);
  expect(state.settings.dataVersion).toBe(4);
  expect(state.goals).toHaveLength(1);
  expect(state.weeklyPlans[0].status).toBe("confirmed");
  expect(state.completions.some((item: { goalId?: string; weeklyStepId?: string }) => item.goalId && item.weeklyStepId)).toBe(true);
  expect(state.weeklyReviews).toHaveLength(1);
});

test("import previews data and snapshots both replacement directions", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/");
  await page.evaluate(async (storageKey) => {
    localStorage.clear();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("lifequest-rpg-backups-v1", 1);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => request.result.createObjectStore("snapshots", { keyPath: "id" });
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("snapshots", "readwrite");
        transaction.objectStore("snapshots").clear();
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
    localStorage.removeItem(storageKey);
  }, STORAGE_KEY);
  await page.reload();

  const originalName = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").profile.name, STORAGE_KEY);
  const importedJson = await page.evaluate((storageKey) => {
    const state = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    state.profile.name = "Imported E2E";
    return JSON.stringify(state);
  }, STORAGE_KEY);

  await page.getByRole("button", { name: /dane/i }).click();
  await page.screenshot({ path: "output/playwright/lifequest-v080-data-desktop.png", fullPage: true });
  await page.getByLabel("Albo wklej JSON").fill(importedJson);
  await page.getByRole("button", { name: "Przeanalizuj kopię" }).click();
  await expect(page.getByRole("heading", { name: "Podgląd danych" })).toBeVisible();
  expect(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").profile.name, STORAGE_KEY)).toBe(originalName);

  await page.getByRole("button", { name: "Zastąp dane i zachowaj kopię" }).click();
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").profile.name, STORAGE_KEY)).toBe("Imported E2E");
  const preImportCard = page.locator("article.snapshot-card").filter({ hasText: "Przed importem" }).first();
  await expect(preImportCard).toBeVisible();

  await preImportCard.getByRole("button", { name: "Przywróć" }).click();
  await expect(page.getByRole("button", { name: "Przywróć snapshot i zachowaj obecny stan" })).toBeVisible();
  await page.getByRole("button", { name: "Przywróć snapshot i zachowaj obecny stan" }).click();
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}").profile.name, STORAGE_KEY)).toBe(originalName);
  await expect(page.locator("article.snapshot-card").filter({ hasText: "Przed przywróceniem" }).first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "output/playwright/lifequest-v080-data-mobile.png" });
  expect(browserErrors).toEqual([]);
});

test("user can run and review a development experiment", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");

  await page.getByRole("button", { name: "Eksperyment" }).click();
  const source = page.locator(".source-button").first();
  const title = (await source.locator("strong").innerText()).trim();
  await source.click();
  const today = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
  await page.getByLabel("Start").fill(addLocalDays(today, -6));
  await page.getByLabel("Kontekst: kiedy / po czym").fill("Po śniadaniu przy biurku");
  const weekday = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"][new Date().getDay()];
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.uncheck();
  await page.getByText(weekday, { exact: true }).locator("..").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Rozpocznij eksperyment" }).click();
  await expect(page.getByText("Aktywny", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "output/playwright/lifequest-v090-experiment-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole("button", { name: "Eksperyment" }).click();
  await expect(page.getByText("Aktywny", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: "output/playwright/lifequest-v090-experiment-mobile.png" });

  await page.getByRole("button", { name: "Dzisiejsze zadania" }).click();
  const task = page.locator("article.generated").filter({ hasText: title });
  await expect(task).toBeVisible();
  const full = task.getByRole("button", { name: /Pełna wersja|Wykonaj/ });
  await full.click();

  await page.getByRole("button", { name: "Eksperyment" }).click();
  await page.getByRole("button", { name: "Zakończ i podsumuj" }).click();
  await page.getByRole("button", { name: "Zapisz przegląd" }).click();

  const state = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "{}"), STORAGE_KEY);
  expect(state.experiments).toHaveLength(1);
  expect(state.experiments[0].status).toBe("completed");
  expect(state.experimentReviews).toHaveLength(1);
  expect(state.completions.some((item: { experimentId?: string }) => item.experimentId === state.experiments[0].id)).toBe(true);
  expect(browserErrors).toEqual([]);
});
