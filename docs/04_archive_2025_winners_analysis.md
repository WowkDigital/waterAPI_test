---
doc_id: archive_2025_winners_analysis
title: "HackNation 2025 — Archiwum zadań, zwycięzców i wzorców wygrywających na edycję 2026"
edition_covered: "2025 (analiza porównawcza pod 2026)"
source_json: "../data/archive_2025.json"
status: "verified_against_sources"
language: "pl"
audience: ["participants", "ai_agents"]
---

# HackNation 2025 — Archiwum zadań, zwycięzców i wzorców wygrywających

Pierwsza edycja **HackNation** odbyła się **6–7 grudnia 2025 r.** w Bydgoskim Centrum Targowo-Wystawienniczym (BCTW). Według oficjalnych statystyk na stronie `hacknation.pl` przyciągnęła **blisko 1500 uczestników na miejscu**, którzy zgłosili **437 rozwiązań** w **16 wyzwaniach** (standardowa pula nagród: **25 000 PLN** na zadanie).

> [!NOTE]
> Zestawienie poniżej bazuje wyłącznie na faktach zebranych w `data/archive_2025.json` z oficjalnych komunikatów (`gov.pl`, uczelnie PW/PWr/UKW, prasa branżowa). Płynące stąd wzorce są kluczowe przy wyborze zadania i projektowaniu MVP na HackNation 2026.

---

## 1. Pełny katalog 16 wyzwań i zwycięzców (2025)

| # | Zadanie | Partner / Sponsor | Zwycięzca | Projekt / Kluczowa technologia |
|---|---|---|---|---|
| 1 | *Bydgoszcz – Ścieżki Pamięci 2.0* | Urząd Miasta Bydgoszcz | **Adrian Michalski** *(solo)* | **`052 Quest`** — interaktywna gra miejska z AI rozpoznawaniem zabytków/pomników |
| 2 | *Cyfrowy nieśmiertelnik* | Komenda Główna PSP (KG PSP) | **WiWav** | Cyfrowa identyfikacja i narzędzie zwiększające bezpieczeństwo strażaków podczas akcji ratowniczych |
| 3 | *Gaming: Los decyduje* | Totalizator Sportowy | **All ink** | Gra loteryjna inspirowana marką Lotto |
| 4 | *Scenariusze jutra* | Ministerstwo Spraw Zagranicznych (MSZ) | **Maciej Kopiec** *(z Ireneuszem Dawidowiczem i Dawidem Rutkowskim)* | **`AIDA`** (*Automated Intelligent Data Analysis*) — system prognozowania trendów dyplomatycznych |
| 5 | *Odnalezione zguby* | Ministerstwo Cyfryzacji (MC) | **OneMoreFix** | System one-stop dla gmin do rejestracji i wyszukiwania rzeczy znalezionych |
| 6 | *Zobacz to, czego nie widać* | JSW IT Systems | **CombAIns** *(studenci PW)* | Computer Vision / AI mierzące szerokość taśmy przenośnika górniczego i raportujące defekty segmentów |
| 7 | *Wyszukiwarka anomalii* | MF – Krajowa Administracja Skarbowa (KAS) | **MEWA** | Segmentacja semantyczna + YOLO porównujące skany RTG pojazdów ze wzorcami referencyjnymi (wykrywanie przemytu przy niskim FPR) |
| 8 | *Kontrola zakładów wzajemnych* | MF – Krajowa Administracja Skarbowa (KAS) | **Extempore** | Zautomatyzowany monitoring AI 24/7 zgodności legalnych i nielegalnych zakładów wzajemnych |
| 9 | *AI w służbie decyzji* | Ministerstwo Sportu i Turystyki (MSiT) | **Programiści PWR** *(PWr White Hats)* | Asystent AI streszczający akta spraw, ekstrahujący dokumenty, śledzący terminy i generujący projekty decyzji administracyjnych |
| 10 | *ZUS Accident Notification Tool* | Zakład Ubezpieczeń Społecznych (ZUS) | **kanapowcy** | Cyfrowe narzędzie zgłaszania wypadków (`ZANT`) |
| 11 | *Chmura pod kontrolą* | Centralny Port Komunikacyjny (CPK) | **HackStorm** | **`D.R.W.A.L.`** — klasyfikacja chmur punktów LiDAR dla infrastruktury kolejowej zgodna ze standardami BIM |
| 12 | *Ścieżka prawa* | MC + Grupa Robocza ds. AI | **Code Casimir** *(reprezentanci UKW Bydgoszcz)* | Real-time tracker legislacyjny (Next.js + Supabase) integrujący Sejm, RCL i ELI z alertami konsultacji oraz podsumowaniami AI i OSR (RIA) |
| 13 | *Prawda w sieci* | Centralny Ośrodek Informatyki (COI) | **no signal** | **`mZaufanaStrona`** — widget QR na stronach `.gov.pl` skanowany przez mObywatela do niezależnej weryfikacji domeny/TLS przez centralny backend |
| 14 | *Zgrany budżet* | Ministerstwo Cyfryzacji (MC) | **kurki** | Wielo-departamentowe planowanie budżetu urzędu z synchronizacją wersji, limitów i komentarzy |
| 15 | *Indeks Branż* | PKO Bank Polski (PKO BP) | **Dominik (`kozlowski_d`)** *(solo)* | **`Industrial Risk Monitor`** — prognozowanie kondycji i ryzyka sektorowego |
| 16 | *Dane bez twarzy* | NASK | **Habanero Code** | Techniki PET (*Privacy-Enhancing Technologies*) — anonimizacja i maskowanie PII w dużych publicznych zbiorach danych |

---

## 2. Podział wyzwań według domeny technologicznej (2025)

1. **AI Workflow & Dokumenty Administracyjne (5 zadań):** *Scenariusze jutra* (`AIDA`), *AI w służbie decyzji*, *Ścieżka prawa*, *Indeks Branż* (`Industrial Risk Monitor`), *Kontrola zakładów wzajemnych*.
   - **Cechy wygranych:** integracja oficjalnych publicznych źródeł danych (Sejm/RCL/ELI, akta spraw, rejestry domen) zamiast generycznego czatu RAG.
2. **Computer Vision, Geoprzestrzeń & Przemysł (3 zadania):** *Zobacz to, czego nie widać* (JSW), *Wyszukiwarka anomalii* (KAS RTG), *Chmura pod kontrolą* (CPK LiDAR/BIM).
   - **Cechy wygranych:** konkretne metryki techniczne i nacisk na redukcję fałszywych alarmów (*low false positives* w zadaniu KAS) lub zgodność ze standardem branżowym (BIM w zadaniu CPK).
3. **E-Usługi Obywatelskie & Cyfrowe Bezpieczeństwo (5 zadań):** *Bydgoszcz – Ścieżki Pamięci 2.0*, *Odnalezione zguby*, *ZUS Accident Notification Tool*, *Prawda w sieci* (`mZaufanaStrona`), *Dane bez twarzy* (NASK PET).
   - **Cechy wygranych:** bezbłędny przepływ end-to-end (np. skan QR -> weryfikacja TLS w centralnym backendzie) oraz natychmiastowa gotowość do demonstracji z perspektywy obywatela lub urzędnika.
4. **Systemy Operacyjne Urzędów, Ratownictwo & Rozrywka (3 zadania):** *Cyfrowy nieśmiertelnik* (KG PSP), *Zgrany budżet* (MC), *Gaming: Los decyduje* (Totalizator Sportowy).

---

## 3. Wygrane Solo vs. Zespołowe — co działa najlepiej?

W edycji 2025 co najmniej **dwa zadania zostały wygrane przez pojedynczych uczestników (solo)** mimo dominacji 3–6-osobowych zespołów:
- **Adrian Michalski** (*Urząd Miasta Bydgoszcz* — `052 Quest`),
- **Dominik (`kozlowski_d`)** (*PKO BP* — `Industrial Risk Monitor`).

**Dlaczego solo lub mały zespół (2–3 os.) potrafi wygrać z 6-osobowym składem?**
1. **Brak narzutu komunikacyjnego** przy 24-godzinnym sprintcie (od 11:00 w sobotę do 11:00 w niedzielę).
2. **Jednolity stos technologiczny i wąski, dobrze domknięty scenariusz demo** zamiast przeładowanej architektury mikroserwisowej.
3. **Zrozumienie "bólu" zamawiającego:** np. *Industrial Risk Monitor* dostarczył gotowy dashboard decyzyjny dla analityków ryzyka zamiast akademickiego notebooka ML.

---

## 4. Konkretne lekcje i wzorce wygrywające na HackNation 2026

Na podstawie analizy zwycięzców z 2025 r. oraz ciągłości partnerów w 2026 r. (**COI, NASK, MF/KAS, MSZ, ZUS, MC, Miasto Bydgoszcz**) warto stosować następujące reguły:

1. **Rozwiązuj wąski problem operacyjny urzędnika lub inspektora, nie ogólny problem AI:**
   - W 2025 r. wygrywały narzędzia dające *audytowalne artefakty* (projekt decyzji administracyjnej z cytowaniem akt, lista defektów segmentów taśmy, raport niezgodności budżetu, weryfikacja TLS w mObywatelu).
2. **Projektuj pod 2-etapową ocenę (Draft 20:00 -> Final 11:00 -> Pitching TOP 5):**
   - W I etapie ocenia się prezentację PDF + repozytorium/opis (i opcjonalne wideo demo 2 min) — rozwiązanie musi wyglądać wiarygodnie "na papierze" i mieć mierzalną odpowiedź na każde kryterium z karty zadania.
   - W II etapie (TOP 5) liczy się wyłącznie występ na żywo (punkty z I etapu **nie przechodzą** dalej). Wygrane z 2025 r. (jak `mZaufanaStrona`, `D.R.W.A.L.`, `AIDA`, `MEWA`) miały jednoznaczną, chwytliwą nazwę produktu i czytelny przepływ demo.
3. **Niski odsetek False Positives > wysoki Recall w zadaniach detekcji i compliance (MF/KAS, NASK, Cyber):**
   - Zespół **MEWA** podkreślił minimalizację fałszywych alarmów w kontroli RTG KAS; ten sam wzorzec będzie kluczowy w zadaniach z 2026 r. dotyczących cyberbezpieczeństwa (*Attack Surface Intelligence* dla NASK, *Risk Miner* dla MF/KAS) oraz detekcji deepfake/dezinformacji.
4. **Integracja z ekosystemem GovTech (mObywatel, ELI/RCL/Sejm, e-Doręczenia, dane publiczne):**
   - Wszędzie tam, gdzie partnerem jest **COI, MC, MSZ lub MF/KAS**, wpięcie rozwiązania w istniejące standardy państwowe (zamiast budowania izolowanej wyspy) znacząco podnosi ocenę wykonalności wdrożenia po hackathonie (tym bardziej że regulamin z 2026 r. wprost zakłada nabycie praw autorskich przez inicjatora zadania na podstawie art. 921 § 3 KC).
5. **Budżet czasowy na weryfikację danych wejściowych:**
   - Pełne treści zadań, zbiory danych i dokładne wagi kryteriów są ujawniane dopiero w sobotę o **11:00**. W 2025 r. wygrywały zespoły, które w ciągu pierwszych 60–90 minut po publikacji paczki zamrażały zakres MVP pod konkretny format danych partnera.
