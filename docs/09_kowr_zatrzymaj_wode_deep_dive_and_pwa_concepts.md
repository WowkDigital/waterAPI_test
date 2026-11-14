---
doc_id: kowr_zatrzymaj_wode_deep_dive_and_pwa_concepts
title: "ZATRZYMAJ WODĘ, CHROŃ PLONY (KOWR) — Otwarte API, silnik hydro-agronomiczny i 5 koncepcji PWA Real-Time dla 1–2 osób"
edition: "2026"
source_json: "../data/kowr_water_crops_research.json"
status: "verified_against_sources"
language: "pl"
audience: ["participants", "ai_agents"]
---

# ZATRZYMAJ WODĘ, CHROŃ PLONY (KOWR) — Przewodnik techniczny i produktowy (1–2 os. / PWA / Real-Time)

Zadanie **Krajowego Ośrodka Wsparcia Rolnictwa (KOWR)** to prawdopodobnie kategoria o **najniższym przewidywanym tłoku** na HackNation 2026, a jednocześnie obszar, w którym **bez żadnego klucza API i w pełni za darmo** masz dostęp do kompletu polskich i europejskich danych geodezyjnych, hydrologicznych i meteorologicznych. Połączenie **PWA (Progressive Web App)** z **powiadomieniami w czasie rzeczywistym** (Web Push + live telemetry) idealnie trafia w realną lukę rynkową — rolnicy nie potrzebują kolejnego skomplikowanego pulpitu GIS, tylko szybkiej decyzji na telefonie wtedy, kiedy woda spada albo ucieka z pola.

---

## 1. Zrozumienie problemu oczami KOWR i rolnika

1. **Polski paradoks wodny (susza + gwałtowne ulewy):** Stare systemy melioracyjne projektowano w Polsce niemal wyłącznie jako **odwadniające**, by szybko odprowadzać nadmiar wody z pól. W efekcie podczas nawalnych deszczy woda spływa bezpowrotnie do rzek, a tydzień później rośliny cierpią z powodu suszy rolniczej (straty w skali kraju liczone w miliardach złotych rocznie). Kluczem jest **mała retencja** (zastawki piętrzące w rowach, oczka wodne, utrzymanie wody tam, gdzie spadnie) oraz **retencja glebowa** (materia organiczna, poplony, uproszczenia uprawowe).
2. **Dlaczego KOWR jest inicjatorem wyzwania?** KOWR gospodaruje **Zasobem Własności Rolnej Skarbu Państwa** (dzierżawa gruntów rolnych, przeciwdziałanie degradacji gleb) oraz wspiera wdrażanie innowacji i teledetekcji w rolnictwie (monitoring upraw i suszy, m.in. wskaźnik DISS). Narzędzie powinno chronić plony **rolników i dzierżawców**, a opcjonalnie dawać również czytelny obraz ryzyka na poziomie gruntów/gminy.
3. **Ekosystem finansowania jako argument wdrożeniowy dla Jury:** Rozwiązanie, które łączy alert z podpowiedzią programową (np. zwiększony do **2,8 mld zł** budżet inwestycji środowiskowo-klimatycznych w Planie Strategicznym WPR, **Ekoschematy ARiMR** premiujące retencjonowanie wody i poplony, czy **Lokalne Partnerstwa Wodne / spółki wodne**), wygląda w oczach urzędników jak produkt gotowy do wdrożenia państwowego.
4. **Dlaczego PWA + Real-Time Alerting bije ciężkie portale GIS?** Na polu zasięg bywa słaby (tu błyszczy cache **Service Workera** w PWA), rolnik nie chce instalować aplikacji ze sklepu i rejestrować konta z 15 polami — woli kliknąć swoją działkę na mapie lub podać GPS w traktorze i dostać na ekran blokady konkretny komunikat typu **„Przed 14:00 zamknij zastawkę R-2 — inaczej z Twojej 6-hektarowej działki ucieknie ~900 m³ wody”**.

---

## 2. Ściąga techniczna: Bezpłatne API i otwarte dane (bez kluczy API!)

Wszystkie poniższe źródła można łączyć ze sobą **po współrzędnych GPS (`lat`, `lon` / `EPSG:2180`)** oraz **kodzie TERYT gminy/powiatu** — bez rejestracji, umów i płatnych limitów.

| Źródło / API | Baza URL | Auth / CORS | Co dokładnie zwraca i jak użyć |
|---|---|---|---|
| **IMGW-PIB `warningsmeteo`** | `https://danepubliczne.imgw.pl/api/data/warningsmeteo` | Brak klucza / CORS OK | Aktywne ostrzeżenia meteo (burze, ulewy, przymrozki, wiatr) z tablicą kodów `teryt`, stopniem, czasem ważności i treścią. |
| **IMGW-PIB `warningshydro`** | `https://danepubliczne.imgw.pl/api/data/warningshydro` | Brak klucza / CORS OK | Ostrzeżenia o suszy hydrologicznej i gwałtownych wezbraniach (`kod_zlewni`, `obszary`, `stopień`). |
| **IMGW-PIB `meteo`** | `https://danepubliczne.imgw.pl/api/data/meteo` | Brak klucza / CORS OK | Gęsta sieć stacji automatycznych: `temperatura_powietrza`, **`temperatura_gruntu`**, `opad_10min`, `wiatr_srednia_predkosc`. Świetne do alertów na żywo! |
| **IMGW-PIB `synop` & `hydro`** | `.../api/data/synop`<br>`.../api/data/hydro` | Brak klucza / CORS OK | Synop: `wilgotnosc_wzgledna`, `suma_opadu`, `cisnienie`. Hydro: `stan_wody`, `stan_ostrzegawczy`, `stan_alarmowy`, `przeplyw` na wodowskazach. *(Słowniki współrzędnych stacji: `dane.imgw.pl`)*. |
| **GUGiK ULDK** | `https://uldk.gugik.gov.pl/` | Brak klucza | Po kliknięciu na mapie lub GPS zwraca dokładne granice działki ewidencyjnej, nazwę gminy, obręb oraz ID TERYT działki. |
| **GUGiK NMT (1m × 1m ALS)** | `https://services.gugik.gov.pl/nmt/` | Brak klucza | Zwraca dokładną wysokość n.p.m. (`Z` w m) dla punktu lub całego poligonu działki (`min`/`max`, spadek terenu i kierunek spływu wody). |
| **Open-Meteo Agro/Soil** | `https://api.open-meteo.com/v1/forecast` | Brak klucza / CORS OK | Godzinowa prognoza wilgotności gleby (`soil_moisture_0_to_1cm`, `1_to_3cm`, `3_to_9cm`), **FAO-56 $ET_0$** (`et0_fao_evapotranspiration` w $\text{mm/h}$), **VPD** (`vapour_pressure_deficit` w $\text{kPa}$) i opadów. |
| **Geoportal WMS (kafelki map)** | `mapy.geoportal.gov.pl/wss/service/...` | Brak klucza | Gotowe warstwy wizualne do **Leaflet / MapLibre**: Ortofotomapa, Mapa Hydrograficzna Polski (rowy, cieki, zlewnie!) oraz Mapa Glebowo-Rolnicza. |
| **IUNG-PIB SMSR (Metodologia)** | `susza.iung.pulawy.pl` *(brak otwartego JSON API)* | Własna kalkulacja / WMS w Geoportalu | Jawna metodologia **KBW** (`Opad - ET0`) oraz **4 kategorie podatności gleb na suszę wg WOD** (dla ~2477 gmin i upraw). |

### Gotowe przykłady zapytań (Copy-Paste Ready)

```bash
# 1. Działka ewidencyjna z GPS / kliknięcia na mapie (współrzędne WGS84: lon,lat w srid=4326)
curl "https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=18.0084,53.1235&result=geom_wkt,voivodeship,county,commune,region,parcel,teryt&srid=4326"

# 2. Działka po identyfikatorze (np. znamy numer działki)
curl "https://uldk.gugik.gov.pl/?request=GetParcelById&id=141201_1.0001.1867/2&result=geom_wkt,voivodeship,county,commune,region,parcel"

# 3. Wysokość n.p.m. z Numerycznego Modelu Terenu (PUWG 1992 = EPSG:2180, konwersja przez proj4js)
curl "https://services.gugik.gov.pl/nmt/?request=GetHbyXY&x=630889.87&y=497178.59"

# 4. Wilgotność gleby, ET0, VPD, temperatura gruntu i opady na kolejne 7 dni (Open-Meteo)
curl "https://api.open-meteo.com/v1/forecast?latitude=53.1235&longitude=18.0084&hourly=precipitation,precipitation_probability,et0_fao_evapotranspiration,vapour_pressure_deficit,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_temperature_0cm,wind_speed_10m&timezone=Europe/Warsaw"

# 5. Aktywne alerty meteo i pomiary z sieci automatycznej IMGW (JSON; dopisz /format/csv dla CSV)
curl "https://danepubliczne.imgw.pl/api/data/warningsmeteo"
curl "https://danepubliczne.imgw.pl/api/data/warningshydro"
curl "https://danepubliczne.imgw.pl/api/data/meteo"
```

**Warstwy WMS do podłączenia jednym wywołaniem w Leaflet / MapLibre:**
- Ortofotomapa standardowa: `https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution`
- Mapa Hydrograficzna Polski *(widzisz rowy melioracyjne i cieki przy polu!)*: `http://mapy.geoportal.gov.pl/wss/service/img/guest/HYDRO/MapServer/WMSServer`
- Mapa Glebowo-Rolnicza: `https://mapy.geoportal.gov.pl/wss/service/pub/guest/MapaGlebowoRolnicza/MapServer/WMSServer`

---

## 3. Deterministyczny silnik hydro-agronomiczny (zero halucynacji LLM!)

Zgodnie ze wzorcem zwycięzców HackNation 2025 (**MEWA**, **D.R.W.A.L.**), kluczowe wyliczenia powinny być **w 100% deterministyczne i przejrzyste**, a LLM może pełnić najwyżej rolę tłumacza na prosty język dla rolnika:

1. **Przelicznik na objętość wody na konkretnej działce ($\text{m}^3$):**
   - `1 mm` opadu lub ewapotranspiracji $ET_0$ to dokładnie `1 litr/m²` = **`10 m³` wody na `1 ha`**.
   - Jeśli działka pobrana z ULDK ma powierzchnię $P_{\text{ha}}$, to `Bilans_m3 = P_ha * 10 * (Opad_mm - ET0_mm)`. Dla rolnika informacja *„jutro stracisz 180 m³ wody z tego pola”* lub *„nadchodzi 1100 m³ darmowej wody”* ma nieporównywalnie większą siłę niż abstrakcyjne `18 mm`.
2. **Lokalny Klimatyczny Bilans Wodny (KBW wg IUNG) + Wrażliwość gleby:**
   - Uwzględnij 4 kategorie podatności gleb z metodologii SMSR IUNG (pojemność wodna **WOD** w profilu do 1,5 m):
     - **Kategoria I (bardzo podatna, WOD `< 127,5 mm`):** piaski luźne (`pl`), słabo gliniaste (`ps`) — najkrótszy bufor, alarm suszowy uruchamia się najszybciej.
     - **Kategoria II (podatna, WOD `127,5–169,9 mm`):** piaski gliniaste lekkie i mocne (`pgl`, `pgm`).
     - **Kategoria III (średnio podatna, WOD `170–202,5 mm`):** gliny lekkie (`gl`), pyły zwykłe (`płz`).
     - **Kategoria IV (mało podatna, WOD `> 202,5 mm`):** gliny średnie/ciężkie (`gs`, `gc`), iły (`i`).
3. **Analiza spadku i kierunku odpływu z GUGiK NMT:**
   - Z poligonu działki (ULDK) wybierasz 5–9 punktów (rogi + środek, zamiana do `EPSG:2180`), odpytujesz `services.gugik.gov.pl/nmt/`.
   - Wyliczasz różnicę wysokości $\Delta H$, spadek w `%` oraz **dokładny kierunek (azymut), w którą stronę spłynie woda z działki** i gdzie leży najniższy punkt (idealny na mikro-retencję / oczko / kontrolę rowu).
4. **Progi alertów Real-Time z Open-Meteo + IMGW `meteo`:**
   - **Alert Retencyjny (Złap Wodę):** prognoza `precipitation` $\ge 15\text{ mm}$ w 24h **oraz** wykryty spadek terenu z NMT $\ge 2\%$ → powiadomienie Push: *„Za 6 godzin nad działką przejdzie ulewa (+X m³ wody). Zamknij zastawkę / zabezpiecz spływ na południowo-wschodniej granicy pola!”*.
   - **Alert Stresu Wodnego (VPD):** `vapour_pressure_deficit > 1.6 kPa` → rośliny zamykają aparaty szparkowe lub tracą ogromne ilości wody; nawadnianie/oprysk w tych godzinach daje gigantyczne straty.
   - **Alert Przymrozku Przygruntowego:** `temperatura_gruntu` (IMGW `meteo`) lub `soil_temperature_0cm` $\le 2^\circ\text{C}$ → natychmiastowy Push ochrony upraw wrażliwych.

---

## 4. 5 koncepcji rozwiązań pod zespół 1–2 osobowy (PWA + Real-Time Alerting)

### Koncepcja 1: **WodoStrażnik Pola** — Osobisty Dyspozytor Wodny Działki (PWA + Web Push)
- **Co robi:** Rolnik otwiera lekką aplikację PWA, klika swoją działkę na mapie (lub używa GPS w polu — ULDK automatycznie pobiera granice i ha) i wybiera rodzaj uprawy + kategorię gleby. System w tle monitoruje 24/7 API IMGW + Open-Meteo + rzeźbę terenu NMT i wysyła **powiadomienia Web Push z dokładną liczbą $\text{m}^3$ wody** i jedną konkretną czynnością (*„Zamknij zastawkę przed 15:00”*, *„Wyłącz deszczownię między 11:00 a 17:00 — VPD 2,1 kPa”*).
- **Siła dla 1–2 osób:** Najniższe ryzyko techniczne, brak potrzeby wieloosobowego zespołu. Service Worker obsługuje tryb offline i prawdziwy **Web Push (VAPID)**.
- **Demo WOW na scenie:** Wybierasz losową działkę pod Bydgoszczą → aplikacja rysuje wektor spływu wody z NMT → jednym przyciskiem „Symuluj alert burzowy / stres VPD” wyzwala **prawdziwe powiadomienie Push na Twoim smartfonie** z wyliczonym bilansem $\text{m}^3$.

### Koncepcja 2: **Waze dla Wody Rolniczej (Zlewnia Live)** — Sąsiedzka Koordynacja Zastawek i Alertów
- **Co robi:** W Polsce regulacja wody na rowie melioracyjnym często nie działa, bo sąsiad wyżej otwiera, a sąsiad niżej zamyka zastawkę bez komunikacji. PWA łączy **automatyczne alerty hydrologiczno-meteo IMGW (`warningshydro`, `hydro`)** z **sąsiedzką siecią czasu rzeczywistego (WebSockets / SSE / Supabase Realtime)**: jednym kliknięciem na telefonie rolnik zgłasza w swojej mikrozlewni: `Zamykam zastawkę`, `Rów zatorowany`, `Woda stoi na polu`, `Susza w cieku` — a wszyscy rolnicy wzdłuż tego rowu dostają natychmiastowy alert na żywo.
- **Siła dla 1–2 osób:** Idealnie wykorzystuje Twoje mocne strony (PWA + systemy powiadamiania ludzi w czasie rzeczywistym).
- **Demo WOW na scenie:** Dwa okna / dwa telefony obok siebie (Rolnik A w górze zlewni + Rolnik B poniżej i Spółka Wodna): jedno kliknięcie na telefonie A w ułamku sekundy przelicza mapę zlewni na ekranie B i wysyła alert Push o nadchodzącej zmianie poziomu wody.

### Koncepcja 3: **Okno Polowe 24h** — Real-Time Semafor Zabiegów Chroniących Wodę i Plon
- **Co robi:** Zamiast wykresów pogodowych, które rolnik musi sam interpretować, PWA pokazuje **48-godzinną linię czasu w postaci semafora (Zielone / Żółte / Czerwone)** dla 4 decyzji chroniących wodę i plon: (1) Piętrzenie na zastawce, (2) Agrotechnika zamykająca parowanie (np. włókowanie / mulcz), (3) Nawadnianie bez strat parowania (okno z niskim $VPD$ i wiatrem), (4) Bezpieczny oprysk bez zmycia przez deszcz. Alert Push budzi rolnika wyłącznie wtedy, gdy pojawia się lub zamyka kluczowe okno.
- **Siła dla 1–2 osób:** Całość zasilana jednym lekkim zapytaniem Open-Meteo + IMGW `meteo` + NMT; maksymalna inwestycja idzie w bezbłędny mobile UX w rękawiczkach / w słońcu w kabinie ciągnika.
- **Demo WOW na scenie:** Juror od razu rozumie wartość finansową — widać dokładnie o której godzinie wjechać w pole lub zakręcić wodę, żeby nie spalić paliwa i nie stracić wody.

### Koncepcja 4: **SuszaRadar & Retencja+** — Bilans KBW Live + Kalkulator Zysku i Ekoschematów ARiMR
- **Co robi:** Monitoruje bieżący lokalny **KBW** i wilgotność warstw gleby (`0–1 cm`, `1–3 cm`, `3–9 cm`) względem progów IUNG dla wybranej gminy/gleby, a równocześnie **wylicza stratę ekonomiczną z odpływu wody** i automatycznie dopasowuje konkretne praktyki oraz dopłaty z **Planu Strategicznego WPR (2,8 mld zł)** i **Ekoschematów ARiMR** (retencjonowanie wody na gruntach ornych, poplony, zwiększanie próchnicy).
- **Siła dla 1–2 osób:** Połączenie reguł dopłat z żywym bilansem KBW daje mocny argument biznesowo-administracyjny bez żadnego ciężkiego ML.
- **Demo WOW na scenie:** Rolnik widzi nie tylko *„stracisz 400 m³ wody”*, ale też *„zastosuj międzyplon / piętrzenie — odzyskasz X wody i kwalifikujesz działkę do Ekoschematu na kwotę ok. Y zł”*.

### Koncepcja 5: **KOWR Zasób Live (Dual-View)** — System Wczesnego Ostrzegania dla Dzierżawców i KOWR
- **Co robi:** Produkt szyty dokładnie pod instytucję wystawiającą zadanie (KOWR zarządza Zasobem WRSP):
  1. **Widok Dzierżawcy (Mobilne PWA + Push):** obsługa pojedynczych działek (alerty KBW, VPD, ulewy, kierunek spływu NMT, szybkie raportowanie z pola).
  2. **Widok Zarządcy Zasobu KOWR (Live Dashboard):** mapa agregująca dzierżawione działki z indeksem ryzyka suszy/odpływu i rekomendacjami inwestycji retencyjnych do uwzględnienia przy przetargach/dzierżawie.
- **Siła dla 1–2 osób:** Ten sam backend i te same dane ULDK/NMT/IMGW/Open-Meteo obsługują oba widoki (filtr po 1 działce vs agregacja listy działek).
- **Demo WOW na scenie:** Urzędnik KOWR w Jury widzi bezpośrednio narzędzie gotowe do własnej pracy z dzierżawcami gruntów Skarbu Państwa.

---

## 5. Rekomendacja na 24h dla zespołu 1–2 osobowego („Killer MVP”)

Najwyższą szansę na wygranie zarówno Etapu 1 (wideo 2 min + PDF), jak i Etapu 2 (żywe demo na scenie) daje **połączenie Koncepcji 1 + Koncepcji 2 + lekkiego trybu dla KOWR (z Koncepcji 5)**:

> **Główna idea MVP — „WodoStrażnik Pola” (PWA + Real-Time Alerty Działki i Zlewni):**
> 1. **Krok 1 (Onboarding w 10 sekund):** Klikasz działkę na mapie Geoportalu (Ortofotomapa + warstwa Hydrograficzna WMS) → **ULDK** pobiera poligon, ha i kod TERYT gminy; **NMT** liczy spadek i rysuje strzałki kierunku odpływu wody.
> 2. **Krok 2 (Żywy Bilans & Okna):** Deterministyczny silnik łączy **Open-Meteo** ($ET_0$, VPD, wilgotność gleby) + **IMGW** (`warningsmeteo`, `warningshydro`, `meteo` temperatura gruntu) + kategorię gleby IUNG i tłumaczy to na **$\text{m}^3$ wody** oraz 4 proste statusy na osi czasu.
> 3. **Krok 3 (Prawdziwy Real-Time na żywo):** PWA rejestruje **Web Push (Service Worker)** oraz łączy się przez **WebSocket / SSE** z „Tablicą Sąsiedzkiej Zlewni”. Rolnik zgłasza zamknięcie zastawki lub nadmierny spływ na swoim odcinku rowu, a sąsiad poniżej (i podgląd KOWR) widzi aktualizację na mapie i dostaje natychmiastowy alert Push.

### Co można przygotować przed sobotą 21.11 (z jawnym oznaczeniem w PDF zgodnie z FAQ), a co zrobić na miejscu?
- **Przed sobotą (`T-7` do `T-1`, jawnie oznaczone jako szkielet/research):**
  - Zweryfikuj w małym skrypcie testowym odpowiedzi JSON/WKT z `uldk.gugik.gov.pl`, `services.gugik.gov.pl/nmt/`, `danepubliczne.imgw.pl` oraz `api.open-meteo.com` i przygotuj funkcję konwersji `WGS84 <-> EPSG:2180` (`proj4js`).
  - Przygotuj czysty boilerplate **PWA** (manifest, Service Worker z Web Push VAPID, Leaflet/MapLibre z podpiętymi WMS Geoportalu) oraz spis 4 kategorii gleb IUNG i progów VPD/KBW.
- **Sobota `11:00` – Niedziela `11:00` (na hali BCTW):**
  - `11:00–12:00`: Przeczytaj pełną kartę KOWR (sprawdź, czy dali własny dataset, wagi kryteriów i czy doszli mentorzy KOWR — skonsultuj kierunek w Hali nr 1!).
  - `12:00–17:00`: Budowa rdzenia backendu/workerów (ULDK + NMT + Open-Meteo + IMGW + silnik $\text{m}^3$ / wektora spływu) + zapis działki.
  - `17:00–20:00`: **Draft na HackTribe przed 20:00** + wdrożenie Web Push i real-time kanału zlewni (WebSockets/SSE).
  - `20:00–02:00`: Dopracowanie mobile UI PWA (semafor 48h, karta rekomendacji małej retencji / Ekoschematu, lekki widok agregacji dla KOWR) i test na prawdziwym smartfonie.
  - `07:00–09:00` (niedziela): Zamrożenie kodu, przycisk „Tryb Demo / Symulacja ulewy i stresu VPD” na wypadek spokojnej pogody w listopadzie (!), sprawdzenie trybu offline.
  - `09:00–10:30`: Nagranie stabilnego wideo demo ≤ 2 min z dwoma telefonami / powiadomieniem Push na żywo + złożenie PDF ≤ 10 MB przed `11:00`.

---

## 6. Istniejące systemy w Polsce — czego NIE powielać i czym wygrać przed Jury KOWR

Najczęstszy błąd na hackathonach GovTech to zaprezentowanie Jury „nowego pomysłu”, nad którym zamawiający pracuje już od lat. W polskim ekosystemie działa już 7 ważnych klas systemów — poniżej dokładna mapa luk, w które celuje Twoje PWA:

| Istniejący system / projekt | Co już robi w Polsce | Czego NIE ma (luka / ograniczenie) | Jak wykorzystać to na HackNation (inspiracja vs odcięcie się) |
|---|---|---|---|
| **S2MUR** *(System Satelitarnego Monitorowania Upraw Rolnych — KOWR + IGiK)* | Własny system finansowany z Planu Finansowego KOWR: całoroczny monitoring satelitarny upraw, suszy, wymoknięć i wymarznięć. | Narzędzie makro-analityczne dla administracji; nie wysyła alertów wyprzedzających na telefon rolnika i nie koordynuje zastawek na rowie. | **NIE buduj kolejnej przeglądarki zdjęć NDVI!** Pokaż architekturę gotową na odbieranie wskaźników z S2MUR jako warstwę wykonawczą „ostatniej mili”. |
| **eDWIN** *(WODR Poznań + 19 partnerów ODR)* | Darmowa platforma: *Wirtualne gospodarstwo* (karta pola, ŚOR, import ARiMR), sieć kilkuset stacji meteo, ostrzeżenia przed agrofagami i okna opryskowe. | Skupiony na ochronie chemicznej (agrofagi); wymaga ręcznego wpisywania faz roślin i stałego internetu (brak offline PWA); brak analizy spływu NMT, bilansu `m³` i małej retencji. | **Inspiracja:** czytelne „okna zabiegowe”. **Przewaga:** zero ręcznej konfiguracji (1 klik na działce ULDK), działanie offline w traktorze i 100% fokusu na wodę. |
| **SMSR IUNG-PIB** + **„Zgłoś szkodę rolniczą”** *(MRiRW)* | 60-dniowy, dekadowy monitoring KBW dla ~2477 gmin i 4 kategorii gleb pod protokoły strat i pomoc suszową. | Działa **ex-post (po szkodzie)** i w rozdzielczości całej gminy — nie mówi rolnikowi, jak uratować wodę z ulewy za 12 godzin. | Pozycjonuj aplikację jako **prewencję zanim trzeba będzie użyć „Zgłoś szkodę rolniczą”**, z precyzją do konkretnej działki ewidencyjnej. |
| **Agrometeo IMGW** + **Hydroportal ISOK / „Stop Suszy!”** *(Wody Polskie)* | Pasywne mapy i tabele meteo/hydro oraz strategia małej retencji *„Stop Suszy! Start Retencji!”* (melioracje odwrócone). | Użytkownik musi sam regularnie wchodzić i przekopywać się przez portale; brak personalizowanych alertów Push i przeliczenia na `m³`. | Wykorzystaj darmowe API IMGW jako źródło pod **aktywny Web Push** i mów językiem programu *Stop Suszy!* (zastawki, spółki wodne). |
| **SatAgro / OneSoil** *(komercyjne SaaS)* | Satelitarny monitoring stresu roślin + mapy zmiennego dawkowania nawozów (VRA) dla dużych farm. | Płatne subskrypcje; brak darmowych narzędzi sąsiedzkiej retencji i doradztwa pod Ekoschematy wodne. | Podkreśl brak bariery kosztowej (`0 zł`) i natychmiastowe działanie bez logowania skomplikowanych maszyn. |
| **Metos (Pessl) i projekty IoT NCBiR** *(inteligentna melioracja)* | Fizyczne stacje pogodowe/glebowe na polu oraz zdalnie sterowane zastawki GSM/LTE. | Wysoki koszt sprzętu (tysiące PLN na jedno pole) blokuje masowe wdrożenie w małych gospodarstwach i spółkach wodnych. | Zaprezentuj PWA jako **„wirtualny czujnik działki za 0 zł”** (na danych Open-Meteo + NMT + IMGW), z możliwością podpięcia czujników IoT w etapie II. |
| **WaterFolder** *(atlas PANDa)* | Kalkulatory inżynierskie do wymiarowania zbiorników retencyjnych w miastach i dla budownictwa. | Skrojone pod miejską betonową kanalizację deszczową i inżynierów sanitarnych, nie pod grunty orne. | **Inspiracja UX:** przejmij ideę błyskawicznego kalkulatora objętości retencji (`m³`), ale przeliczoną na hektary pola i rów melioracyjny. |

### 4 konkretne inspiracje projektowe na slajd „Przewaga Konkurencyjna”
1. **S2MUR to oczy KOWR z kosmosu — Twoje PWA to „ręce w polu”:** Na pitchu przed KOWR warto wprost powiedzieć: *„Wiemy o istnieniu systemu S2MUR. Nie budujemy kolejnej mapy NDVI. Rozwiązujemy lukę ostatniej mili między monitoringiem makro a codzienną decyzją rolnika i spółki wodnej w czasie rzeczywistym”*.
2. **Bezpieczeństwo offline z lekcji eDWIN:** Jedną z głównych bolączek *eDWIN* na wsi jest wymóg stałego internetu. Zastosowanie PWA z buforowaniem w **Service Workerze** od razu adresuje ten problem.
3. **Kalkulator `m³` z inspiracji WaterFolder:** Pokazanie rolnikowi objętości zatrzymanej wody w `m³` i kierunku spływu z GUGiK NMT czyni fizykę hydrologii namacalną w 3 sekundy.
4. **Zerowy koszt wejścia względem IoT:** Zanim spółka wodna lub dzierżawca KOWR dostanie dotację na fizyczne czujniki poziomu wody i zautomatyzowane zastawki, Twoje PWA już dziś wysyła bezpłatne alerty spływu i pozwala sąsiadom koordynować ręczne zastawki jednym tapnięciem.
