---
title: HackNation 2026 — Agent Context Manifest & Knowledge Base Index
edition: 2026 (2nd edition)
event_dates: 2026-11-21 to 2026-11-22
location: Bydgoskie Centrum Targowo-Wystawiennicze (BCTW), ul. Gdańska 187, Bydgoszcz
last_verified: 2026-11-14T14:00:00+01:00
source_coverage:
  - https://hacknation.pl/ (full HTML/SSR & JS crawl)
  - https://transporthacknation.pl/ (SSR & booking metadata)
  - Official PDFs: Regulamin, Załącznik nr 1, Polityka Prywatności, Przewodnik Uczestnika PL, Tutorial HackTribe PL
  - HackNation 2025 archive via gov.pl, rp.pl, chip.pl, itreseller.pl, pw.edu.pl, pwr.edu.pl
---

# AGENTS.md — Baza wiedzy HackNation 2026 dla agentów AI

Ten katalog zawiera kompletną, zweryfikowaną źródłowo bazę wiedzy o hackathonie **HackNation 2026** (oraz archiwum edycji **HackNation 2025**), przygotowaną specjalnie do szybkiego przetwarzania przez agenty AI wspierające uczestnika/zespół przed i w trakcie 24-godzinnego maratonu w Bydgoszczy.

## 1. Mapa plików (Routing kontekstu dla agenta AI)

| Plik | Format | Przeznaczenie dla agentów AI |
|---|---|---|
| `data/event_overview.json` | JSON | Metadane wydarzenia, daty, hala nr 1 i 2 BCTW, organizatorzy, operator PROIDEA, oficjalne URL-e i kontakty zespołu |
| `data/challenges_2026.json` | JSON | Wszystkie opublikowane Zadania Partnerskie 2026 (10 z 15 zapowiedzianych), pule nagród, powiązani mentorzy instytucjonalni, rekomendacje tech stack i strategie wygranej |
| `data/archive_2025.json` | JSON | Wszystkie 16 zadań i zwycięzców z HackNation 2025 (6–7.12.2025), streszczenia zwycięskich projektów i wzorce sukcesu |
| `data/sponsors_profiles.json` | JSON | Profile instytucjonalne wszystkich partnerów zadań i organizatorów (MC, GovTech, Bydgoszcz, MF/KAS, MSZ, MFiPR, COI, NASK, ZUS, KOWR, AGH, PCI + sygnały dot. UKNF/IBE/OPI) |
| `data/agenda_and_logistics.json` | JSON | Harmonogram 21–22.11.2026, tabela 18 odjazdów bezpłatnych autokarów z linkami Google Maps, shuttle PKP Bydgoszcz Główna ↔ BCTW, strefy obiektu, checklista |
| `data/rules_and_evaluation.json` | JSON | Skondensowane zasady z Regulaminu, Przewodnika i Tutoriala HackTribe (warunki formalne, IP, 2-etapowe ocenianie, terminy 20:00 i 11:00) |
| `data/challenges_decision_matrix.json` | JSON | Wielokryterialna macierz decyzyjna (12 kryteriów × 10 zadań), matching pod 7 profili uczestnika oraz benchmark pokrewnych polskich hackathonów (HackYeah, Supervision_hack, DISINFOHACK, #OtwarteDane) |
| `data/kowr_water_crops_research.json` | JSON | Pogłębiony research zadania KOWR „ZATRZYMAJ WODĘ, CHROŃ PLONY”: otwarte API (IMGW, ULDK, NMT, Open-Meteo, Geoportal WMS, IUNG KBW/gleby), wzory deterministyczne i 5 koncepcji PWA Real-Time dla 1–2 osób |
| `docs/01_overview_and_faq.md` | Markdown | Przegląd wydarzenia i pełne Q&A z oficjalnego FAQ (38 pytań) |
| `docs/02_regulamin_and_evaluation.md` | Markdown | Analiza prawna i proceduralna: regulamin, HackTribe workflow, polityka IP (przeniesienie praw vs open source), ocena Etap 1 / Etap 2 |
| `docs/03_challenges_2026_catalog.md` | Markdown | Katalog wyzwań 2026 z rekomendacjami architektonicznymi AI/Data/Cybersec/UX oraz analizą potencjalnych brakujących 5 zadań |
| `docs/04_archive_2025_winners_analysis.md` | Markdown | Studium 16 zwycięzców HackNation 2025: co przekonało jury i jak przełożyć to na 2026 |
| `docs/05_sponsors_and_stakeholders_profile.md` | Markdown | Profil psychologiczno-instytucjonalny sponsorów GovTech (analiza na podstawie wyzwań i składu 105 mentorów) |
| `docs/06_trip_plan_agenda_and_logistics.md` | Markdown | Kompletny plan wyjazdu, rozkład jazdy z 18 miast, shuttle w Bydgoszczy, układ hal BCTW i checklista |
| `docs/07_challenges_decision_matrix_and_deep_dive.md` | Markdown | Wielokryterialna analiza 10 opublikowanych zadań (12 kryteriów), dopasowanie pod 7 archetypów uczestnika i protokół wyboru o 11:00 |
| `docs/08_polish_hackathons_benchmark_and_success_factors.md` | Markdown | Benchmark polskich hackathonów (HackYeah, Supervision_hack, MF/KAS, DISINFOHACK, #OtwarteDane, CuValley Hack) i 10 czynników sukcesu |
| `docs/09_kowr_zatrzymaj_wode_deep_dive_and_pwa_concepts.md` | Markdown | Kompendium techniczne zadania KOWR: otwarte API bez kluczy, silnik m3/NMT/VPD/KBW oraz 5 koncepcji PWA + Real-Time dla 1–2 osób |
| `raw/` | Raw Archive | Surowe pobrane pliki HTML, SSR, JS, 5 oficjalnych PDF-ów oraz lista 105 mentorów (`raw/extracted/mentors_parsed.json`) |

## 2. Executive Summary (Najważniejsze fakty operacyjne)

1. **Termin i czas kodowania:** **21–22 listopada 2026 r.** w **BCTW Bydgoszcz** (ul. Gdańska 187). Rejestracja otwiera się o **08:00** w sobotę. Kodowanie trwa równe **24 godziny**: od **11:00 w sobotę 21.11** do **11:00 w niedzielę 22.11**.
2. **Skala i profil wydarzenia:** Druga edycja największego hackathonu wdrożeniowego administracji publicznej w Polsce (1. edycja w grudniu 2025 zgromadziła ~1500 uczestników i 437 zgłoszeń w 16 zadaniach z nagrodami po 25 000 PLN). Główni organizatorzy: **Ministerstwo Cyfryzacji**, **Departament GovTech Polska**, **Miasto Bydgoszcz**; operator wykonawczy: **PROIDEA sp. z o.o.**
3. **Krytyczne deadline'y na platformie HackTribe:**
   - **Sobota 21.11, godz. 20:00 — Draft Checkpoint (OBOWIĄZKOWY):** Do tej godziny projekt musi być założony na **HackTribe** (język angielski; link zaproszeniowy na Discordzie `#ogłoszenia`). Po 20:00 nie można tworzyć nowych projektów ani zmieniać Zadania Partnerskiego!
   - **Niedziela 22.11, godz. 11:00 — Final Submission (TWARDY DEADLINE):** Wgranie prezentacji **PDF (max 10 MB)**, opisu, linków do repozytorium/demo i (zalecane) **wideo demo do 2 minut**. Po 11:00 zmiany nie są brane pod uwagę.
4. **Dwuetapowe ocenianie:**
   - **Etap 1 (niedziela 11:00–14:45):** Ocena w HackTribe (kryteria 0–10 z wagami zadania). Minimum regulaminowe do nagrody: 50% punktów. **TOP 5 zespołów** z każdego zadania awansuje do finału (ogłoszenie o 14:45 na Discordzie).
   - **Etap 2 (niedziela od 15:15):** Wyniki Etapu 1 **NIE przechodzą do finału**. Prezentacje na żywo + Q&A przed Jury (nie są nagrywane). Zwycięzcę wyłania głosowanie zwykłą większością głosów.
5. **Start w dwóch zadaniach:** Zespół (1–6 osób) może wystartować w max. 2 zadaniach, ale w HackTribe jeden Team Leader może założyć tylko 1 projekt — drugi projekt musi założyć inny członek zespołu (lub drugie konto przy starcie solo). Odradza się zgłaszanie identycznego projektu do dwóch zadań m.in. ze względu na kolizję przeniesienia praw autorskich.
6. **Transport (UWAGA na deadline 17.11!):** Zapisy na bezpłatne autokary z **18 lokalizacji w Polsce** na `https://transporthacknation.pl/` trwają tylko do **17.11.2026 godz. 23:00 CET** (`2026-11-17T22:00:00Z`). Powrót w niedzielę ok. **18:30**.
7. **Pule zadań 2026:** Zapowiedziano **15 wyzwań od 15 partnerów**, z czego **10** jest już opublikowanych na `/zadania` (`RISK MINER`, `ATTACK SURFACE INTELLIGENCE`, `RADAR INNOWACJI`, `KOMPAS KOMPETENCJI`, `KOLEKCJONER FEJKÓW`, `CYFRYZACJA FORMULARZY`, `PRZEWODNIK PRZYSZŁEJ MAMY`, `OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW`, `PRAWDOWID`, `ZATRZYMAJ WODĘ, CHROŃ PLONY`). Pozostałe zadania i pełne specyfikacje pojawią się najpóźniej **21.11 o 11:00**.

## 3. Instrukcje dla agentów AI korzystających z tej bazy

Gdy użytkownik poprosi o pomoc w doborze zadania, architekturze lub przygotowaniu do HackNation 2026:
1. **Najpierw zapytaj / sprawdź preferencje zespołu:** miasto wyjazdu (sprawdź `data/agenda_and_logistics.json`), wielkość i kompetencje zespołu (AI/ML, Backend, Frontend/UX, Cybersec, GIS, Prawo/Finanse), preferowany poziom ryzyka (zadanie już znane z 10 opublikowanych vs czekanie na pozostałe 5 do 11:00 w sobotę).
2. **Stosuj „Filozofię GovTech HackNation” (na bazie analizy 2025 + profilu 105 mentorów 2026):**
   - Wygrywają rozwiązania **wdrożeniowe, wyjaśnialne i bezpieczne**, rozwiązujące konkretny ból operacyjny urzędnika, analityka lub obywatela — nie generyczne czatboty.
   - Gdzie w grę wchodzą przepisy/finanse/świadczenia (ZUS, MF/KAS, MFiPR, MC), oddziel **deterministyczną logikę/reguły/dane źródłowe** od warstwy językowej LLM (zero halucynacji, pełne cytowanie źródeł).
   - Przygotuj **2-minutowe wideo demo** i **PDF ≤ 10 MB** tak, by juror (który ma dosłownie kilka minut w Etapie 1) zrozumiał problem, architekturę i działający efekt w 60 sekund.
3. **Weryfikuj fakty przed kodowaniem na miejscu:** O **11:00 w sobotę 21.11** przeanalizuj nowo opublikowany szczegółowy opis wybranego zadania (kryteria punktowe, wagi, udostępnione zbiory danych i zapis o prawach autorskich/licencji) oraz umów krótką weryfikację pomysłu z **Mentorem Instytucjonalnym** w Hali nr 1 lub na Discordzie.
