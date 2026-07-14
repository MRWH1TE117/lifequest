# LifeQuest

Lokalny arkusz rozwoju osobistego z postepami, podsumowaniami okresow i lekka grywalizacja.

LifeQuest dziala lokalnie w przegladarce. Pomaga prowadzic cele, plan tygodnia, dzisiejsze zadania, automatyczny plan mikrocelow, habity, check-in dnia, obszary rozwoju, raporty okresowe i eksport/import danych JSON.

![LifeQuest dashboard](docs/assets/lifequest-dashboard.png)

## Co To Jest

LifeQuest to osobisty, lokalny panel rozwoju osobistego. Kod aplikacji jest publiczny, ale wszystkie cele, zadania, check-iny, notatki i snapshoty uzytkownika pozostaja lokalnie w jego przegladarce. Glowne zalozenie: codzienne zadania, zrodlowe habity i check-iny maja tworzyc czytelny arkusz postepu dla obszarow takich jak energia, cialo, umysl, skupienie, rozwoj, finanse i relacje.

## Technologia

Aplikacja jest napisana jako frontend webowy:

- React - interfejs aplikacji.
- TypeScript - typowanie danych, zadan, check-inow i podsumowan.
- Vite - szybki lokalny dev server i build.
- localStorage - glowny lokalny zapis aktywnych danych.
- IndexedDB - maksymalnie siedem lokalnych snapshotow bezpieczenstwa.
- Vitest - testy logiki domenowej.
- Playwright - test E2E i screenshoty aplikacji.
- lucide-react - ikony w UI.

Nie ma backendu, kont uzytkownikow ani chmury. Dane zostaja lokalnie, a eksport/import JSON jest przygotowany pod backup i przyszly workflow z Syncthing.

## Funkcje MVP

- Cele kierunkowe i wynikowe z kontrolowanym cyklem aktywny/wstrzymany/zakonczony.
- Plan tygodnia z 1-3 priorytetami, nastepnymi krokami, wersja minimum i planem przeszkod.
- Automatyczne przenoszenie niedokonczonych priorytetow do szkicu kolejnego tygodnia.
- Przeglad tygodnia oparty na wykonanych krokach, bez automatycznej interpretacji prywatnych notatek.
- Jeden aktywny eksperyment rozwojowy na 7 lub 14 dni, tworzony z habitu albo kroku tygodnia.
- Pelna i minimalna wersja eksperymentu, jawne powody pominiecia oraz wylacznie strukturalne podsumowanie wykonania.
- Dzisiejsze zadania z punktami XP.
- Automatyczny plan dnia z krokami celow oraz trybem: dzisiaj lekko, normalnie, mocny dzien.
- Profesjonalna biblioteka habitow z krotkimi notami zrodlowymi.
- Edycja wygenerowanych zadan przed wykonaniem.
- Dzienny check-in: sen, energia, nastroj i refleksja.
- Arkusz postepu dla okresow: dzien, tydzien, miesiac, 3M, 6M i 1R.
- KPI okresu: XP, wykonane zadania, najmocniejszy i najslabszy obszar.
- Mini wykres slupkowy XP wedlug obszarow.
- Profil z poziomem, XP, seria check-inow i obszarami rozwoju.
- Zarzadzanie recznymi zadaniami.
- Raport tygodniowy.
- Wersjonowane kopie `lifequest-backup-RRRR-MM-DD-GGMMSS.json` z podgladem przed importem.
- Automatyczny snapshot dzienny, snapshot reczny oraz kopie przed importem i przywracaniem.
- Status lokalnego zapisu, prosba o trwaly magazyn przegladarki i widoczny alert bledu zapisu.

## Uruchomienie

Najprosciej na Windows:

```powershell
.\start-lifequest.cmd
```

Skrypt instaluje zaleznosci, jesli brakuje katalogu `node_modules`, uruchamia lokalny serwer i otwiera panel w domyslnej przegladarce.

Recznie:

```powershell
npm install
npm run dev
```

Domyslny lokalny adres:

```text
http://127.0.0.1:5173
```

## Weryfikacja

```powershell
npm test
npm run build
npm run e2e
```

## Dane

LifeQuest zapisuje aktywny stan w localStorage i utrzymuje do siedmiu awaryjnych snapshotow w IndexedDB. Import najpierw pokazuje podsumowanie i nie zmienia danych do czasu potwierdzenia. Przed zastapieniem lub przywroceniem aplikacja zabezpiecza biezacy stan. Wersja danych 4 obejmuje cele, plany tygodniowe, eksperymenty i ich przeglady oraz zachowuje migracje starszych zapisow.

Do synchronizacji przez Syncthing wybierz zwykly folder i zapisuj w nim pobrane, datowane pliki `lifequest-backup-*.json`. Przegladarka nie zapisuje ich do tego folderu bezposrednio.
